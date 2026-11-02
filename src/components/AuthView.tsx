import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Lock, Mail, User, GraduationCap, Building2, BookOpen, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onNotify }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [department, setDepartment] = useState('Sciences');
  const [program, setProgram] = useState('Mathématiques-Physique');
  const [level, setLevel] = useState('Licence 1');
  const [registerIne, setRegisterIne] = useState('');
  const [registerCardImage, setRegisterCardImage] = useState<string | null>(null);

  // Password Security Firewall evaluation
  const getPasswordFirewallScore = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const pwdScore = getPasswordFirewallScore(registerPassword);

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 850;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setRegisterCardImage(canvas.toDataURL('image/jpeg', 0.78));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getFriendlyError = (err: any): string => {
    const code = err?.code || '';
    if (code.includes('auth/email-already-in-use')) return 'Cet email est déjà associé à un compte.';
    if (code.includes('auth/invalid-email')) return 'Adresse email invalide.';
    if (code.includes('auth/weak-password')) return 'Mot de passe trop court pour le pare-feu de sécurité.';
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (code.includes('auth/network-request-failed')) return 'Erreur de connexion. Vérifie ton réseau.';
    return err?.message || 'Une erreur est survenue lors de l\'authentification.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onNotify('Bienvenue sur ISSEG Connect !', 'success');
    } catch (err: any) {
      const msg = getFriendlyError(err);
      setError(msg);
      onNotify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mandatory data verification for all users
    if (!firstName.trim() || !lastName.trim() || !registerEmail.trim() || !registerPassword || !registerConfirmPassword || !registerPhone.trim()) {
      setError('Exigence de sécurité : Tout le monde doit fournir ses données complètes (nom, email, téléphone, filière, etc.).');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (pwdScore < 50) {
      setError('Pare-feu de sécurité : Le mot de passe est trop faible. Il doit comporter au moins 8 caractères avec un mélange de lettres et de chiffres.');
      return;
    }

    const cleanIne = registerIne.trim().toUpperCase();
    if (!cleanIne) {
      setError('Numéro INE obligatoire pour la vérification académique.');
      return;
    }

    if (!registerCardImage) {
      setError('Veuillez fournir la photo de votre Carte Unique de l\'Étudiant ISSEG.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email: registerEmail,
        password: registerPassword,
        department,
        program,
        level,
        ine: cleanIne,
        studentCardPhotoUrl: registerCardImage,
        bio: `Étudiant(e) à l'ISSEG Lambanyi · Contact : ${registerPhone.trim()}`
      });
      onNotify('Compte créé avec succès ! Bienvenue à l\'ISSEG.', 'success');
    } catch (err: any) {
      const msg = getFriendlyError(err);
      setError(msg);
      onNotify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onNotify('Connexion Google réussie !', 'success');
    } catch (err: any) {
      const msg = getFriendlyError(err);
      setError(msg);
      onNotify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper demo accounts for fast testing
  const fillDemoStudent = () => {
    setLoginEmail('etudiant@isseg.edu.gn');
    setLoginPassword('isseg2025');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fc] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-white p-2 shadow-sm border border-slate-100 flex items-center justify-center">
            <img
              src="/isseg-logo.png"
              alt="Logo ISSEG"
              className="w-full h-full object-contain"
              onError={(e) => {
                // fallback if relative path issues
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-[#10152f] tracking-wide">
            ISSEG <span className="text-[#0878b9]">CONNECT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Connecte-toi · Partage · Apprends · Réussis
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'login'
                ? 'bg-[#10152f] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'register'
                ? 'bg-[#10152f] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Inscription
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="etudiant@isseg.edu.gn"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0878b9] hover:bg-[#07558c] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Amadou"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Bah"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse email universitaire</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="amadou.bah@isseg.edu.gn"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone / WhatsApp (Guinée) *</label>
              <input
                type="tel"
                required
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                placeholder="+224 620 00 00 00"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Mot de passe (Sécurisé par Pare-feu) *</span>
                <span className={`text-[10px] font-bold ${
                  pwdScore >= 75 ? 'text-emerald-600' : pwdScore >= 50 ? 'text-amber-600' : 'text-rose-500'
                }`}>
                  {pwdScore >= 75 ? '🛡️ Pare-feu Sécurisé' : pwdScore >= 50 ? '🟡 Force Moyenne' : '⚠️ Faible (Min 8 car.)'}
                </span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="8 caractères minimum avec chiffres et lettres"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                />
              </div>

              {/* Firewall Security Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pwdScore >= 75 ? 'bg-emerald-500' : pwdScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(pwdScore, 10)}%` }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Département</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                >
                  <option value="Sciences">Sciences</option>
                  <option value="Lettres et sciences humaines">Lettres et sciences humaines</option>
                  <option value="Langues">Langues</option>
                  <option value="Autre">Autre département</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Filière</label>
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                  >
                    <option value="Mathématiques-Physique">Mathématiques-Physique</option>
                    <option value="Physique-Chimie-Technologie">Physique-Chimie-Techno</option>
                    <option value="Biologie-Géologie-Chimie">Biologie-Géologie-Chimie</option>
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Géographie-Économie">Géographie-Économie</option>
                    <option value="Philosophie-Histoire-ECM">Philosophie-Histoire-ECM</option>
                    <option value="Autre">Autre filière</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niveau</label>
                <div className="relative">
                  <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
                  >
                    <option value="Licence 1">Licence 1</option>
                    <option value="Licence 2">Licence 2</option>
                    <option value="Licence 3">Licence 3</option>
                    <option value="Master 1">Master 1</option>
                    <option value="Master 2">Master 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Numéro INE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro INE (sur votre carte d'étudiant)
              </label>
              <input
                type="text"
                value={registerIne}
                onChange={(e) => setRegisterIne(e.target.value.toUpperCase())}
                placeholder="Ex : BAMH0504463138"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
              />
            </div>

            {/* Carte d'Étudiant Capture */}
            <div className="bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Carte Unique de l'Étudiant</span>
                <span className="text-[10px] text-[#0878b9] font-semibold">Format officiel ISSEG</span>
              </label>
              {registerCardImage ? (
                <div className="text-center space-y-1.5">
                  <div className="max-h-32 overflow-hidden rounded-xl border border-emerald-300">
                    <img src={registerCardImage} alt="Carte Unique" className="w-full h-auto object-contain max-h-32 mx-auto" />
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold block">✓ Photo de la carte prête</span>
                </div>
              ) : (
                <label className="border border-dashed border-blue-300 hover:border-[#0878b9] rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-white text-xs text-slate-600 font-semibold transition-colors">
                  <span>📸 Ajouter la photo de ma carte</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCardFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0878b9] hover:bg-[#07558c] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte étudiant'}
            </button>
          </form>
        )}

        {/* Google sign-in */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuer avec Google
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Espace réservé aux étudiants et enseignants de l'ISSEG de Lambanyi.
        </p>
      </div>
    </div>
  );
};
