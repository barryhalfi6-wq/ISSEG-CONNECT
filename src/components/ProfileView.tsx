import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  GraduationCap,
  Building2,
  Mail,
  Edit3,
  LogOut,
  Info,
  BookOpen,
  MapPin,
  CheckCircle2,
  X,
  Save
} from 'lucide-react';

interface ProfileViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (page: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNotify, onNavigate }) => {
  const { currentUser, profile, logout, updateProfileData } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState(profile?.firstName || '');
  const [editLastName, setEditLastName] = useState(profile?.lastName || '');
  const [editDepartment, setEditDepartment] = useState(profile?.department || 'Sciences');
  const [editProgram, setEditProgram] = useState(profile?.program || 'Mathématiques-Physique');
  const [editLevel, setEditLevel] = useState(profile?.level || 'Licence 2');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'IS';
    const p = name.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${editFirstName.trim()} ${editLastName.trim()}`;
      await updateProfileData({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        fullName,
        department: editDepartment,
        program: editProgram,
        level: editLevel,
        bio: editBio.trim()
      });
      setIsEditOpen(false);
      onNotify('Profil mis à jour avec succès !', 'success');
    } catch (err: any) {
      onNotify('Erreur mise à jour profil : ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Es-tu sûr de vouloir te déconnecter ?')) return;
    try {
      await logout();
      onNotify('Déconnexion réussie. À bientôt !', 'info');
    } catch (err: any) {
      onNotify('Erreur déconnexion', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 pt-4 px-3 sm:px-0">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-tr from-[#07558c] via-[#0878b9] to-[#8060ed] rounded-3xl p-6 text-white text-center shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-white text-[#0878b9] flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg mb-3 border-4 border-white/30">
          {getInitials(profile?.fullName)}
        </div>
        <h2 className="text-xl sm:text-2xl font-black">{profile?.fullName || 'Étudiant ISSEG'}</h2>
        <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
          {profile?.program || 'Filière'} · {profile?.level || 'Licence'}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200 mt-2 font-medium">
          <MapPin className="w-3.5 h-3.5" />
          <span>ISSEG · Lambanyi, Commune de Ratoma, Conakry</span>
        </div>

        {profile?.bio && (
          <p className="text-xs bg-white/10 rounded-2xl p-3 mt-4 text-blue-50 max-w-md mx-auto leading-relaxed backdrop-blur-xs">
            "{profile.bio}"
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center">
        <div className="space-y-0.5">
          <strong className="block text-lg font-black text-[#0878b9]">Étudiant</strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Statut</small>
        </div>
        <div className="space-y-0.5 border-x border-slate-100">
          <strong className="block text-lg font-black text-[#0878b9] truncate px-1">
            {profile?.department || 'Sciences'}
          </strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pôle</small>
        </div>
        <div className="space-y-0.5">
          <strong className="block text-lg font-black text-emerald-600">Vérifié</strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compte</small>
        </div>
      </div>

      {/* Action Options */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            setEditFirstName(profile?.firstName || '');
            setEditLastName(profile?.lastName || '');
            setEditDepartment(profile?.department || 'Sciences');
            setEditProgram(profile?.program || 'Mathématiques-Physique');
            setEditLevel(profile?.level || 'Licence 2');
            setEditBio(profile?.bio || '');
            setIsEditOpen(true);
          }}
          className="w-full bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0878b9] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Modifier mon profil</h4>
              <p className="text-[11px] text-slate-400">Nom, filière, département et biographie</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-slate-600 transition-colors">›</span>
        </button>

        <button
          type="button"
          onClick={() => setIsInstallGuideOpen(true)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              📲
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Installer sur mon téléphone</h4>
              <p className="text-[11px] text-slate-400">Guide d'installation sur Android & iPhone</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-slate-600 transition-colors">›</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          className="w-full bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8060ed] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Mes cours et ressources</h4>
              <p className="text-[11px] text-slate-400">Consulter les documents pédagogiques</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-slate-600 transition-colors">›</span>
        </button>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">À propos de l'ISSEG</h4>
              <p className="text-[11px] text-slate-400">Institut Supérieur des Sciences de l'Éducation de Guinée</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pl-12">
            L'ISSEG forme les cadres enseignants, inspecteurs et pédagogues de la République de Guinée. Cette plateforme connecte les étudiants pour faciliter le partage académique et l'entraide pédagogique.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-white hover:bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs text-rose-600 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-600">Se déconnecter</h4>
              <p className="text-[11px] text-rose-400">Fermer la session sur cet appareil</p>
            </div>
          </div>
          <span className="text-rose-300 group-hover:text-rose-600 transition-colors">›</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#0878b9]" />
                Modifier mon profil
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Département</label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                >
                  <option value="Sciences">Sciences</option>
                  <option value="Lettres et sciences humaines">Lettres et sciences humaines</option>
                  <option value="Langues">Langues</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filière</label>
                  <select
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  >
                    <option value="Mathématiques-Physique">Mathématiques-Physique</option>
                    <option value="Physique-Chimie-Technologie">Physique-Chimie-Techno</option>
                    <option value="Biologie-Géologie-Chimie">Biologie-Géologie-Chimie</option>
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Géographie-Économie">Géographie-Économie</option>
                    <option value="Philosophie-Histoire-ECM">Philosophie-Histoire-ECM</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Niveau</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  >
                    <option value="Licence 1">Licence 1</option>
                    <option value="Licence 2">Licence 2</option>
                    <option value="Licence 3">Licence 3</option>
                    <option value="Master 1">Master 1</option>
                    <option value="Master 2">Master 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Présentation</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Partage tes centres d'intérêt, tes ambitions d'enseignement ou ta citation préférée..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0878b9] hover:bg-[#07558c] text-white shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTALL GUIDE MODAL */}
      {isInstallGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="text-xl">📲</span>
                Installer ISSEG Connect sur mobile
              </h3>
              <button
                type="button"
                onClick={() => setIsInstallGuideOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              {/* Android Section */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <span className="text-base">🤖</span>
                  <span>Sur Android (Google Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                  <li>Ouvre le lien de l'application dans <strong>Chrome</strong>.</li>
                  <li>Touche les <strong>3 petits points verticaux (⋮)</strong> en haut à droite.</li>
                  <li>Sélectionne <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                  <li>Clique sur <strong>Installer</strong>. L'icône ISSEG apparaîtra parmi tes applications comme une vraie appli native !</li>
                </ol>
              </div>

              {/* iPhone Section */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[#0878b9] font-bold">
                  <span className="text-base">🍎</span>
                  <span>Sur iPhone / iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                  <li>Ouvre le lien de l'application dans <strong>Safari</strong>.</li>
                  <li>Touche le bouton de <strong>Partage</strong> (le carré avec une flèche vers le haut ⎋ en bas de l'écran).</li>
                  <li>Fais défiler la liste vers le bas et touche <strong>« Sur l'écran d'accueil » (➕)</strong>.</li>
                  <li>Touche <strong>Ajouter</strong> en haut à droite.</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500">
                💡 <em>Une fois installée, l'application fonctionne en plein écran, sans barre de navigation navigateur, et stocke tes données en temps réel !</em>
              </div>

              <button
                type="button"
                onClick={() => setIsInstallGuideOpen(false)}
                className="w-full py-2.5 bg-[#10152f] text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

