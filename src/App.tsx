import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/AuthView';
import { StudentCardVerificationView } from './components/StudentCardVerificationView';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { FeedView } from './components/FeedView';
import { GroupsView } from './components/GroupsView';
import { MessagesView } from './components/MessagesView';
import { DocumentsView } from './components/DocumentsView';
import { PedagogyStageView } from './components/PedagogyStageView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { Toast, ToastMessage } from './components/Toast';

function MainApp() {
  const { currentUser, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addNotification('Installation d\'ISSEG Connect réussie !', 'success');
      setDeferredPrompt(null);
    }
  };

  const addNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#10152f] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-3xl bg-white p-2 shadow-2xl flex items-center justify-center mb-4 animate-pulse">
          <img src="/isseg-logo.png" alt="ISSEG Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-black text-white tracking-widest">
          ISSEG <span className="text-[#60b8ee]">CONNECT</span>
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Connexion à la communauté universitaire...
        </p>
        <div className="mt-6 w-8 h-8 border-3 border-[#0878b9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <AuthView onNotify={addNotification} />
      </>
    );
  }

  // Mandatory verification of Carte Unique de l'Etudiant before accessing main interface
  if (profile && (!profile.studentCardPhotoUrl || profile.verificationStatus === 'missing_card')) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <StudentCardVerificationView onNotify={addNotification} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fc] flex flex-col">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <TopHeader
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        unreadNotifsCount={1}
        profile={profile}
        onOpenInstall={deferredPrompt ? triggerInstall : undefined}
      />

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {currentPage === 'home' && (
          <FeedView onNotify={addNotification} />
        )}
        {currentPage === 'groups' && (
          <GroupsView onNotify={addNotification} />
        )}
        {currentPage === 'messages' && (
          <MessagesView onNotify={addNotification} />
        )}
        {currentPage === 'documents' && (
          <DocumentsView onNotify={addNotification} />
        )}
        {currentPage === 'pedagogy' && (
          <PedagogyStageView onNotify={addNotification} />
        )}
        {currentPage === 'notifications' && (
          <NotificationsView onNotify={addNotification} onNavigate={setCurrentPage} />
        )}
        {currentPage === 'profile' && (
          <ProfileView onNotify={addNotification} onNavigate={setCurrentPage} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        unreadCount={0}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
