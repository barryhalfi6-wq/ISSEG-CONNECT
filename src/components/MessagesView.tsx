import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllStudents,
  ensureConversation,
  getOrCreateConversationId,
  subscribeToConversations,
  subscribeToDirectMessages,
  sendDirectMessage
} from '../services/dataService';
import { ConversationItem, DirectMessageItem, UserProfile } from '../types';
import { Search, MessageSquare, Send, ArrowLeft, Users, Sparkles, UserCheck, Mic } from 'lucide-react';
import { AudioVoiceRecorder } from './AudioVoiceRecorder';
import { AudioPlayerBubble } from './AudioPlayerBubble';

interface MessagesViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onNotify }) => {
  const { currentUser, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'conversations' | 'directory'>('conversations');

  // Conversations & Directory
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Active chat state
  const [activeChatUser, setActiveChatUser] = useState<{ uid: string; name: string } | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Subscribe to user conversations
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToConversations(currentUser.uid, (list) => {
      setConversations(list);
    });
    return () => unsub();
  }, [currentUser]);

  // Load students directory when switching to directory tab
  useEffect(() => {
    if (activeTab === 'directory') {
      setLoadingStudents(true);
      getAllStudents()
        .then((list) => {
          setStudents(list.filter((s) => s.uid !== currentUser?.uid));
        })
        .catch(() => {
          onNotify('Impossible de charger l\'annuaire', 'error');
        })
        .finally(() => setLoadingStudents(false));
    }
  }, [activeTab, currentUser]);

  // Subscribe to messages when a chat is open
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = subscribeToDirectMessages(activeConvId, (list) => {
      setMessages(list);
    });
    return () => unsub();
  }, [activeConvId]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChatWithStudent = async (targetStudent: UserProfile) => {
    if (!currentUser || !targetStudent.uid) return;
    const targetName = targetStudent.fullName || `${targetStudent.firstName || ''} ${targetStudent.lastName || ''}`.trim() || 'Étudiant ISSEG';
    const convId = getOrCreateConversationId(currentUser.uid, targetStudent.uid);
    setActiveConvId(convId);
    setActiveChatUser({ uid: targetStudent.uid, name: targetName });
    try {
      await ensureConversation(
        currentUser.uid,
        profile?.fullName || 'Étudiant ISSEG',
        targetStudent.uid,
        targetName
      );
    } catch (err: any) {
      console.warn('Conversation ensured in background:', err);
    }
  };

  const handleOpenConversation = (conv: ConversationItem) => {
    if (!currentUser) return;
    const otherId = conv.participants.find((p) => p !== currentUser.uid);
    const otherName = otherId && conv.participantNames ? conv.participantNames[otherId] : 'Camarade ISSEG';
    setActiveConvId(conv.id);
    setActiveChatUser({ uid: otherId || '', name: otherName });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeConvId || !activeChatUser || !inputText.trim()) return;

    setSending(true);
    try {
      await sendDirectMessage(
        activeConvId,
        currentUser.uid,
        profile?.fullName || 'Étudiant',
        activeChatUser.uid,
        inputText.trim()
      );
      setInputText('');
    } catch (err: any) {
      onNotify('Erreur lors de l\'envoi du message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (audioDataUrl: string, durationSec: number) => {
    if (!currentUser || !activeConvId || !activeChatUser) return;
    try {
      await sendDirectMessage(
        activeConvId,
        currentUser.uid,
        profile?.fullName || 'Étudiant',
        activeChatUser.uid,
        '🎤 Note vocale',
        audioDataUrl,
        durationSec
      );
      setShowVoiceRecorder(false);
      onNotify('Note vocale envoyée !', 'success');
    } catch {
      onNotify('Erreur envoi note vocale', 'error');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'IS';
    const p = name.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 pt-4 px-3 sm:px-0">
      {/* If Chat Window is Active */}
      {activeChatUser && activeConvId ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-[#10152f] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveChatUser(null);
                  setActiveConvId(null);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0878b9] to-[#8060ed] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {getInitials(activeChatUser.name)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{activeChatUser.name}</h3>
                <span className="text-[10px] text-emerald-400 font-medium">Étudiant ISSEG</span>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-[#0878b9]" />
                <p className="text-xs font-semibold text-slate-600">Début de la conversation</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Envoie un message à {activeChatUser.name} pour échanger sur vos cours ou projets.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === currentUser?.uid;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    {m.audioUrl ? (
                      <AudioPlayerBubble
                        audioUrl={m.audioUrl}
                        durationSeconds={m.audioDuration}
                        isMine={isMine}
                      />
                    ) : (
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${
                          isMine
                            ? 'bg-[#0878b9] text-white rounded-tr-xs shadow-sm shadow-blue-500/10'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-sm'
                        }`}
                      >
                        {m.content}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recorder or Standard Input */}
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
                  placeholder={`Écrire à ${activeChatUser.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0878b9] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0878b9] transition-colors shadow-xs"
                  title="Enregistrer une note vocale"
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
      ) : (
        /* Conversation list / Directory main view */
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Messagerie & Annuaire
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Communique en direct avec tes camarades de l'ISSEG.
              </p>
            </div>
          </div>

          {/* Switch tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200/70 shadow-xs">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'conversations'
                  ? 'bg-[#10152f] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Mes conversations ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-[#10152f] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Annuaire des étudiants
            </button>
          </div>

          {/* CONVERSATIONS LIST */}
          {activeTab === 'conversations' && (
            <div className="space-y-2.5">
              {conversations.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#0878b9] flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Pas encore de message</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Consulte l'annuaire pour trouver tes collègues de promotion et démarrer un échange.
                  </p>
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="px-4 py-2 bg-[#0878b9] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#07558c]"
                  >
                    Explorer l'annuaire ISSEG
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherId = conv.participants.find((p) => p !== currentUser?.uid);
                  const otherName = otherId && conv.participantNames ? conv.participantNames[otherId] : 'Camarade ISSEG';
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleOpenConversation(conv)}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#60a5fa] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        {getInitials(otherName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                            {otherName}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.lastMessage || 'Nouvelle discussion'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ANNUAIRE DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, filière ou département..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#0878b9] focus:outline-none shadow-xs"
                />
              </div>

              {loadingStudents ? (
                <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400">
                  Chargement de l'annuaire universitaire...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">Aucun étudiant trouvé correspondant à la recherche.</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.uid}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#c084fc] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                        {getInitials(student.fullName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {student.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {student.program || 'Filière'} · {student.level || ''}
                        </p>
                        <span className="inline-block text-[10px] text-slate-400 font-medium">
                          {student.department || 'ISSEG'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartChatWithStudent(student)}
                      className="px-3 py-2 bg-[#0878b9] hover:bg-[#07558c] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Écrire</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
