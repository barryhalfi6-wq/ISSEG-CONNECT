import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToPosts,
  createPost,
  toggleLikePost,
  deletePost,
  votePoll,
  setBestAnswer,
  subscribeToComments,
  addComment,
  publishAIBotInsight,
  checkAndSeedAIBotIfEmpty
} from '../services/dataService';
import { PostItem, CommentItem } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  Sparkles,
  Tag,
  GraduationCap,
  X,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Download,
  Loader2,
  BarChart2,
  HelpCircle,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  Radio,
  Search,
  Shield,
  Cpu,
  Globe,
  BookOpen
} from 'lucide-react';

interface FeedViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenInstall?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onNotify, onOpenInstall }) => {
  const { currentUser, profile } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('Tous');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('#Général');
  const [submitting, setSubmitting] = useState(false);

  // Photo upload states in composer
  const [postPhotoData, setPostPhotoData] = useState<string | null>(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen photo lightbox
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Expanded comment states per postId
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  // Poll state in composer
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [pollOption3, setPollOption3] = useState('');
  const [isQuestionPost, setIsQuestionPost] = useState(false);
  const [isOfficialPost, setIsOfficialPost] = useState(false);

  // Timetable modal
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [timetableDept, setTimetableDept] = useState('Sciences');

  // Algorithm & Feed Sorting
  const [feedMode, setFeedMode] = useState<'algorithm' | 'recent' | 'trending' | 'department'>('algorithm');
  const [isPublishingAI, setIsPublishingAI] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [isSmartToolsOpen, setIsSmartToolsOpen] = useState(false);
  const [customResearchTopic, setCustomResearchTopic] = useState('');

  useEffect(() => {
    // Seed AI didactic insight if none exists
    checkAndSeedAIBotIfEmpty();
    const unsub = subscribeToPosts((list) => {
      setPosts(list);
    });
    return () => unsub();
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingPhoto(true);
    try {
      const compressed = await compressImage(file, 1000, 0.75);
      setPostPhotoData(compressed);
      onNotify('Photo optimisée et prête à être publiée !', 'info');
    } catch (err: any) {
      onNotify(err.message || 'Erreur lors du traitement de la photo', 'error');
    } finally {
      setCompressingPhoto(false);
      // Reset input value so same photo can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!newPostText.trim() && !postPhotoData && !pollQuestion.trim())) {
      onNotify('Veuillez ajouter un texte, une photo ou une question de sondage.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Pare-feu de sécurité intelligent pour le contenu
      if (newPostText.trim()) {
        try {
          const modRes = await fetch('/api/ai/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newPostText.trim() })
          });
          if (modRes.ok) {
            const modData = await modRes.json();
            if (!modData.isClean) {
              onNotify(modData.warning || 'Contenu signalé par le pare-feu de sécurité universitaire.', 'error');
              setSubmitting(false);
              return;
            }
          }
        } catch {
          // Continue safely if offline
        }
      }

      let pollPayload = undefined;
      if (isPollActive && pollQuestion.trim() && pollOption1.trim() && pollOption2.trim()) {
        const options = [
          { id: 'opt_1', text: pollOption1.trim(), votes: [] },
          { id: 'opt_2', text: pollOption2.trim(), votes: [] }
        ];
        if (pollOption3.trim()) {
          options.push({ id: 'opt_3', text: pollOption3.trim(), votes: [] });
        }
        pollPayload = {
          question: pollQuestion.trim(),
          options
        };
      }

      const assignedTag = isPollActive ? '#Sondage' : (isQuestionPost ? '#Question' : (isOfficialPost ? '#Officiel' : newPostTag));

      await createPost({
        authorId: currentUser.uid,
        authorName: profile?.fullName || currentUser.displayName || 'Étudiant ISSEG',
        authorProgram: `${profile?.program || 'Étudiant'} · ${profile?.level || ''}`,
        content: newPostText.trim() || (pollPayload ? pollPayload.question : 'Publication'),
        department: profile?.department || 'Sciences',
        tag: assignedTag,
        mediaUrl: postPhotoData || undefined,
        isOfficial: isOfficialPost,
        isQuestion: isQuestionPost,
        poll: pollPayload
      });

      setNewPostText('');
      setPostPhotoData(null);
      setIsPollActive(false);
      setPollQuestion('');
      setPollOption1('');
      setPollOption2('');
      setPollOption3('');
      setIsQuestionPost(false);
      setIsOfficialPost(false);
      setIsComposerOpen(false);
      onNotify('Publication partagée sur le campus avec succès !', 'success');
    } catch (err: any) {
      onNotify('Erreur lors de la publication : ' + (err.message || 'accès refusé'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      await votePoll(postId, optionId, currentUser.uid);
      onNotify('Votre vote a été enregistré !', 'success');
    } catch {
      onNotify('Erreur lors du vote', 'error');
    }
  };

  const handleSelectBestAnswer = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      await setBestAnswer(postId, commentId);
      onNotify('Meilleure réponse validée 🏆 !', 'success');
    } catch {
      onNotify('Erreur sélection de la réponse', 'error');
    }
  };

  const handleLike = async (post: PostItem) => {
    if (!currentUser) return;
    const isLiked = post.likes?.includes(currentUser.uid) || false;
    try {
      await toggleLikePost(post.id, currentUser.uid, isLiked);
    } catch (err: any) {
      onNotify('Impossible d\'actualiser le like', 'error');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Voulez-vous supprimer cette publication ?')) return;
    try {
      await deletePost(postId);
      onNotify('Publication supprimée.', 'info');
    } catch (err: any) {
      onNotify('Erreur lors de la suppression', 'error');
    }
  };

  const handleShare = (post: PostItem) => {
    navigator.clipboard?.writeText?.(`${post.authorName} sur ISSEG Connect : "${post.content}"`);
    onNotify('Texte de la publication copié dans le presse-papier !', 'info');
  };

  const handleGenerateAIBotPost = async () => {
    setIsPublishingAI(true);
    try {
      await publishAIBotInsight();
      onNotify('Nouveau conseil didactique publié par l\'Assistant IA 🤖 !', 'success');
    } catch (err: any) {
      onNotify('Erreur publication IA : ' + (err.message || 'accès refusé'), 'error');
    } finally {
      setIsPublishingAI(false);
    }
  };

  const handlePublishCustomResearch = async (topic: string) => {
    if (!topic.trim()) return;
    setIsPublishingAI(true);
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() })
      });
      const data = await res.json();
      if (data.content) {
        await createPost({
          authorId: 'isseg-ia-bot',
          authorName: 'Didactique IA · ISSEG 🤖',
          authorProgram: 'Intelligence Pédagogique ISSEG',
          department: 'Sciences de l\'Éducation',
          content: data.content,
          tag: '#RechercheIA',
          isOfficial: true
        });
        onNotify(`Recherche sur "${topic.slice(0, 32)}..." publiée sur le campus !`, 'success');
        setIsResearchModalOpen(false);
        setCustomResearchTopic('');
      } else {
        onNotify('Impossible d\'extraire les résultats de recherche.', 'error');
      }
    } catch (err: any) {
      onNotify('Erreur recherche IA : ' + err.message, 'error');
    } finally {
      setIsPublishingAI(false);
    }
  };

  // Algorithme de pertinence ISSEG Connect (Smart Feed Algorithm)
  const computeScore = (post: PostItem): number => {
    let score = 0;
    // Décroissance temporelle douce
    const postTime = post.createdAt?.toDate
      ? post.createdAt.toDate().getTime()
      : (post.createdAt?.seconds ? post.createdAt.seconds * 1000 : Date.now());
    const hoursSince = Math.max(0, (Date.now() - postTime) / (1000 * 60 * 60));
    score += Math.max(0, 100 - hoursSince * 2.5);

    // Engagement de la communauté
    const likes = post.likes?.length || 0;
    const comments = post.commentsCount || 0;
    const pollVotes = post.poll?.options?.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0) || 0;
    score += likes * 4;
    score += comments * 8;
    score += pollVotes * 5;

    // Priorités académiques
    if (post.isOfficial) score += 90;
    if (post.authorId === 'isseg-ia-bot') score += 55;
    if (profile?.department && post.department === profile.department) score += 35;
    if (post.isQuestion && !post.resolvedAnswerId) score += 30;
    if (post.mediaUrl) score += 15;

    return score;
  };

  const filteredPosts = React.useMemo(() => {
    let list = selectedTag === 'Tous'
      ? [...posts]
      : posts.filter((p) => p.tag === selectedTag || p.department === selectedTag);

    if (feedMode === 'department' && profile?.department) {
      list = list.filter((p) => p.department === profile.department || p.isOfficial || p.authorId === 'isseg-ia-bot');
    }

    if (feedMode === 'algorithm') {
      return list.sort((a, b) => computeScore(b) - computeScore(a));
    } else if (feedMode === 'trending') {
      return list.sort((a, b) => {
        const engA = (a.likes?.length || 0) + (a.commentsCount || 0) * 2;
        const engB = (b.likes?.length || 0) + (b.commentsCount || 0) * 2;
        return engB - engA;
      });
    } else {
      // 'recent'
      return list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    }
  }, [posts, selectedTag, feedMode, profile?.department]);

  const getInitials = (name?: string) => {
    if (!name) return 'IS';
    const p = name.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20 pt-4 px-3 sm:px-0">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 bg-gradient-to-r from-[#07558c] via-[#0878b9] to-[#8060ed]">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
              ISSEG Connect · Campus Ratoma
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Bonjour, {profile?.firstName || 'Étudiant'} 👋
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-sm">
              {profile?.program ? `${profile.program} · ${profile.level}` : 'Connecte-toi, partage tes cours et collabore.'}
            </p>
          </div>
          <div className="text-4xl sm:text-5xl opacity-90 drop-shadow-md select-none">
            🎓
          </div>
        </div>
      </div>

      {/* Stories / Faculty quick access */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Facultés & Pôles
          </h3>
          <span className="text-xs text-[#0878b9] font-medium cursor-pointer">ISSEG Guinée</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="flex flex-col items-center flex-shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-dashed border-[#0878b9] text-[#0878b9] flex items-center justify-center text-2xl font-light group-hover:scale-105 transition-transform">
              ＋
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-1">Publier</span>
          </button>

          {[
            { label: 'Tous', grad: 'avatar-navy', symbol: '🌐' },
            { label: 'Sciences', grad: 'avatar-blue', symbol: '📐' },
            { label: 'Lettres', grad: 'avatar-purple', symbol: '📖' },
            { label: 'Langues', grad: 'avatar-orange', symbol: '🗣️' },
            { label: 'Pédagogie', grad: 'avatar-green', symbol: '🎓' }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedTag(item.label === 'Tous' ? 'Tous' : item.label)}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div
                className={`w-14 h-14 rounded-full ${item.grad} text-white flex items-center justify-center text-lg font-bold shadow-sm ring-2 ${
                  selectedTag === item.label ? 'ring-[#0878b9] ring-offset-2' : 'ring-transparent'
                } group-hover:scale-105 transition-all`}
              >
                {item.symbol}
              </div>
              <span className="text-[11px] font-medium text-slate-600 mt-1 max-w-[60px] truncate">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access Academic Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setIsTimetableOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#0878b9] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs flex-shrink-0 hover:opacity-95 transition-opacity"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Emploi du Temps 📅</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTag(selectedTag === '#Officiel' ? 'Tous' : '#Officiel')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all flex-shrink-0 ${
            selectedTag === '#Officiel'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-600" />
          <span>Affichage Décanat 📢</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTag(selectedTag === '#Sondage' ? 'Tous' : '#Sondage')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all flex-shrink-0 ${
            selectedTag === '#Sondage'
              ? 'bg-[#0878b9] text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-[#0878b9]" />
          <span>Sondages 📊</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTag(selectedTag === '#Question' ? 'Tous' : '#Question')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all flex-shrink-0 ${
            selectedTag === '#Question'
              ? 'bg-[#8060ed] text-white border-purple-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#8060ed]" />
          <span>Questions ❓</span>
        </button>

        <button
          type="button"
          onClick={() => setIsResearchModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs flex-shrink-0 hover:opacity-95 transition-opacity"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Recherche Web IA 🔍</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSmartToolsOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs flex-shrink-0 hover:opacity-95 transition-opacity"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Outils Intelligents 🧠</span>
        </button>
      </div>

      {/* Post composer trigger card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0878b9] to-[#8060ed] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
          {getInitials(profile?.fullName)}
        </div>
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="flex-1 bg-slate-50 hover:bg-slate-100/80 text-left px-4 py-3 rounded-full text-xs sm:text-sm text-slate-400 font-medium transition-colors border border-slate-200/60"
        >
          Quoi de neuf dans ta vie universitaire, {profile?.firstName || ''} ?
        </button>
        <button
          type="button"
          onClick={() => {
            setIsComposerOpen(true);
            setTimeout(() => fileInputRef.current?.click(), 200);
          }}
          className="p-2.5 rounded-full bg-blue-50 text-[#0878b9] hover:bg-blue-100 transition-colors flex-shrink-0"
          title="Ajouter une photo"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Filter tag pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['Tous', '#Général', '#Entraide', '#Cours', '#Annonce', '#Examens'].map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTag === tag
                ? 'bg-[#10152f] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* AI Didactic Assistant Account Banner */}
      <div className="bg-gradient-to-r from-[#10152f] via-[#1a234e] to-[#0878b9] rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl flex-shrink-0 border border-white/20 shadow-inner">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm">Didactique IA · ISSEG</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                Compte IA Actif
              </span>
            </div>
            <p className="text-[11px] text-blue-100 mt-0.5">
              Conseils pédagogiques, didactique APC et préparation aux stages dans les collèges & lycées.
            </p>
          </div>
        </div>
        <div className="self-end sm:self-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsResearchModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="L'IA recherche librement sur internet et publie ses conclusions"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Recherche Web IA</span>
          </button>

          <button
            type="button"
            disabled={isPublishingAI}
            onClick={handleGenerateAIBotPost}
            className="px-3.5 py-2 bg-white text-[#10152f] hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            title="Demander à l'IA de publier un conseil pédagogique"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0878b9]" />
            <span>{isPublishingAI ? 'Publication...' : 'Conseil Didactique'}</span>
          </button>
        </div>
      </div>

      {/* Algorithm Mode Selector */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <span className="p-1 rounded-lg bg-blue-50 text-[#0878b9] text-sm">🧠</span>
          <span>Algorithme :</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFeedMode('algorithm')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              feedMode === 'algorithm'
                ? 'bg-[#0878b9] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Classé par score d'engagement, fraîcheur et pertinence académique"
          >
            <span>🌟 Recommandés (Algorithme)</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedMode('trending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              feedMode === 'trending'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🔥 Populaires</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedMode('recent')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              feedMode === 'recent'
                ? 'bg-[#10152f] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>⏱️ Récents</span>
          </button>

          {profile?.department && (
            <button
              type="button"
              onClick={() => setFeedMode('department')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                feedMode === 'department'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>🎓 Mon Département</span>
            </button>
          )}
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#0878b9] flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Aucune publication pour le moment</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Sois le premier à partager une question, une photo du tableau ou une annonce universitaire !
            </p>
            <button
              onClick={() => setIsComposerOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0878b9] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#07558c] transition-colors"
            >
              Écrire une publication
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.uid}
              isCommentsOpen={activeCommentsPostId === post.id}
              onToggleComments={() =>
                setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)
              }
              onLike={() => handleLike(post)}
              onDelete={() => handleDelete(post.id)}
              onShare={() => handleShare(post)}
              onNotify={onNotify}
              onViewImage={(url) => setLightboxImageUrl(url)}
              onVote={(optionId) => handleVote(post.id, optionId)}
              onSelectBestAnswer={(commentId) => handleSelectBestAnswer(post.id, commentId)}
            />
          ))
        )}
      </div>

      {/* POST COMPOSER MODAL WITH PHOTO PUBLICATION */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0878b9]" />
                Créer une publication
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsComposerOpen(false);
                  setPostPhotoData(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0878b9] to-[#8060ed] text-white flex items-center justify-center text-xs font-bold">
                  {getInitials(profile?.fullName)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{profile?.fullName || 'Étudiant'}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {profile?.program || 'ISSEG'} · Visible par toute la communauté
                  </span>
                </div>
              </div>

              <textarea
                rows={3}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Partage une information, une photo de cours ou pose ta question..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0878b9] focus:bg-white resize-none"
              />

              {/* Photo Attachment Preview */}
              {postPhotoData && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img
                    src={postPhotoData}
                    alt="Aperçu photo"
                    className="w-full max-h-56 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setPostPhotoData(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors shadow-sm"
                    title="Supprimer la photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                    Photo jointe ✓
                  </span>
                </div>
              )}

              {/* Photo upload trigger button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={compressingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-[#0878b9] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-blue-200/60"
                >
                  {compressingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0878b9]" />
                      <span>Optimisation de la photo...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{postPhotoData ? 'Changer la photo' : 'Ajouter une photo (tableau, cours, campus)'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Format Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Format de la publication :
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPollActive(!isPollActive);
                      if (!isPollActive) {
                        setIsQuestionPost(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPollActive
                        ? 'bg-[#0878b9] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Créer un sondage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuestionPost(!isQuestionPost);
                      if (!isQuestionPost) {
                        setIsPollActive(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isQuestionPost
                        ? 'bg-[#8060ed] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Question académique</span>
                  </button>

                  {(profile?.role === 'teacher' || profile?.role === 'admin' || profile?.institution?.includes('ISSEG')) && (
                    <button
                      type="button"
                      onClick={() => setIsOfficialPost(!isOfficialPost)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isOfficialPost
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Communiqué officiel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Poll Configuration Fields */}
              {isPollActive && (
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2.5 animate-fade-in">
                  <span className="text-xs font-bold text-[#0878b9] flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    Configuration du sondage étudiant
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Question du sondage *
                    </label>
                    <input
                      type="text"
                      required={isPollActive}
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ex : Quel créneau préférez-vous pour la séance de révision ?"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Options de vote :
                    </label>
                    <input
                      type="text"
                      required={isPollActive}
                      value={pollOption1}
                      onChange={(e) => setPollOption1(e.target.value)}
                      placeholder="Option 1 (ex : Samedi 10h - Amphi 1)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                    />
                    <input
                      type="text"
                      required={isPollActive}
                      value={pollOption2}
                      onChange={(e) => setPollOption2(e.target.value)}
                      placeholder="Option 2 (ex : Dimanche 15h - Bibliothèque)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={pollOption3}
                      onChange={(e) => setPollOption3(e.target.value)}
                      placeholder="Option 3 (optionnel)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tag choice */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Catégorie de la publication :
                </label>
                <div className="flex flex-wrap gap-2">
                  {['#Général', '#Entraide', '#Cours', '#Annonce', '#Examens'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewPostTag(t)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        newPostTag === t
                          ? 'bg-[#0878b9] text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setPostPhotoData(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!newPostText.trim() && !postPhotoData)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0878b9] hover:bg-[#07558c] text-white shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={lightboxImageUrl}
              download="photo_isseg.jpg"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Télécharger l'image"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={lightboxImageUrl}
            alt="Plein écran"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* TIMETABLE MODAL (EMPLOI DU TEMPS ISSEG) */}
      {isTimetableOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0878b9] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Emploi du Temps Officiel · Campus ISSEG Lambanyi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Semestre en cours · Horaires des amphis et salles de cours
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimetableOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Department selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-semibold">
              {['Sciences', 'Lettres & Français', 'Langues (Anglais)', 'Sc. Éducation'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setTimetableDept(dept)}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    timetableDept === dept ? 'bg-white text-[#0878b9] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Schedule Table / List */}
            <div className="space-y-3">
              {[
                { day: 'Lundi', time: '08h00 - 10h00', subject: 'Didactique Générale & Théories de l\'Apprentissage', room: 'Amphi 1', prof: 'Dr. Camara' },
                { day: 'Lundi', time: '10h15 - 12h15', subject: 'Psychopédagogie de l\'Adolescent', room: 'Bloc A - Salle 4', prof: 'Prof. Diallo' },
                { day: 'Mardi', time: '08h00 - 11h00', subject: 'Didactique de la Spécialité (Travaux Pratiques)', room: 'Laboratoire Didactique', prof: 'Mme Soumah' },
                { day: 'Mercredi', time: '14h00 - 16h00', subject: 'Évaluation des Apprentissages & Docimologie', room: 'Bloc B - Salle 2', prof: 'Dr. Barry' },
                { day: 'Jeudi', time: '08h30 - 12h00', subject: 'Stage en Établissement d\'Application (Collèges & Lycées)', room: 'Écoles Partenaires', prof: 'Superviseurs ISSEG' },
                { day: 'Vendredi', time: '09h00 - 11h00', subject: 'Séminaire de Recherche & Préparation au Mémoire', room: 'Bibliothèque Centrale', prof: 'Commission Scientifique' },
                { day: 'Samedi', time: '10h00 - 12h00', subject: 'Ateliers d\'Analyse des Pratiques Professionnelles', room: 'Amphi 2', prof: 'Formateurs' }
              ].map((slot, i) => (
                <div key={i} className="p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-black text-[#10152f] uppercase tracking-wide">
                      {slot.day}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{slot.subject}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-slate-600">
                          <Clock className="w-3 h-3 text-[#0878b9]" />
                          {slot.time}
                        </span>
                        <span>·</span>
                        <span className="text-[#0878b9] font-medium">{slot.prof}</span>
                      </p>
                    </div>
                  </div>
                  <div className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.room}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
              <span>Mise à jour hebdomadaire par le Décanat</span>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#0878b9] hover:bg-[#07558c] text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Imprimer mon planning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI WEB RESEARCH & FREE PUBLISHING MODAL */}
      {isResearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl flex-shrink-0">
                  🌐
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Recherche Web Éducative & Publication IA
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    L'IA explore librement internet et publie une note de synthèse académique
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResearchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Thématiques de recherche didactique recommandées :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "L'Approche Par Compétences (APC) en Guinée",
                    "Didactique des Sciences avec matériel local",
                    "Enseignement du Français et bilinguisme",
                    "Pédagogie de l'erreur et psychologie de l'adolescent",
                    "Évaluation formative vs sommative",
                    "Gestion des classes pléthoriques"
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setCustomResearchTopic(topic)}
                      className={`text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        customResearchTopic === topic
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ou saisissez votre propre sujet de recherche :
                </label>
                <input
                  type="text"
                  value={customResearchTopic}
                  onChange={(e) => setCustomResearchTopic(e.target.value)}
                  placeholder="Ex : L'enseignement des probabilités au lycée en Afrique de l'Ouest"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-2xl text-[11px] text-purple-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Mission académique de l'Assistant :
                </span>
                <p className="leading-relaxed">
                  L'IA compile les publications scientifiques récentes, adapte les recommandations au contexte guinéen et partage la synthèse directement sur le fil d'actualité au nom de <strong>Didactique IA</strong> avec des sources vérifiées.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResearchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isPublishingAI || !customResearchTopic.trim()}
                onClick={() => handlePublishCustomResearch(customResearchTopic)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPublishingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recherche en cours...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Rechercher & Publier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART TOOLS MANAGEMENT SUITE MODAL */}
      {isSmartToolsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl flex-shrink-0">
                  🧠
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Outils Intelligents · Gestion du Réseau Social ISSEG
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Supervision, sécurité des données et outils IA pour la communauté
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSmartToolsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Tool 1 : Pare-feu & Sécurité */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    1. Pare-feu de Sécurité & Protection des Mots de Passe
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    ACTIF
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tous les mots de passe sont validés selon une politique de complexité stricte (minimum 8 caractères, majuscules, minuscules, chiffres et symboles). Le hachage cryptographique côté pare-feu empêche toute interception.
                </p>
              </div>

              {/* Tool 2 : Vérification stricte des cartes */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0878b9]" />
                    2. Outil Intelligent de Contrôle des Cartes d'Étudiant
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                    STRICT
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Chaque étudiant doit obligatoirement téléverser sa Carte Unique officielle de l'ISSEG. L'outil intelligent vérifie le drapeau guinéen, le logo de l'institut et le numéro INE (14 caractères) avant d'autoriser l'accès.
                </p>
              </div>

              {/* Tool 3 : Modération Automatisée */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    3. Modération Automatisée & Filtrage Anti-Toxique
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                    EN TEMPS RÉEL
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Les publications et commentaires sont analysés par le pare-feu sémantique pour bloquer les insultes, la fraude aux examens et les comportements non éthiques, garantissant la sérénité du campus.
                </p>
              </div>

              {/* Tool 4 : Recherche & Didactique IA */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-600" />
                    4. Publication Libre de Recherches Web par l'IA
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                    AUTONOME
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Le compte certifié <strong>Didactique IA</strong> explore le web académique pour proposer des fiches et articles scientifiques utiles aux futurs professeurs et enseignants en exercice.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSmartToolsOpen(false)}
                className="px-5 py-2 bg-[#10152f] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: POST CARD WITH PHOTOS & COMMENTS
// ==========================================
interface PostCardProps {
  post: PostItem;
  currentUserId?: string;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  onLike: () => void;
  onDelete: () => void;
  onShare: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewImage: (url: string) => void;
  onVote: (optionId: string) => void;
  onSelectBestAnswer: (commentId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isCommentsOpen,
  onToggleComments,
  onLike,
  onDelete,
  onShare,
  onNotify,
  onViewImage,
  onVote,
  onSelectBestAnswer
}) => {
  const isLiked = currentUserId ? post.likes?.includes(currentUserId) : false;
  const isAuthor = currentUserId === post.authorId;

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!isCommentsOpen) return;
    setLoadingComments(true);
    const unsub = subscribeToComments(post.id, (list) => {
      setComments(list);
      setLoadingComments(false);
    });
    return () => unsub();
  }, [isCommentsOpen, post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !commentInput.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(post.id, {
        authorId: currentUserId,
        authorName: 'Étudiant',
        content: commentInput.trim()
      });
      setCommentInput('');
      onNotify('Commentaire ajouté !', 'success');
    } catch (err: any) {
      onNotify('Erreur commentaire', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'IS';
    const p = name.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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

  // Calculate poll stats if available
  const totalPollVotes = post.poll?.options.reduce((acc, cur) => acc + (cur.votes?.length || 0), 0) || 0;

  return (
    <article className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* Official Announcement Banner */}
      {post.isOfficial && post.authorId !== 'isseg-ia-bot' && (
        <div className="mb-3 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-300 text-amber-950 rounded-2xl px-3.5 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black tracking-wide">
            <span className="text-base">📢</span>
            <span>COMMUNIQUÉ OFFICIEL · DÉCANAT & SCOLARITÉ ISSEG</span>
          </div>
          <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
            Certifié
          </span>
        </div>
      )}

      {/* AI Didactic Post Banner */}
      {post.authorId === 'isseg-ia-bot' && (
        <div className="mb-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 text-purple-950 rounded-2xl px-3.5 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black tracking-wide">
            <span className="text-base">🤖</span>
            <span>ASSISTANT DIDACTIQUE IA · ISSEG LAMBANYI</span>
          </div>
          <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2.5 py-0.5 rounded-full font-bold">
            Pédagogie & Didactique
          </span>
        </div>
      )}

      {/* Academic Question Badge */}
      {post.isQuestion && (
        <div className="mb-3 bg-purple-50 text-[#8060ed] border border-purple-100 rounded-2xl px-3.5 py-1.5 flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#8060ed]" />
            Question Académique / Entraide
          </span>
          {post.resolvedAnswerId ? (
            <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Award className="w-3 h-3" /> Résolue 🏆
            </span>
          ) : (
            <span className="text-slate-400 text-[10px] font-semibold">En attente de réponse</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
            post.authorId === 'isseg-ia-bot'
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-lg'
              : 'bg-gradient-to-tr from-[#2563eb] to-[#60a5fa]'
          }`}>
            {post.authorId === 'isseg-ia-bot' ? '🤖' : getInitials(post.authorName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs sm:text-sm font-bold text-slate-800">
                {post.authorName}
              </strong>
              {post.authorId === 'isseg-ia-bot' && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black">
                  IA
                </span>
              )}
              {post.tag && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0878b9] text-[10px] font-bold">
                  {post.tag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {post.authorProgram || 'Étudiant ISSEG'} · {formatTimestamp(post.createdAt)}
            </p>
          </div>
        </div>

        {(isAuthor || post.authorId === 'isseg-ia-bot') && (
          <button
            type="button"
            onClick={onDelete}
            title="Supprimer cette publication"
            className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body content */}
      {post.content && (
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed my-3 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Interactive Poll */}
      {post.poll && (
        <div className="my-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#0878b9]" />
              {post.poll.question}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {totalPollVotes} vote{totalPollVotes > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {post.poll.options.map((opt) => {
              const hasVoted = currentUserId ? opt.votes?.includes(currentUserId) : false;
              const count = opt.votes?.length || 0;
              const pct = totalPollVotes > 0 ? Math.round((count / totalPollVotes) * 100) : 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onVote(opt.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group ${
                    hasVoted
                      ? 'border-[#0878b9] bg-blue-50/60 ring-1 ring-[#0878b9]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
                      hasVoted ? 'bg-[#0878b9]/15' : 'bg-slate-100'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between text-xs">
                    <span className={`font-semibold flex items-center gap-1.5 ${hasVoted ? 'text-[#0878b9]' : 'text-slate-700'}`}>
                      {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-[#0878b9]" />}
                      {opt.text}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {pct}% ({count})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Attached Photo */}
      {post.mediaUrl && (
        <div
          onClick={() => onViewImage(post.mediaUrl!)}
          className="relative rounded-2xl overflow-hidden mb-3.5 border border-slate-100 bg-slate-50 cursor-pointer group"
        >
          <img
            src={post.mediaUrl}
            alt="Illustration post"
            className="w-full max-h-80 object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
              <Maximize2 className="w-3.5 h-3.5" />
              Agrandir la photo
            </span>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 py-2 border-y border-slate-100">
        <span>❤️ {post.likes?.length || 0} mentions j'aime</span>
        <span>💬 {post.commentsCount || 0} commentaires</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            isLiked
              ? 'text-rose-500 bg-rose-50'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
          <span>J'aime</span>
        </button>

        <button
          type="button"
          onClick={onToggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            isCommentsOpen
              ? 'text-[#0878b9] bg-blue-50'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Commenter</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager</span>
        </button>
      </div>

      {/* Comments section */}
      {isCommentsOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              required
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Écrire une réponse bienveillante..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0878b9]"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#0878b9] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#07558c]"
            >
              Envoyer
            </button>
          </form>

          {loadingComments ? (
            <p className="text-center text-xs text-slate-400 py-2">Chargement des commentaires...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-2">
              Pas encore de commentaire. Sois le premier à répondre !
            </p>
          ) : (
            <div className="space-y-2.5 pt-1 max-h-56 overflow-y-auto">
              {comments.map((c) => {
                const isBest = c.id === post.resolvedAnswerId;
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-3 text-xs transition-all ${
                      isBest
                        ? 'bg-emerald-50/80 border border-emerald-300 shadow-xs'
                        : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="font-bold text-slate-700">{c.authorName}</strong>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center gap-1">
                            <Award className="w-2.5 h-2.5" /> MEILLEURE RÉPONSE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatTimestamp(c.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{c.content}</p>

                    {/* Best Answer Action for Post Author */}
                    {post.isQuestion && isAuthor && !post.resolvedAnswerId && (
                      <button
                        type="button"
                        onClick={() => onSelectBestAnswer(c.id)}
                        className="mt-2 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Award className="w-3 h-3" />
                        <span>Marquer comme meilleure réponse</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
