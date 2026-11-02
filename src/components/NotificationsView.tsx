import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markNotificationAsRead } from '../services/dataService';
import { NotificationItem } from '../types';
import { Bell, Heart, MessageSquare, Users, BookOpen, Check, CheckCheck } from 'lucide-react';

interface NotificationsViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (page: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNotify, onNavigate }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [currentUser]);

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (notif.read) return;
    try {
      await markNotificationAsRead(notif.id);
    } catch (e) {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-[#0878b9]" />;
      case 'group':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 pt-4 px-3 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Notifications
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Les activités récentes au sein de ta communauté universitaire.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Always display university welcome message */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0878b9] flex items-center justify-center flex-shrink-0">
            🎓
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800">
              Bienvenue sur ISSEG Connect !
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Ton compte est actif. Tu peux dès à présent échanger sur le fil d'actualité, rejoindre des groupes d'études et consulter les cours.
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">Campus de Lambanyi</span>
          </div>
        </div>

        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleMarkAsRead(notif)}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
              notif.read ? 'border-slate-100 opacity-80' : 'border-blue-200 bg-blue-50/20 shadow-xs'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800">{notif.title}</h4>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#0878b9] flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
