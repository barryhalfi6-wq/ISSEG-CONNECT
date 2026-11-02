import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserPosts, deletePost } from '../services/dataService';
import { PostItem } from '../types';
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
  Save,
  Trash2,
  Heart,
  MessageCircle,
  BarChart2,
  HelpCircle,
  Radio,
  Sparkles,
  Camera
} from 'lucide-react';

interface ProfileViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (page: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNotify, onNavigate }) => {
  const { currentUser, profile, logout, updateProfileData } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState(profile?.firstName || '');
  const [editLastName, setEditLastName] = useState(profile?.lastName || '');
  const [editDepartment, setEditDepartment] = useState(profile?.department || 'Sciences');
  const [editProgram, setEditProgram] = useState(profile?.program || 'Mathématiques-Physique');
  const [editLevel, setEditLevel] = useState(profile?.level || 'Licence 2');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  // Subscribe to user's posts in real-time
  useEffect(() => {
    if (!currentUser) return;
    setLoadingPosts(true);
    const unsub = subscribeToUserPosts(currentUser.uid, (posts) => {
      setUserPosts(posts);
      setLoadingPosts(false);
    });
    return () => unsub();
  }, [currentUser]);

  const totalLikesReceived = userPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

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

  const handleDeleteMyPost = async (postId: string) => {
    if (!window.confirm('Voulez-vous supprimer définitivement cette publication de votre profil ?')) return;
    try {
      await deletePost(postId);
      onNotify('Publication supprimée avec succès.', 'info');
    } catch (err: any) {
      onNotify('Erreur lors de la suppression de la publication', 'error');
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

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Récemment';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return 'Récemment';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24 pt-4 px-3 sm:px-0">
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

      {/* Stats bar (Facebook-style) */}
      <div className="grid grid-cols-3 gap-2 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center">
        <div className="space-y-0.5">
          <strong className="block text-xl font-black text-[#0878b9]">{userPosts.length}</strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Publications</small>
        </div>
        <div className="space-y-0.5 border-x border-slate-100">
          <strong className="block text-xl font-black text-rose-500">
            {totalLikesReceived}
          </strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Likes reçus</small>
        </div>
        <div className="space-y-0.5">
          <strong className="block text-lg font-black text-emerald-600 truncate px-1">
            {profile?.department || 'Sciences'}
          </strong>
          <small className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pôle</small>
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
      </div>

      {/* FACEBOOK-STYLE USER TIMELINE : "MES PUBLICATIONS" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span>📝</span> Mes Publications ({userPosts.length})
          </h3>
          <span className="text-xs text-slate-400">Visibles sur le fil du campus</span>
        </div>

        {loadingPosts ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
            <div className="w-6 h-6 border-2 border-[#0878b9] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Chargement de vos publications...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0878b9] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Vous n'avez pas encore publié</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Partagez une question de cours, une annonce de stage ou lancez un sondage avec vos camarades de l'ISSEG !
            </p>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="mt-4 px-4 py-2 bg-[#0878b9] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#07558c] transition-colors"
            >
              Créer ma première publication
            </button>
          </div>
        ) : (
          userPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0878b9] to-[#8060ed] text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(profile?.fullName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-bold text-slate-800">
                        {profile?.fullName || 'Moi'}
                      </strong>
                      {post.tag && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0878b9] text-[10px] font-bold">
                          {post.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {formatTimestamp(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* DELETE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleDeleteMyPost(post.id)}
                  title="Supprimer cette publication"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span className="hidden xs:inline text-rose-600">Supprimer</span>
                </button>
              </div>

              {/* Content text */}
              {post.content && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              )}

              {/* Media photo if any */}
              {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-72 bg-slate-50">
                  <img
                    src={post.mediaUrl}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Poll if attached */}
              {post.poll && (
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                  <span className="text-xs font-bold text-[#0878b9] flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {post.poll.question}
                  </span>
                  <div className="space-y-1.5">
                    {post.poll.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="bg-white p-2 rounded-xl text-xs flex justify-between border border-slate-100"
                      >
                        <span className="font-medium text-slate-700">{opt.text}</span>
                        <span className="font-bold text-[#0878b9]">{opt.votes?.length || 0} vote(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Footer with Likes & Comments Count */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-semibold text-rose-500">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    {post.commentsCount || 0}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">ISSEG Connect</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout button */}
      <div className="pt-2">
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
    </div>
  );
};

