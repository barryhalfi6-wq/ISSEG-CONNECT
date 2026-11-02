import {
  db,
  auth,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  handleFirestoreError,
  OperationType
} from '../firebase';
import {
  UserProfile,
  PostItem,
  CommentItem,
  GroupItem,
  GroupMessageItem,
  ConversationItem,
  DirectMessageItem,
  CourseDocItem,
  NotificationItem,
  StageLogItem
} from '../types';

// ==========================================
// 1. PROFILES
// ==========================================
export async function getStudentProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStudentProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      createdAt: profile.createdAt || serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllStudents(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ==========================================
// 2. POSTS & COMMENTS
// ==========================================
export function subscribeToPosts(callback: (posts: PostItem[]) => void) {
  const path = 'posts';
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const items: PostItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<PostItem, 'id'>) });
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function createPost(post: {
  authorId: string;
  authorName: string;
  authorProgram?: string;
  content: string;
  department?: string;
  tag?: string;
  mediaUrl?: string;
  isOfficial?: boolean;
  poll?: { question: string; options: { id: string; text: string; votes: string[] }[] };
  isQuestion?: boolean;
}): Promise<string> {
  const path = 'posts';
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...post,
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleLikePost(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserPosts(userId: string, callback: (posts: PostItem[]) => void) {
  const path = 'posts';
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', userId),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const items: PostItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<PostItem, 'id'>) });
    });
    items.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// -------------------------------------------------------------
// COMPTE IA ACADÉMIQUE : Publications didactiques automatiques
// -------------------------------------------------------------
export const AI_DIDACTIC_POSTS_BANK = [
  {
    content: "💡 Conseil Didactique du Jour :\nDans l'Approche Par Compétences (APC) en vigueur en Guinée, évitez de donner la règle avant l'exemple. Partez toujours d'une situation-problème concrète tirée du quotidien de l'élève (ex: le marché de Madina, le fleuve Niger, la vie communautaire) pour susciter le besoin d'apprendre.",
    tag: '#DidactiqueIA',
    topic: 'Méthodologie APC'
  },
  {
    content: "📘 Pratique de Classe en Stage :\nPour une gestion efficace du tableau noir à deux battants : divisez votre tableau en 3 colonnes distinctes :\n1️⃣ À gauche : Rappels, date et plan de la leçon\n2️⃣ Au centre : Déroulement de la séance, schémas et calculs\n3️⃣ À droite : Nouveau vocabulaire, mots difficiles et devoirs à la maison.",
    tag: '#StagePratique',
    topic: 'Gestion du Tableau'
  },
  {
    content: "🧠 Motivation & Climat Scolaire :\nUn élève qui a peur du maître ne peut pas développer sa pensée critique. Privilégiez l'erreur constructive : lorsqu'un élève se trompe en classe, valorisez sa participation et demandez à un camarade de l'aider avec bienveillance à identifier le point de blocage.",
    tag: '#Psychopédagogie',
    topic: 'Climat de classe'
  },
  {
    content: "📊 Évaluation Formative vs Sommative :\nL'évaluation formative ne sert pas à noter ou sanctionner l'élève, mais à réguler votre propre enseignement ! Si plus de 40% de vos élèves échouent à un exercice d'application, cela signifie que la phase d'institutionnalisation doit être reprise différemment.",
    tag: '#Docimologie',
    topic: 'Évaluation'
  },
  {
    content: "🔬 Didactique des Sciences Expérimentales :\nLe manque de matériel de laboratoire n'est pas un frein : utilisez la méthode 'Expérimentation avec du matériel local' (bouteilles plastiques, eau de chaux artisanale, graines germées locales). C'est le cœur même de la didactique moderne à l'ISSEG Lambanyi.",
    tag: '#SciencesDidactique',
    topic: 'Matériel Local'
  },
  {
    content: "✍️ Didactique du Français & Expression Écrite :\nAvant de faire rédiger une production d'écrit aux élèves de collège (9ème - 10ème année), faites toujours une séance préalable de constitution de 'boîte à mots' (champ lexical, connecteurs logiques, verbes d'action). L'inspiration s'appuie d'abord sur la maîtrise des outils de la langue.",
    tag: '#FrançaisDidactique',
    topic: 'Production Écrite'
  }
];

export async function publishAIBotInsight(forceIndex?: number): Promise<string> {
  const path = 'posts';
  try {
    const idx = forceIndex !== undefined ? forceIndex : Math.floor(Math.random() * AI_DIDACTIC_POSTS_BANK.length);
    const chosen = AI_DIDACTIC_POSTS_BANK[idx];
    const docRef = await addDoc(collection(db, 'posts'), {
      authorId: 'isseg-ia-bot',
      authorName: 'Assistant Didactique IA 🤖',
      authorProgram: 'Intelligence Pédagogique ISSEG',
      department: 'Sciences de l\'Éducation',
      content: chosen.content,
      tag: chosen.tag,
      isOfficial: true,
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function checkAndSeedAIBotIfEmpty(): Promise<void> {
  try {
    const q = query(collection(db, 'posts'), where('authorId', '==', 'isseg-ia-bot'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      await publishAIBotInsight(0);
    }
  } catch (error) {
    console.warn('Could not auto-seed AI post:', error);
  }
}

export async function votePoll(postId: string, optionId: string, userId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data() as PostItem;
    if (!postData.poll) return;

    const updatedOptions = postData.poll.options.map((opt) => {
      const filtered = (opt.votes || []).filter((uid) => uid !== userId);
      if (opt.id === optionId) {
        filtered.push(userId);
      }
      return { ...opt, votes: filtered };
    });

    await updateDoc(postRef, {
      'poll.options': updatedOptions
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setBestAnswer(postId: string, commentId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await updateDoc(doc(db, 'posts', postId), {
      resolvedAnswerId: commentId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToComments(postId: string, callback: (comments: CommentItem[]) => void) {
  const path = `posts/${postId}/comments`;
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const items: CommentItem[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as Omit<CommentItem, 'id'>) });
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addComment(postId: string, comment: {
  authorId: string;
  authorName: string;
  content: string;
}): Promise<void> {
  const path = `posts/${postId}/comments`;
  try {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      ...comment,
      createdAt: serverTimestamp()
    });
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentsCount || 0;
      await updateDoc(postRef, { commentsCount: currentCount + 1 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// 3. STUDY GROUPS
// ==========================================
export function subscribeToGroups(callback: (groups: GroupItem[]) => void) {
  const path = 'groups';
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const items: GroupItem[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as Omit<GroupItem, 'id'>) });
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function createStudyGroup(group: {
  name: string;
  description: string;
  department: string;
  creatorId: string;
  creatorName: string;
  icon?: string;
}): Promise<string> {
  const path = 'groups';
  try {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...group,
      members: [group.creatorId],
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleJoinGroup(groupId: string, userId: string, isMember: boolean): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: isMember ? arrayRemove(userId) : arrayUnion(userId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyGroup(groupId: string): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToGroupMessages(groupId: string, callback: (msgs: GroupMessageItem[]) => void) {
  const path = `groups/${groupId}/messages`;
  const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const list: GroupMessageItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<GroupMessageItem, 'id'>) });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function sendGroupMessage(groupId: string, message: {
  authorId: string;
  authorName: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
}): Promise<void> {
  const path = `groups/${groupId}/messages`;
  try {
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      groupId,
      ...message,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// 4. DIRECT MESSAGING (1-ON-1)
// ==========================================
export function getOrCreateConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

export async function ensureConversation(userId1: string, userName1: string, userId2: string, userName2: string): Promise<string> {
  const convId = getOrCreateConversationId(userId1, userId2);
  const path = `conversations/${convId}`;
  try {
    const convRef = doc(db, 'conversations', convId);
    // Write with merge so it creates if new without throwing getDoc errors
    await setDoc(convRef, {
      participants: [userId1, userId2],
      participantNames: {
        [userId1]: userName1 || 'Étudiant ISSEG',
        [userId2]: userName2 || 'Étudiant ISSEG'
      },
      updatedAt: serverTimestamp()
    }, { merge: true });
    return convId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToConversations(userId: string, callback: (convs: ConversationItem[]) => void) {
  const path = 'conversations';
  // Query only by participants to avoid requiring a composite index!
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: ConversationItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<ConversationItem, 'id'>) });
    });
    // Sort in memory to guarantee perfect ordering without index requirements
    list.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeToDirectMessages(conversationId: string, callback: (msgs: DirectMessageItem[]) => void) {
  const path = `conversations/${conversationId}/messages`;
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list: DirectMessageItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<DirectMessageItem, 'id'>) });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  content: string,
  audioUrl?: string,
  audioDuration?: number
): Promise<void> {
  const path = `conversations/${conversationId}/messages`;
  try {
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      conversationId,
      senderId,
      senderName,
      receiverId,
      content,
      audioUrl: audioUrl || null,
      audioDuration: audioDuration || null,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: audioUrl ? '🎤 Note vocale' : content,
      lastSenderId: senderId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// 5. DOCUMENTS & COURSES
// ==========================================
export function subscribeToDocuments(callback: (docs: CourseDocItem[]) => void) {
  const path = 'documents';
  const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: CourseDocItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<CourseDocItem, 'id'>) });
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function uploadCourseDocument(docData: {
  title: string;
  course: string;
  department: string;
  level: string;
  description?: string;
  authorId: string;
  authorName: string;
  fileType?: string;
  fileUrl?: string;
}): Promise<string> {
  const path = 'documents';
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...docData,
      downloadCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCourseDocument(docId: string): Promise<void> {
  const path = `documents/${docId}`;
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 6. NOTIFICATIONS
// ==========================================
export function subscribeToNotifications(userId: string, callback: (notes: NotificationItem[]) => void) {
  const path = 'notifications';
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: NotificationItem[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) });
    });
    list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 7. CARNET DE STAGE PRATIQUE (ISSEG DIDACTIQUE)
// ==========================================
export function subscribeToStageLogs(studentId: string, callback: (logs: StageLogItem[]) => void) {
  const path = `users/${studentId}/stages`;
  const q = query(collection(db, 'users', studentId, 'stages'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: StageLogItem[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<StageLogItem, 'id'>) }));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addStageLog(studentId: string, logData: Omit<StageLogItem, 'id' | 'createdAt'>): Promise<string> {
  const path = `users/${studentId}/stages`;
  try {
    const docRef = await addDoc(collection(db, 'users', studentId, 'stages'), {
      ...logData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteStageLog(studentId: string, logId: string): Promise<void> {
  const path = `users/${studentId}/stages/${logId}`;
  try {
    await deleteDoc(doc(db, 'users', studentId, 'stages', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
