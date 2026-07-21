
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, X, Check, Globe } from 'lucide-react';
import { User, Tab } from '../types';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';

interface HeaderProps {
  user: User | null;
  activeTab: Tab;
}

const Header: React.FC<HeaderProps> = ({ user, activeTab }) => {
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotification();
  const { language, setLanguage, t } = useLanguage();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTitle = (tab: Tab) => {
    // Basic fallback logic for titles not yet in dict, though logic implies we should translate tabs.
    // For the Header title specifically, we rely on the Tab key for translation lookup in Sidebar context usually,
    // but here we can just use the generic name or a specific header translation if added.
    // Using simple mapping for now based on 'sidebar' translations which match tabs
    const key = tab.toLowerCase().replace('ai_insights', 'ai_insights'); 
    return t(`sidebar.${key}`) || tab;
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
        {/* Title */}
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 capitalize">
                {getTitle(activeTab)}
            </h1>
        </div>

        <div className="flex items-center gap-4">
            {/* Global Search (Visual only for now) */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-64 border border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search size={16} className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder={`${t('common.search')}`} 
                    className="bg-transparent border-none focus:outline-none text-sm ms-2 w-full text-slate-700"
                />
            </div>

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
                <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none flex items-center gap-1"
                >
                    <Globe size={20} />
                    <span className="text-xs font-bold uppercase">{language}</span>
                </button>

                {isLangOpen && (
                    <div className="absolute end-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                        <div className="p-1">
                            <button 
                                onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
                                className={`w-full text-start px-3 py-2 text-sm rounded-lg flex items-center justify-between ${language === 'en' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                English {language === 'en' && <Check size={14} />}
                            </button>
                            <button 
                                onClick={() => { setLanguage('es'); setIsLangOpen(false); }}
                                className={`w-full text-start px-3 py-2 text-sm rounded-lg flex items-center justify-between ${language === 'es' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Español {language === 'es' && <Check size={14} />}
                            </button>
                            <button 
                                onClick={() => { setLanguage('ar'); setIsLangOpen(false); }}
                                className={`w-full text-start px-3 py-2 text-sm rounded-lg flex items-center justify-between ${language === 'ar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                العربية {language === 'ar' && <Check size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 end-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {isNotifOpen && (
                    <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800">{t('common.notifications')}</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                                    <Check size={12} /> {t('common.markRead')}
                                </button>
                            )}
                        </div>
                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!notif.read ? 'bg-indigo-50/30' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                                notif.type === 'success' ? 'bg-emerald-500' :
                                                notif.type === 'error' ? 'bg-red-500' :
                                                notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                            <div className="flex-1 pe-4">
                                                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                                className="absolute top-2 end-2 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bell size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm">{t('common.noNotifications')}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-700">{t('common.viewAll')}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 ps-6 border-s border-slate-200">
                <div className="text-end hidden sm:block">
                    <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-indigo-100">
                    {user?.name.charAt(0)}
                </div>
            </div>
        </div>
    </header>
  );
};

export default Header;
