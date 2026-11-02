import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// =====================================
// 1. FIREBASE CONFIGURATION
// =====================================
const firebaseConfig = {
  apiKey: "AIzaSyAG6Tok0tpu6cS0a7FWUxlCihhflf-hNOY",
  authDomain: "isseg-connect-07-aca76.firebaseapp.com",
  projectId: "isseg-connect-07-aca76",
  storageBucket: "isseg-connect-07-aca76.firebasestorage.app",
  messagingSenderId: "675499884709",
  appId: "1:675499884709:web:bdd9b54588981717bbcd4c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================
// 2. TOAST & ERREURS
// =====================================
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) { alert(message); return; }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => { toast.classList.remove("show"); }, 3500);
}

function getAuthError(code) {
  const errors = {
    "auth/email-already-in-use": "Cet email est déjà utilisé.",
    "auth/invalid-email": "Email invalide.",
    "auth/weak-password": "Mot de passe trop court (6 caractères min).",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/network-request-failed": "Vérifie ta connexion Internet.",
    "permission-denied": "Accès refusé par Firebase (vérifie les règles)."
  };
  return errors[code] || "Erreur : " + (code || "inconnue");
}

// =====================================
// 3. INTERFACES
// =====================================
function showAuthentication() {
  document.getElementById("auth").hidden = false;
  document.getElementById("appInterface").hidden = true;
}

function showApplication() {
  document.getElementById("auth").hidden = true;
  document.getElementById("appInterface").hidden = false;
  window.showPage("home");
}

// =====================================
// 4. NAVIGATION
// =====================================
window.showPage = function (pageId, button = null) {
  document.querySelectorAll("#appInterface .page").forEach(page => page.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  if (pageId === 'messages') {
    loadStudentsDirectory();
  }

  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  if (button) button.classList.add("active");
  window.scrollTo(0, 0);
};

// =====================================
// 5. INSCRIPTION
// =====================================
async function registerStudent(data) {
  const { firstName, lastName, email, password, department, program, level } = data;

  if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
    throw new Error("Veuillez remplir les champs principaux.");
  }

  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    await updateProfile(credential.user, { displayName: fullName });

    // On tente d'enregistrer le profil, mais si ça échoue, l'utilisateur est quand même créé
    try {
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName,
        email: credential.user.email,
        institution: "ISSEG",
        department: department || "Non défini",
        program: program || "Non défini",
        level: level || "Non défini",
        role: "student",
        verificationStatus: "approved",
        photoURL: "",
        createdAt: serverTimestamp()
      });
    } catch (dbError) {
      console.warn("Profil non enregistré dans Firestore, mais compte créé:", dbError);
    }

    showToast("Inscription réussie. Bienvenue !");
    return credential.user;

  } catch (error) {
    showToast(getAuthError(error.code) || error.message);
    throw error;
  }
}

// =====================================
// 6. CONNEXION & DÉCONNEXION
// =====================================
async function loginStudent(email, password) {
  if (!email.trim() || !password) throw new Error("Saisis ton email et ton mot de passe.");
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  } catch (error) {
    throw new Error(getAuthError(error.code));
  }
}

async function logoutStudent() {
  try {
    await signOut(auth);
    showToast("Déconnexion réussie.");
  } catch (error) {
    showToast(getAuthError(error.code));
  }
}

// =====================================
// 7. SESSION & PROFIL (SÉCURISÉ)
// =====================================
async function loadStudentProfile(user) {
  try {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);
    
    if (profileSnapshot.exists()) {
      return profileSnapshot.data();
    }
  } catch (e) {
    console.warn("Impossible de lire le profil Firestore, utilisation des données Auth.");
  }

  // Si le profil n'existe pas ou si Firestore bloque, on utilise les infos de base d'Auth
  return {
    uid: user.uid,
    fullName: user.displayName || user.email.split('@')[0],
    email: user.email,
    program: "Étudiant",
    level: "ISSEG"
  };
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showAuthentication();
    return;
  }

  try {
    const student = await loadStudentProfile(user);
    
    const name = student.fullName || "Étudiant";
    const welcomeEl = document.getElementById("welcomeName");
    const profileEl = document.getElementById("profileName");
    const programEl = document.getElementById("profileProgram");

    if (welcomeEl) welcomeEl.textContent = "Bonjour, " + name + " 👋";
    if (profileEl) profileEl.textContent = name;
    if (programEl) programEl.textContent = `${student.program || "Étudiant"} · ${student.level || ""}`;
    
    showApplication();
    listenToPosts();

  } catch (error) {
    console.error("Erreur session :", error);
    // QUOI QU'IL ARRIVE, on affiche l'application si l'utilisateur est connecté
    showApplication();
    showToast("Connecté, mais certaines données sont indisponibles.");
  }
});

// =====================================
// 8. FORMULAIRES
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showLogin = document.getElementById("showLogin");
  const showRegister = document.getElementById("showRegister");

  showLogin?.addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;
    showLogin.classList.add("active");
    showRegister.classList.remove("active");
  });

  showRegister?.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
    showRegister.classList.add("active");
    showLogin.classList.remove("active");
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = "Connexion...";
    try {
      await loginStudent(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value
      );
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Se connecter";
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = registerForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = "Inscription...";
    
    const data = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("registerEmail").value,
      password: document.getElementById("registerPassword").value,
      department: document.getElementById("department").value,
      program: document.getElementById("program").value,
      level: document.getElementById("level").value
    };

    try {
      await registerStudent(data);
      registerForm.reset();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Créer mon compte";
    }
  });
});

// =====================================
// 9. FIL D'ACTUALITÉ (POSTS)
// =====================================
const postsRef = collection(db, "posts");

window.promptPost = async function() {
  const text = prompt("Quoi de neuf sur le campus ?");
  if (!text || text.trim() === "") return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(postsRef, {
      authorId: user.uid,
      authorName: user.displayName || "Étudiant",
      content: text.trim(),
      createdAt: serverTimestamp(),
      likes: []
    });
    showToast("Publication réussie !");
  } catch (error) {
    console.error("Erreur post:", error);
    showToast("Erreur : impossible de publier (vérifie les règles Firestore).");
  }
};

function listenToPosts() {
  const demoPost = document.querySelector(".post-card:not(.real-post)");
  if (demoPost) demoPost.remove();

  const q = query(postsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    document.querySelectorAll(".real-post").forEach(el => el.remove());

    const composer = document.querySelector(".post-composer");

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postElement = document.createElement("article");
      postElement.className = "post-card real-post";
      
      let dateStr = "À l'instant";
      if (post.createdAt) {
        try {
          dateStr = new Date(post.createdAt.toMillis()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        } catch(e) {}
      }

      postElement.innerHTML = `
        <div class="post-header">
          <div class="post-avatar avatar-blue">${(post.authorName || "E").charAt(0)}</div>
          <div class="post-author">
            <strong>${post.authorName || "Étudiant"}</strong>
            <small>${dateStr}</small>
          </div>
        </div>
        <p class="post-text">${post.content}</p>
        <div class="post-reactions">
          <span>❤️ ${post.likes ? post.likes.length : 0} réactions</span>
        </div>
      `;
      
      if (composer) composer.insertAdjacentElement('afterend', postElement);
    });
  }, (error) => {
    console.warn("Erreur d'écoute des posts (vérifie les règles Firestore) :", error);
  });
}

// =====================================
// 10. ANNUAIRE
// =====================================
async function loadStudentsDirectory() {
  const container = document.getElementById("messages");
  if (!container) return;
  
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const currentUser = auth.currentUser;
    
    let html = `<div class="page-title"><h2>Annuaire</h2><p>Tes camarades de l'ISSEG.</p></div>`;
    let count = 0;
    
    usersSnapshot.forEach(docSnap => {
      const student = docSnap.data();
      if (student.uid !== currentUser.uid) {
        count++;
        html += `
          <div class="conversation-card">
            <div class="conversation-avatar avatar-purple">${(student.fullName || "E").charAt(0)}</div>
            <div>
              <strong>${student.fullName || "Étudiant"}</strong>
              <p>${student.program || "Filière"} - ${student.level || ""}</p>
            </div>
          </div>
        `;
      }
    });

    if (count === 0) html += `<p style="text-align:center; color:#777; margin-top:20px;">Aucun autre étudiant pour le moment.</p>`;
    container.innerHTML = html;
  } catch (error) {
    console.error("Erreur annuaire:", error);
    container.innerHTML = `<div class="page-title"><h2>Annuaire</h2></div><p style="color:red; text-align:center;">Erreur de connexion à la base de données.</p>`;
  }
}

// =====================================
// 11. SERVICE WORKER
// =====================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}

window.ISSEG_AUTH = { registerStudent, loginStudent, logoutStudent };