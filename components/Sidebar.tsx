import React from 'react';
import { LayoutDashboard, Users, Package, DollarSign, BrainCircuit, Settings, LogOut, ShoppingBag, Briefcase, UserCog, CheckSquare, FileBarChart, Hammer } from 'lucide-react';
import { Tab, User } from '../types';
import { useLanguage } from './LanguageContext';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user }) => {
  const { t } = useLanguage();

  // ✅ Helper function to get user role (handles both string and object)
  const getUserRole = (user: User | null): string => {
    if (!user) return '';
    
    // If role is an object with name property (from API)
    if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      return user.role.name.toLowerCase();
    }
    
    // If role is a string (legacy)
    if (typeof user.role === 'string') {
      return user.role.toLowerCase();
    }
    
    return '';
  };

  const userRole = getUserRole(user);

  const allMenuItems = [
    { id: Tab.DASHBOARD, label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.CRM, label: t('sidebar.crm'), icon: <Users size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.SALES, label: t('sidebar.sales'), icon: <Briefcase size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.PRODUCTION, label:t('sidebar.production'), icon: <Hammer size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.TASKS, label: t('sidebar.tasks'), icon: <CheckSquare size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.INVENTORY, label: t('sidebar.inventory'), icon: <Package size={20} />, roles: ['admin', 'manager', 'employee'] },
    { id: Tab.PURCHASES, label: t('sidebar.purchases'), icon: <ShoppingBag size={20} />, roles: ['admin', 'manager'] },
    { id: Tab.FINANCE, label: t('sidebar.finance'), icon: <DollarSign size={20} />, roles: ['admin', 'manager'] },
    { id: Tab.HR, label: t('sidebar.hr'), icon: <UserCog size={20} />, roles: ['admin', 'manager'] },
    { id: Tab.REPORTS, label: t('sidebar.reports'), icon: <FileBarChart size={20} />, roles: ['admin', 'manager'] },
    { id: Tab.AI_INSIGHTS, label: t('sidebar.ai_insights'), icon: <BrainCircuit size={20} />, roles: ['admin', 'manager'] },
  ];

  // ✅ Filter menu items based on user role (case-insensitive)
  const filteredMenuItems = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );


  return (
    <div className="w-16 md:w-64 bg-slate-900 text-white h-screen fixed start-0 top-0 flex flex-col shadow-xl z-30 group transition-all duration-300 hover:w-64 overflow-hidden">
      <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 mx-auto md:mx-0 group-hover:mx-0 transition-all">
            <span className="font-bold text-xl">N</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block group-hover:block">
            Nexus ERP
            </h1>
        </div>
      </div>

      <nav className="flex-1 p-2 md:p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative group/item
              ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              justify-center md:justify-start group-hover:justify-start
            `}
            title={item.label} 
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="font-medium whitespace-nowrap opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-300 hidden md:block group-hover:block">
                {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-2 md:p-4 border-t border-slate-800">
        {/* ✅ Check role properly (case-insensitive) */}
        {userRole === 'admin' && (
            <button 
                onClick={() => setActiveTab(Tab.SETTINGS)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative
                ${activeTab === Tab.SETTINGS ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                justify-center md:justify-start group-hover:justify-start
                `}
                title={t('common.settings')}
            >
            <div className="shrink-0"><Settings size={20} /></div>
            <span className="font-medium whitespace-nowrap opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-300 hidden md:block group-hover:block">
                {t('common.settings')}
            </span>
            </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors mt-1 justify-center md:justify-start group-hover:justify-start"
          title={t('common.logout')}
        >
          <div className="shrink-0"><LogOut size={20} /></div>
          <span className="font-medium whitespace-nowrap opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-300 hidden md:block group-hover:block">
              {t('common.logout')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;