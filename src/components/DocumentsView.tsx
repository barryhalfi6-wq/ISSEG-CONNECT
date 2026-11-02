import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToDocuments, uploadCourseDocument, deleteCourseDocument } from '../services/dataService';
import { CourseDocItem } from '../types';
import { BookOpen, Download, Plus, Search, FileText, CheckCircle, ExternalLink, X, GraduationCap, Trash2, Eye, Bookmark, WifiOff } from 'lucide-react';

interface DocumentsViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onNotify }) => {
  const { currentUser, profile } = useAuth();
  const [documents, setDocuments] = useState<CourseDocItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Tous');
  const [selectedLevel, setSelectedLevel] = useState('Tous');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [readingDoc, setReadingDoc] = useState<CourseDocItem | null>(null);

  // Offline documents cached locally
  const [savedOfflineIds, setSavedOfflineIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('isseg_offline_doc_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Upload modal state
  const [docTitle, setDocTitle] = useState('');
  const [docCourse, setDocCourse] = useState('');
  const [docDept, setDocDept] = useState('Sciences');
  const [docLevel, setDocLevel] = useState('Licence 1');
  const [docDesc, setDocDesc] = useState('');
  const [docFileType, setDocFileType] = useState('PDF');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToDocuments((list) => {
      setDocuments(list);
    });
    return () => unsub();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !docTitle.trim() || !docCourse.trim()) return;

    setUploading(true);
    try {
      await uploadCourseDocument({
        title: docTitle.trim(),
        course: docCourse.trim(),
        department: docDept,
        level: docLevel,
        description: docDesc.trim(),
        authorId: currentUser.uid,
        authorName: profile?.fullName || 'Étudiant ISSEG',
        fileType: docFileType,
        fileUrl: `https://isseg.edu.gn/documents/${encodeURIComponent(docTitle.toLowerCase())}.pdf`
      });
      setIsUploadOpen(false);
      setDocTitle('');
      setDocCourse('');
      setDocDesc('');
      onNotify('Document pédagogique publié avec succès !', 'success');
    } catch (err: any) {
      onNotify('Erreur d\'ajout du document : ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleSaveOffline = (docItem: CourseDocItem) => {
    const isCurrentlySaved = savedOfflineIds.includes(docItem.id);
    let updated: string[];
    if (isCurrentlySaved) {
      updated = savedOfflineIds.filter((id) => id !== docItem.id);
      onNotify(`"${docItem.title}" retiré du mode hors-ligne`, 'info');
    } else {
      updated = [...savedOfflineIds, docItem.id];
      try {
        localStorage.setItem(`isseg_doc_${docItem.id}`, JSON.stringify(docItem));
      } catch {}
      onNotify(`"${docItem.title}" enregistré pour consultation hors-ligne 💾 !`, 'success');
    }
    setSavedOfflineIds(updated);
    try {
      localStorage.setItem('isseg_offline_doc_ids', JSON.stringify(updated));
    } catch {}
  };

  const handleDownload = (docItem: CourseDocItem) => {
    // Generate simulated download or link
    const blob = new Blob([
      `ISSEG CONNECT - DOCUMENT UNIVERSITAIRE\n\nTitre: ${docItem.title}\nCours: ${docItem.course}\nDépartement: ${docItem.department}\nNiveau: ${docItem.level}\nAuteur: ${docItem.authorName}\n\nDescription:\n${docItem.description || 'Ressource pédagogique fournie pour les étudiants de l\'ISSEG.'}`
    ], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docItem.title.replace(/\s+/g, '_')}_ISSEG.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`Téléchargement de "${docItem.title}" démarré !`, 'success');
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesDept = selectedDept === 'Tous' || doc.department === selectedDept;
    const matchesLevel = selectedLevel === 'Tous' || doc.level === selectedLevel;
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.course.toLowerCase().includes(search.toLowerCase()) ||
      doc.authorName.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesLevel && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 pt-4 px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Cours & Documents
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Des ressources pédagogiques pour réussir tes examens.
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-3.5 py-2 bg-[#0878b9] hover:bg-[#07558c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Déposer un cours</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un cours, titre ou professeur..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="Tous">Tous les départements</option>
            <option value="Sciences">Sciences</option>
            <option value="Lettres et sciences humaines">Lettres & Sc. Humaines</option>
            <option value="Langues">Langues</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="Tous">Tous les niveaux</option>
            <option value="Licence 1">Licence 1</option>
            <option value="Licence 2">Licence 2</option>
            <option value="Licence 3">Licence 3</option>
            <option value="Master 1">Master 1</option>
            <option value="Master 2">Master 2</option>
          </select>
        </div>
      </div>

      {/* Document cards list */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Aucun document trouvé</h4>
            <p className="text-xs text-slate-400 mt-1">Sois le premier à partager une ressource pour cette matière !</p>
          </div>
        ) : (
          filteredDocs.map((docItem) => (
            <div
              key={docItem.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0878b9] flex items-center justify-center text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  {docItem.fileType === 'PDF' ? '📕' : docItem.fileType === 'DOCX' ? '📘' : '📗'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                      {docItem.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {docItem.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {docItem.course} · {docItem.department}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Partagé par {docItem.authorName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setReadingDoc(docItem)}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-[#8060ed] text-[#8060ed] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="Consulter le document directement (Éco-Data)"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lire</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSaveOffline(docItem)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    savedOfflineIds.includes(docItem.id)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200'
                  }`}
                  title={savedOfflineIds.includes(docItem.id) ? "Disponible hors-connexion" : "Enregistrer pour consultation hors-ligne"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedOfflineIds.includes(docItem.id) ? 'fill-emerald-600' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(docItem)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-[#0878b9] text-[#0878b9] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Télécharger</span>
                </button>

                {docItem.authorId === currentUser?.uid && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Supprimer le document "${docItem.title}" ?`)) return;
                      try {
                        await deleteCourseDocument(docItem.id);
                        onNotify('Document supprimé avec succès.', 'info');
                      } catch {
                        onNotify('Erreur suppression document', 'error');
                      }
                    }}
                    title="Supprimer ce document"
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0878b9]" />
                Déposer un cours ou document
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de la ressource</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex : Résumé Didactique & Pratique de Classe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matière / Module</label>
                <input
                  type="text"
                  required
                  value={docCourse}
                  onChange={(e) => setDocCourse(e.target.value)}
                  placeholder="Ex : Psychologie de l'Éducation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Département</label>
                  <select
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  >
                    <option value="Sciences">Sciences</option>
                    <option value="Lettres et sciences humaines">Lettres & Sc. Humaines</option>
                    <option value="Langues">Langues</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Niveau</label>
                  <select
                    value={docLevel}
                    onChange={(e) => setDocLevel(e.target.value)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Format</label>
                <div className="flex gap-2">
                  {['PDF', 'DOCX', 'SLIDES'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDocFileType(type)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        docFileType === type
                          ? 'bg-[#10152f] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes de cours</label>
                <textarea
                  rows={3}
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="Ex : Contient les chapitres 1 à 4 et les corrigés des exercices d'entraînement."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !docTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0878b9] hover:bg-[#07558c] text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {uploading ? 'Publication...' : 'Publier le document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP DOCUMENT READER MODAL (ECO-DATA & OFFLINE) */}
      {readingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-fade-in">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0878b9] flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {readingDoc.fileType === 'PDF' ? '📕' : readingDoc.fileType === 'DOCX' ? '📘' : '📗'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                    {readingDoc.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {readingDoc.course} · {readingDoc.department} ({readingDoc.level})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSaveOffline(readingDoc)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    savedOfflineIds.includes(readingDoc.id)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Consulter sans consommer d'Internet"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedOfflineIds.includes(readingDoc.id) ? 'fill-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">
                    {savedOfflineIds.includes(readingDoc.id) ? 'Sauvegardé hors-ligne' : 'Sauvegarder'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingDoc(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content / Reader Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-[#0878b9]">
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Mode Lecteur Éco-Data : optimisé pour les connexions mobiles guinéennes
                </div>
                <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  {readingDoc.fileType}
                </span>
              </div>

              {/* Document details box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Résumé et contenu pédagogique
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {readingDoc.description || "Aucune description détaillée fournie pour ce document. Ce fichier contient l'ensemble des notions, exercices d'application et corrigés pour ce module à l'ISSEG."}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Partagé par : <strong>{readingDoc.authorName}</strong></span>
                  <span>{new Date(readingDoc.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Direct file access */}
              {readingDoc.fileUrl && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Fichier complet source</h5>
                    <p className="text-[11px] text-slate-500">Cliquez pour ouvrir ou télécharger la version haute résolution.</p>
                  </div>
                  <a
                    href={readingDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#0878b9] text-white rounded-xl text-xs font-bold hover:bg-[#07558c] flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ouvrir
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                ISSEG CONNECT · Bibliothèque Universitaire
              </span>
              <button
                type="button"
                onClick={() => setReadingDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
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
