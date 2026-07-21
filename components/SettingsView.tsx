
import React, { useState } from 'react';
import { Building, Bell, Users, Lock, Save, CheckCircle, Shield, Mail, Globe, CreditCard, UserPlus, Trash2, FileText, Zap, Check, X } from 'lucide-react';
import { Subscription, SubscriptionTier } from '../types';
import { useLanguage } from './LanguageContext';

interface SettingsViewProps {
  subscription?: Subscription;
  setSubscription?: React.Dispatch<React.SetStateAction<Subscription>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ subscription, setSubscription }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'notifications' | 'security' | 'billing'>('general');
  const [isSaved, setIsSaved] = useState(false);

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Employee'
  });

  // Mock State for other settings
  const [companySettings, setCompanySettings] = useState({
    name: 'Nexus Enterprises',
    email: 'admin@nexus.com',
    address: '123 Innovation Blvd, Tech City, CA 94000',
    currency: 'USD',
    timezone: 'UTC-8'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    browserPush: false,
    weeklyReport: true,
    marketing: false
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Alex Johnson', role: 'Administrator', email: 'alex@nexus.com', status: 'Active' },
    { id: '2', name: 'Sarah Smith', role: 'Manager', email: 'sarah@nexus.com', status: 'Active' },
    { id: '3', name: 'Mike Brown', role: 'Sales Rep', email: 'mike@nexus.com', status: 'Active' },
  ]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDeleteUser = (id: string) => {
      if(window.confirm('Remove this user from the organization?')) {
          setTeamMembers(teamMembers.filter(m => m.id !== id));
      }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      status: 'Active'
    };
    setTeamMembers([...teamMembers, member]);
    setIsAddMemberModalOpen(false);
    setNewMember({ name: '', email: '', role: 'Employee' });
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (setSubscription) {
      if (window.confirm(`${t('settings.billing.upgrade_confirm')} ${tier}`)) {
        setSubscription(prev => ({
          ...prev,
          tier: tier,
          paymentMethod: tier === 'Free' ? undefined : (prev.paymentMethod || 'Visa ending in 4242')
        }));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Essential tools for small businesses just getting started.',
      features: ['Basic CRM', 'Inventory Tracking (up to 50 items)', 'Standard Invoicing', '1 User Seat'],
      tier: 'Free' as SubscriptionTier
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'Advanced features for growing teams and businesses.',
      features: ['Unlimited Inventory', 'Sales Orders & Quotes', 'Financial Reports', '5 User Seats', 'Email Reminders'],
      tier: 'Pro' as SubscriptionTier,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'Full power of Nexus ERP with AI and priority support.',
      features: ['AI Insights & Forecasting', 'Payroll Management', 'Advanced Security', 'Unlimited Users', 'Dedicated Support'],
      tier: 'Enterprise' as SubscriptionTier
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-bold text-slate-800">{t('settings.title')}</h3>
           </div>
           <nav className="p-2 space-y-1">
             <button 
               onClick={() => setActiveTab('general')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <Building size={18} />
               {t('settings.tabs.general')}
             </button>
             <button 
               onClick={() => setActiveTab('billing')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 activeTab === 'billing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <CreditCard size={18} />
               {t('settings.tabs.billing')}
             </button>
             <button 
               onClick={() => setActiveTab('team')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 activeTab === 'team' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <Users size={18} />
               {t('settings.tabs.team')}
             </button>
             <button 
               onClick={() => setActiveTab('notifications')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <Bell size={18} />
               {t('settings.tabs.notifications')}
             </button>
             <button 
               onClick={() => setActiveTab('security')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <Lock size={18} />
               {t('settings.tabs.security')}
             </button>
           </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar relative">
         {/* Success Notification */}
         {isSaved && (
            <div className="absolute top-4 end-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium animate-in fade-in slide-in-from-top-2 z-50">
              <CheckCircle size={16} />
              Changes saved successfully
            </div>
         )}

         {activeTab === 'general' && (
           <div className="p-8 max-w-3xl">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('settings.general.title')}</h2>
             
             <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.general.company_name')}</label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={companySettings.name}
                     onChange={e => setCompanySettings({...companySettings, name: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.general.email')}</label>
                   <input 
                     type="email" 
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={companySettings.email}
                     onChange={e => setCompanySettings({...companySettings, email: e.target.value})}
                   />
                 </div>
               </div>

               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.general.address')}</label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={companySettings.address}
                     onChange={e => setCompanySettings({...companySettings, address: e.target.value})}
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.general.currency')}</label>
                   <div className="relative">
                     <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <CreditCard size={18} />
                     </div>
                     <select 
                       className="w-full ps-10 pe-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                       value={companySettings.currency}
                       onChange={e => setCompanySettings({...companySettings, currency: e.target.value})}
                     >
                       <option value="USD">USD ($)</option>
                       <option value="EUR">EUR (€)</option>
                       <option value="GBP">GBP (£)</option>
                       <option value="JPY">JPY (¥)</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.general.timezone')}</label>
                   <div className="relative">
                     <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Globe size={18} />
                     </div>
                     <select 
                       className="w-full ps-10 pe-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                       value={companySettings.timezone}
                       onChange={e => setCompanySettings({...companySettings, timezone: e.target.value})}
                     >
                       <option value="UTC-8">Pacific Time (UTC-8)</option>
                       <option value="UTC-5">Eastern Time (UTC-5)</option>
                       <option value="UTC+0">GMT (UTC+0)</option>
                       <option value="UTC+1">Central European Time (UTC+1)</option>
                     </select>
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                 <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
                   <Save size={18} />
                   {t('settings.general.save')}
                 </button>
               </div>
             </div>
           </div>
         )}

         {activeTab === 'billing' && subscription && (
           <div className="p-8">
             <div className="flex justify-between items-end mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">{t('settings.billing.title')}</h2>
                 <p className="text-slate-500 mt-1">{t('settings.billing.subtitle')}</p>
               </div>
               <div className="text-end">
                 <p className="text-sm text-slate-500">{t('settings.billing.current_plan')}</p>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm mt-1 border border-indigo-100">
                   <Zap size={14} fill="currentColor" />
                   {subscription.tier}
                 </div>
               </div>
             </div>

             {/* Current Usage/Billing Info */}
             <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600">
                   <CreditCard size={24} />
                 </div>
                 <div>
                   <p className="font-medium text-slate-800">{t('settings.billing.payment_method')}</p>
                   <p className="text-sm text-slate-500">{subscription.paymentMethod || t('settings.billing.no_payment')}</p>
                 </div>
               </div>
               <div className="text-end">
                 <p className="text-sm font-medium text-slate-800">{t('settings.billing.next_renewal')}</p>
                 <p className="text-sm text-slate-500">{subscription.renewalDate}</p>
               </div>
             </div>

             {/* Plans Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {plans.map((plan) => (
                 <div 
                    key={plan.name} 
                    className={`relative bg-white rounded-2xl p-6 border transition-all duration-200 flex flex-col ${
                      subscription.tier === plan.tier 
                        ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                 >
                   {plan.popular && (
                     <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                       {t('settings.billing.popular')}
                     </div>
                   )}
                   
                   <div className="mb-4">
                     <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                     <div className="flex items-baseline mt-2">
                       <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                       <span className="text-slate-500 ms-1">{plan.period}</span>
                     </div>
                     <p className="text-sm text-slate-500 mt-3 h-10">{plan.description}</p>
                   </div>

                   <div className="flex-1 space-y-3 mb-6">
                     {plan.features.map((feature, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                         <Check size={16} className="text-emerald-500 flex-shrink-0" />
                         <span>{feature}</span>
                       </div>
                     ))}
                   </div>

                   <button 
                     onClick={() => handleUpgrade(plan.tier)}
                     disabled={subscription.tier === plan.tier}
                     className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                       subscription.tier === plan.tier
                         ? 'bg-slate-100 text-slate-400 cursor-default'
                         : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                     }`}
                   >
                     {subscription.tier === plan.tier ? t('settings.billing.current') : t('settings.billing.select')}
                   </button>
                 </div>
               ))}
             </div>
           </div>
         )}

         {activeTab === 'notifications' && (
           <div className="p-8 max-w-3xl">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('settings.notifications.title')}</h2>
             <div className="space-y-6">
               
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{t('settings.notifications.email_alerts')}</h4>
                      <p className="text-sm text-slate-500">{t('settings.notifications.email_desc')}</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                 </label>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{t('settings.notifications.browser_push')}</h4>
                      <p className="text-sm text-slate-500">{t('settings.notifications.browser_desc')}</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.browserPush} onChange={() => setNotifications({...notifications, browserPush: !notifications.browserPush})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                 </label>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{t('settings.notifications.weekly_reports')}</h4>
                      <p className="text-sm text-slate-500">{t('settings.notifications.weekly_desc')}</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.weeklyReport} onChange={() => setNotifications({...notifications, weeklyReport: !notifications.weeklyReport})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                 </label>
               </div>

               <div className="pt-6 border-t border-slate-100">
                 <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
                   <Save size={18} />
                   {t('settings.notifications.save')}
                 </button>
               </div>
             </div>
           </div>
         )}

         {activeTab === 'team' && (
           <div className="p-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{t('settings.team.title')}</h2>
                <button 
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  <UserPlus size={18} />
                  {t('settings.team.add_member')}
                </button>
             </div>
             
             <div className="border border-slate-200 rounded-lg overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('settings.team.table_name')}</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('settings.team.table_role')}</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('settings.team.table_email')}</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('settings.team.table_status')}</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('settings.team.table_actions')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {teamMembers.map(member => (
                     <tr key={member.id} className="hover:bg-slate-50">
                       <td className="p-4 font-medium text-slate-800">{member.name}</td>
                       <td className="p-4 text-slate-600">{member.role}</td>
                       <td className="p-4 text-slate-500 text-sm">{member.email}</td>
                       <td className="p-4">
                         <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                           {member.status}
                         </span>
                       </td>
                       <td className="p-4 text-right">
                         <button 
                            onClick={() => handleDeleteUser(member.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {activeTab === 'security' && (
           <div className="p-8 max-w-3xl">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('settings.security.title')}</h2>
             
             <div className="space-y-8">
                <div>
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Shield size={20} className="text-indigo-600" />
                     {t('settings.security.change_password')}
                   </h3>
                   <div className="grid gap-4 p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.security.current_password')}</label>
                        <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.security.new_password')}</label>
                            <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.security.confirm_password')}</label>
                            <input type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                      </div>
                      <div className="pt-2">
                         <button onClick={handleSave} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-100">{t('settings.security.update_password')}</button>
                      </div>
                   </div>
                </div>

                <div>
                   <h3 className="font-bold text-slate-800 mb-4">{t('settings.security.two_factor')}</h3>
                   <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                      <div>
                         <p className="font-medium text-slate-800">{t('settings.security.enable_2fa')}</p>
                         <p className="text-sm text-slate-500">{t('settings.security.two_factor_desc')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                   </div>
                </div>
             </div>
           </div>
         )}
      </div>

      {/* Add Team Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{t('settings.team.modal_title')}</h3>
                    <button onClick={() => setIsAddMemberModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleAddMember} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.team.table_name')}</label>
                        <input 
                          required 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="John Doe"
                          value={newMember.name}
                          onChange={e => setNewMember({...newMember, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.team.table_email')}</label>
                        <input 
                          required 
                          type="email" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="john@company.com"
                          value={newMember.email}
                          onChange={e => setNewMember({...newMember, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings.team.table_role')}</label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={newMember.role}
                          onChange={e => setNewMember({...newMember, role: e.target.value})}
                        >
                            <option value="Administrator">Administrator</option>
                            <option value="Manager">Manager</option>
                            <option value="Sales Rep">Sales Rep</option>
                            <option value="Employee">Employee</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 mt-2">
                        {t('settings.team.add_member')}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
