import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppNotification } from '../types';
import { CheckCircle, XCircle, Info, AlertTriangle, X, Bell } from 'lucide-react';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (type: AppNotification['type'], message: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Toasts are ephemeral notifications shown on screen
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  const addNotification = useCallback((type: AppNotification['type'], message: string) => {
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      read: false,
    };

    // Add to history (limit to last 20)
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    
    // Add to active toasts
    setToasts(prev => [...prev, newNotification]);

    // Auto dismiss toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotification.id));
    }, 4000);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, removeNotification, clearAll }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="pointer-events-auto flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-xl p-4 min-w-[320px] max-w-md animate-in slide-in-from-right-full duration-300"
          >
            <div className={`flex-shrink-0 rounded-full p-1 ${
                toast.type === 'success' ? 'text-emerald-600 bg-emerald-50' :
                toast.type === 'error' ? 'text-red-600 bg-red-50' :
                toast.type === 'warning' ? 'text-amber-600 bg-amber-50' :
                'text-blue-600 bg-blue-50'
            }`}>
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <XCircle size={20} />}
                {toast.type === 'warning' && <AlertTriangle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{toast.message}</p>
            </div>
            <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};