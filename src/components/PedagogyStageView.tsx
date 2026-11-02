import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToStageLogs, addStageLog, deleteStageLog } from '../services/dataService';
import { StageLogItem } from '../types';
import { BookOpen, GraduationCap, Plus, Trash2, Calendar, MapPin, CheckCircle, FileText, Sparkles, X, ChevronRight } from 'lucide-react';

interface PedagogyStageViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Fiches pédagogiques types d'enseignement en Guinée
const SAMPLE_PEDAGOGICAL_TEMPLATES = [
  {
    id: 'f1',
    discipline: 'Français (Didactique)',
    title: 'Fiche Didactique : L\'Explication de texte littéraire',
    level: 'Lycée (1ère Année / Terminale)',
    duration: '2 heures',
    objective: 'Amener l\'élève à dégager les axes de lecture et analyser les figures de style dans un extrait de roman africain.',
    steps: [
      { step: '1. Phase d\'accroche (10 min)', desc: 'Rappel de la biographie de l\'auteur (ex: Camara Laye) et situation de l\'extrait dans l\'œuvre.' },
      { step: '2. Lecture magistrale & impressions (15 min)', desc: 'Lecture expressive par le professeur stagiaire, puis lecture silencieuse par les élèves.' },
      { step: '3. Explication linéaire & axes de sens (50 min)', desc: 'Identification du champ lexical dominant, étude des métaphores et construction du sens.' },
      { step: '4. Synthèse & Évaluation formative (25 min)', desc: 'Formulation collective de l\'intérêt philosophique et littéraire de l\'extrait.' },
      { step: '5. Travail autonome (10 min)', desc: 'Consigne de commentaire dirigé pour la séance suivante.' }
    ]
  },
  {
    id: 'f2',
    discipline: 'Mathématiques & Physique',
    title: 'Fiche Didactique : Étude cinématique du Mouvement Rectiligne Uniforme (MRU)',
    level: 'Collège (10ème Année) / Lycée (10ème - 11ème)',
    duration: '2 heures',
    objective: 'Établir expérimentalement l\'équation horaire x(t) = v.t + x0 et interpréter le graphe vitesse-temps.',
    steps: [
      { step: '1. Motivation & Problématique (15 min)', desc: 'Exemple concret de la circulation sur l\'axe Lambanyi-Kipé avec vitesse constante.' },
      { step: '2. Démarche d\'investigation (45 min)', desc: 'Tableau de mesures temps/distance, tracé du graphe sur papier millimétré au tableau.' },
      { step: '3. Institutionnalisation de la règle (30 min)', desc: 'Définition du vecteur vitesse, unités du Système International (m/s et km/h).' },
      { step: '4. Exercice d\'application immédiate (25 min)', desc: 'Calcul du temps de parcours d\'un véhicule d\'une ville guinéenne à une autre.' }
    ]
  },
  {
    id: 'f3',
    discipline: 'Sciences Naturelles (SVT)',
    title: 'Fiche Didactique : La Photosynthèse et la nutrition végétale',
    level: 'Collège (9ème - 10ème Année)',
    duration: '1 heure 30 min',
    objective: 'Mettre en évidence le rôle de la lumière et du CO2 dans la synthèse d\'amidon par les feuilles vertes.',
    steps: [
      { step: '1. Situation problème (10 min)', desc: 'Pourquoi les plantes à l\'ombre croissent-elles plus lentement que celles exposées au soleil ?' },
      { step: '2. Expérience de Sachs à l\'eau iodée (40 min)', desc: 'Décoloration d\'une feuille à l\'alcool bouillant et test de coloration à l\'iode.' },
      { step: '3. Conclusion & Schéma bilan (25 min)', desc: 'Élaboration collective du schéma fonctionnel de la feuille.' }
    ]
  }
];

export const PedagogyStageView: React.FC<PedagogyStageViewProps> = ({ onNotify }) => {
  const { currentUser, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'stage_logs'>('templates');
  const [stageLogs, setStageLogs] = useState<StageLogItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // New stage log modal
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [classLevel, setClassLevel] = useState('10ème Année');
  const [subject, setSubject] = useState(profile?.program || 'Didactique');
  const [lessonTheme, setLessonTheme] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supervisorName, setSupervisorName] = useState('');
  const [observations, setObservations] = useState('');
  const [pedagogicalNotes, setPedagogicalNotes] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToStageLogs(currentUser.uid, (list) => {
      setStageLogs(list);
    });
    return () => unsub();
  }, [currentUser]);

  const handleCreateStageLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !schoolName.trim() || !lessonTheme.trim()) {
      onNotify('Veuillez renseigner l\'établissement et le thème de la leçon.', 'error');
      return;
    }

    setSavingLog(true);
    try {
      await addStageLog(currentUser.uid, {
        studentId: currentUser.uid,
        studentName: profile?.fullName || 'Étudiant ISSEG',
        schoolName: schoolName.trim(),
        classLevel,
        subject,
        lessonTheme: lessonTheme.trim(),
        date,
        supervisorName: supervisorName.trim() || 'Maître de stage',
        observations: observations.trim(),
        pedagogicalNotes: pedagogicalNotes.trim(),
        status: 'valide'
      });
      setIsAddLogOpen(false);
      // Reset form
      setSchoolName('');
      setLessonTheme('');
      setObservations('');
      setPedagogicalNotes('');
      onNotify('Fiche de stage enregistrée dans votre carnet pédagogique !', 'success');
    } catch {
      onNotify('Erreur enregistrement de la fiche', 'error');
    } finally {
      setSavingLog(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Supprimer cette entrée de votre carnet de stage ?')) return;
    try {
      await deleteStageLog(currentUser.uid, logId);
      onNotify('Entrée supprimée.', 'info');
    } catch {
      onNotify('Erreur suppression', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-4 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#0878b9] bg-blue-50 px-2.5 py-0.5 rounded-full">
            Institut Supérieur des Sciences de l'Éducation
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
            Pédagogie & Stages Pratiques
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Préparation didactique, fiches de leçons et carnet de suivi en établissement d'application.
          </p>
        </div>

        {activeTab === 'stage_logs' && (
          <button
            type="button"
            onClick={() => setIsAddLogOpen(true)}
            className="px-4 py-2.5 bg-[#0878b9] hover:bg-[#07558c] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une observation</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/70 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-[#10152f] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Fiches de Leçons Modèles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stage_logs')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stage_logs'
              ? 'bg-[#10152f] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Mon Carnet de Stage ({stageLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_PEDAGOGICAL_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0878b9]">
                    {tmpl.discipline}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ⏱ {tmpl.duration}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 mb-1 leading-snug">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
                  <strong>Objectif :</strong> {tmpl.objective}
                </p>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Déroulement type :
                  </span>
                  {tmpl.steps.slice(0, 3).map((st, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-[#0878b9] font-bold text-[10px]">•</span>
                      <span className="truncate">{st.step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTemplate(tmpl)}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-[#0878b9] font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
              >
                <span>Consulter la fiche complète</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: STAGE LOGS */}
      {activeTab === 'stage_logs' && (
        <div className="space-y-3">
          {stageLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#0878b9] flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Votre carnet de stage est vide</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Consignez vos séances d'enseignement pratique, observations de classe et conseils de vos maîtres de stage dans les collèges et lycées de Conakry.
              </p>
              <button
                type="button"
                onClick={() => setIsAddLogOpen(true)}
                className="px-4 py-2 bg-[#0878b9] hover:bg-[#07558c] text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer ma première fiche de stage</span>
              </button>
            </div>
          ) : (
            stageLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {log.classLevel}
                      </span>
                      <span className="text-xs font-bold text-[#0878b9]">
                        {log.subject}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mt-1">
                      {log.lessonTheme}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer cette fiche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>Établissement :</strong> {log.schoolName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>Date :</strong> {log.date}</span>
                  </div>
                </div>

                {log.observations && (
                  <div className="text-xs text-slate-600 space-y-1">
                    <strong className="text-slate-800 text-[11px] uppercase tracking-wider block">
                      Observations en classe :
                    </strong>
                    <p className="pl-2 border-l-2 border-blue-200 text-slate-600 leading-relaxed">
                      {log.observations}
                    </p>
                  </div>
                )}

                {log.pedagogicalNotes && (
                  <div className="text-xs text-slate-600 space-y-1 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <strong className="text-amber-900 text-[11px] block">
                      Conseils du tuteur & Didactique :
                    </strong>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {log.pedagogicalNotes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TEMPLATE DETAIL MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#0878b9] uppercase">
                  {selectedTemplate.discipline}
                </span>
                <h3 className="font-bold text-sm text-slate-800">
                  {selectedTemplate.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                <p><strong>Niveau cible :</strong> {selectedTemplate.level}</p>
                <p className="mt-1"><strong>Objectif d'apprentissage :</strong> {selectedTemplate.objective}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Déroulement séquentiel de la leçon :
                </h4>
                {selectedTemplate.steps.map((st: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="font-bold text-[#0878b9] block">{st.step}</span>
                    <p className="text-slate-600 text-xs leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${selectedTemplate.title}\nObjectif : ${selectedTemplate.objective}\n\nDéroulement :\n` +
                    selectedTemplate.steps.map((s: any) => `${s.step} : ${s.desc}`).join('\n')
                  );
                  onNotify('Fiche didactique copiée dans le presse-papier !', 'success');
                }}
                className="w-full py-2.5 bg-[#0878b9] hover:bg-[#07558c] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Copier ce modèle de fiche didactique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAGE LOG MODAL */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0878b9]" />
                Nouvelle Observation de Stage ISSEG
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLogOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStageLog} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Établissement scolaire d'application *
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ex : Lycée 1er Mars, Collège Ratoma, Lycée Lambanyi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classe *</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  >
                    <option value="7ème Année">7ème Année</option>
                    <option value="8ème Année">8ème Année</option>
                    <option value="9ème Année">9ème Année</option>
                    <option value="10ème Année">10ème Année (Brevet)</option>
                    <option value="11ème Année">11ème Année</option>
                    <option value="12ème Année">12ème Année</option>
                    <option value="Terminale SM">Terminale SM</option>
                    <option value="Terminale SE">Terminale SE</option>
                    <option value="Terminale SS">Terminale SS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre / Thème de la leçon *
                </label>
                <input
                  type="text"
                  required
                  value={lessonTheme}
                  onChange={(e) => setLessonTheme(e.target.value)}
                  placeholder="Ex : Les figures de style, La gravitation universelle, Les équations..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maître de stage / Professeur tuteur
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Nom de l'enseignant titulaire"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Déroulement et observations de classe
                </label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Participation des élèves, gestion du tableau, gestion du temps..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0878b9] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarques didactiques & Conseils du tuteur
                </label>
                <textarea
                  rows={2}
                  value={pedagogicalNotes}
                  onChange={(e) => setPedagogicalNotes(e.target.value)}
                  placeholder="Recommandations pour la prochaine séance..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0878b9] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLogOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingLog}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0878b9] hover:bg-[#07558c] text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {savingLog ? 'Enregistrement...' : 'Enregistrer dans mon carnet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
