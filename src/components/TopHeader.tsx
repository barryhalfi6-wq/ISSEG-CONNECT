import React from 'react';
import { Bell, Home, Users, MessageSquare, BookOpen, User, GraduationCap } from 'lucide-react';
import { UserProfile } from '../types';

interface TopHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifsCount: number;
  profile: UserProfile | null;
  onOpenInstall?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  onNavigate,
  unreadNotifsCount,
  profile,
  onOpenInstall
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'IS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#10152f] text-white px-4 sm:px-6 py-3.5 shadow-md flex items-center justify-between">
      {/* Brand */}
      <div
        onClick={() => onNavigate('home')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
          <img
            src="/isseg-logo.png"
            alt="Logo ISSEG"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-wider leading-none">
            ISSEG <span className="text-[#60b8ee]">CONNECT</span>
          </h1>
          <p className="text-[10px] text-slate-300 font-medium mt-1">
            La communauté universitaire
          </p>
        </div>
      </div>

      {/* Desktop navigation tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-xl">
        <button
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentPage === 'home' ? 'bg-[#0878b9] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          Accueil
        </button>
        <button
          onClick={() => onNavigate('groups')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentPage === 'groups' ? 'bg-[#0878b9] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Groupes
        </button>
        <button
          onClick={() => onNavigate('messages')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentPage === 'messages' ? 'bg-[#0878b9] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Messagerie
        </button>
        <button
          onClick={() => onNavigate('documents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentPage === 'documents' ? 'bg-[#0878b9] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Cours & Docs
        </button>
        <button
          onClick={() => onNavigate('pedagogy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentPage === 'pedagogy' ? 'bg-[#0878b9] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Stages & Pédagogie
        </button>
      </nav>

      {/* Right actions: Install App, Notifications & Profile avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {onOpenInstall && (
          <button
            type="button"
            onClick={onOpenInstall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-[#0878b9] to-[#5146e5] hover:opacity-90 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm"
            title="Installer l'application"
          >
            <span>📲</span>
            <span className="hidden xs:inline sm:inline">Installer l'app</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          className={`relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors ${
            currentPage === 'notifications' ? 'bg-white/20 ring-2 ring-[#0878b9]' : ''
          }`}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-white" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#10152f]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors ${
            currentPage === 'profile' ? 'ring-2 ring-[#0878b9]' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0878b9] to-[#8060ed] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {getInitials(profile?.fullName)}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-100 max-w-[100px] truncate">
            {profile?.firstName || 'Profil'}
          </span>
        </button>
      </div>
    </header>
  );
};
