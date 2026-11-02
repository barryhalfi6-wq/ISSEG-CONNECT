import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToGroups,
  createStudyGroup,
  toggleJoinGroup,
  deleteStudyGroup,
  subscribeToGroupMessages,
  sendGroupMessage
} from '../services/dataService';
import { Users, Plus, MessageSquare, BookOpen, Send, X, ArrowLeft, Check, Trash2, Mic } from 'lucide-react';
import { AudioVoiceRecorder } from './AudioVoiceRecorder';
import { AudioPlayerBubble } from './AudioPlayerBubble';
import { GroupItem, GroupMessageItem } from '../types';

interface GroupsViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ onNotify }) => {
  const { currentUser, profile } = useAuth();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('Tous');
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupDept, setNewGroupDept] = useState('Sciences');
  const [newGroupIcon, setNewGroupIcon] = useState('📚');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToGroups((list) => {
      setGroups(list);
    });
    return () => unsub();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newGroupName.trim()) return;

    setCreating(true);
    try {
      await createStudyGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        department: newGroupDept,
        creatorId: currentUser.uid,
        creatorName: profile?.fullName || 'Étudiant ISSEG',
        icon: newGroupIcon
      });
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      onNotify('Groupe d\'étude créé avec succès !', 'success');
    } catch (err: any) {
      onNotify('Erreur création groupe : ' + err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleJoin = async (group: GroupItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const isMember = group.members?.includes(currentUser.uid) || false;
    try {
      await toggleJoinGroup(group.id, currentUser.uid, isMember);
      onNotify(isMember ? 'Tu as quitté le groupe.' : 'Tu as rejoint le groupe !', 'info');
    } catch (err: any) {
      onNotify('Erreur d\'adhésion au groupe', 'error');
    }
  };

  const filteredGroups = selectedDept === 'Tous'
    ? groups
    : groups.filter((g) => g.department === selectedDept);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20 pt-4 px-3 sm:px-0">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Groupes d'études
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Retrouve tes camarades de promotion et travaille en équipe.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-[#0878b9] hover:bg-[#07558c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un groupe</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['Tous', 'Sciences', 'Lettres et sciences humaines', 'Langues'].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDept === dept
                ? 'bg-[#10152f] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Group List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Aucun groupe dans ce pôle</h4>
            <p className="text-xs text-slate-400 mt-1">Crée le premier groupe de travail pour ta filière !</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isMember = currentUser ? group.members?.includes(currentUser.uid) : false;
            return (
              <div
                key={group.id}
                onClick={() => setActiveGroup(group)}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  {group.icon || '📚'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{group.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {group.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{group.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                    <span>👥 {group.members?.length || 1} membre{(group.members?.length || 1) > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>Créé par {group.creatorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleJoin(group, e)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isMember
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-[#0878b9] text-white hover:bg-[#07558c] shadow-sm'
                    }`}
                  >
                    {isMember ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Membre</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Rejoindre</span>
                      </>
                    )}
                  </button>

                  {group.creatorId === currentUser?.uid && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Supprimer le groupe "${group.name}" ?`)) return;
                        try {
                          await deleteStudyGroup(group.id);
                          onNotify('Groupe supprimé avec succès.', 'info');
                        } catch {
                          onNotify('Erreur suppression groupe', 'error');
                        }
                      }}
                      title="Supprimer ce groupe"
                      className="p-2 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ACTIVE GROUP CHAT MODAL */}
      {activeGroup && (
        <GroupChatModal
          group={activeGroup}
          currentUser={currentUser}
          profile={profile}
          onClose={() => setActiveGroup(null)}
          onNotify={onNotify}
        />
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0878b9]" />
                Créer un groupe d'étude
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du groupe</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex : Révision Didactique L2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Objectif</label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Ex : Entraide sur les exposés, partage des TD et préparation des examens de fin de semestre."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Département</label>
                  <select
                    value={newGroupDept}
                    onChange={(e) => setNewGroupDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
                  >
                    <option value="Sciences">Sciences</option>
                    <option value="Lettres et sciences humaines">Lettres & Sc. Humaines</option>
                    <option value="Langues">Langues</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icône</label>
                  <select
                    value={newGroupIcon}
                    onChange={(e) => setNewGroupIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0878b9] focus:outline-none text-base"
                  >
                    <option value="📚">📚 Livres</option>
                    <option value="📐">📐 Mathématiques</option>
                    <option value="🔬">🔬 Laboratoire</option>
                    <option value="🎓">🎓 Pédagogie</option>
                    <option value="💻">💻 Informatique</option>
                    <option value="🌍">🌍 Géographie</option>
                    <option value="✍️">✍️ Littérature</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0878b9] hover:bg-[#07558c] text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer le groupe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: GROUP CHAT MODAL
// ==========================================
interface GroupChatModalProps {
  group: GroupItem;
  currentUser: any;
  profile: any;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  group,
  currentUser,
  profile,
  onClose,
  onNotify
}) => {
  const [messages, setMessages] = useState<GroupMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToGroupMessages(group.id, (list) => {
      setMessages(list);
    });
    return () => unsub();
  }, [group.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inputText.trim()) return;

    setSending(true);
    try {
      await sendGroupMessage(group.id, {
        authorId: currentUser.uid,
        authorName: profile?.fullName || 'Étudiant ISSEG',
        content: inputText.trim()
      });
      setInputText('');
    } catch (err: any) {
      onNotify('Erreur envoi message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (audioDataUrl: string, durationSec: number) => {
    if (!currentUser) return;
    try {
      await sendGroupMessage(group.id, {
        authorId: currentUser.uid,
        authorName: profile?.fullName || 'Étudiant ISSEG',
        content: '🎤 Note vocale',
        audioUrl: audioDataUrl,
        audioDuration: durationSec
      });
      setShowVoiceRecorder(false);
      onNotify('Note vocale envoyée au groupe !', 'success');
    } catch {
      onNotify('Erreur envoi note vocale', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-100">
        {/* Chat header */}
        <div className="px-5 py-3.5 bg-[#10152f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-2xl">{group.icon || '📚'}</div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">{group.name}</h3>
              <p className="text-[11px] text-slate-300">
                {group.members?.length || 1} membre{(group.members?.length || 1) > 1 ? 's' : ''} · {group.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50 text-[#0878b9]" />
              <p className="text-xs font-semibold text-slate-600">Bienvenue dans le salon du groupe !</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Pose tes questions et échange des astuces avec les membres de ce groupe.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.authorId === currentUser?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                    {msg.authorName}
                  </span>
                  {msg.audioUrl ? (
                    <AudioPlayerBubble
                      audioUrl={msg.audioUrl}
                      durationSeconds={msg.audioDuration}
                      isMine={isMine}
                    />
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                        isMine
                          ? 'bg-[#0878b9] text-white rounded-tr-xs shadow-sm shadow-blue-500/10'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input with voice recorder */}
        <div className="p-3 bg-white border-t border-slate-200">
          {showVoiceRecorder ? (
            <AudioVoiceRecorder
              onSendAudio={handleSendVoice}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrire un message au groupe..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0878b9] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0878b9] transition-colors shadow-xs"
                title="Enregistrer une note vocale pour le groupe"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="p-2.5 rounded-xl bg-[#0878b9] hover:bg-[#07558c] text-white disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
