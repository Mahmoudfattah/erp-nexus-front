import React, { useState, useRef, useEffect } from 'react';
import { Company, SubscriptionTier, User } from '../types';
import { Building2, Users, DollarSign, Plus, Search, ShieldCheck, LogOut, CheckCircle, XCircle, CreditCard, MoreHorizontal, TrendingUp, Activity, Eye, Power, Trash2 } from 'lucide-react';

interface OwnerAdminViewProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  onLogout: () => void;
  currentUser: User;
}

const OwnerAdminView: React.FC<OwnerAdminViewProps> = ({ companies, setCompanies, onLogout, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'subscriptions'>('companies');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // New Company Form State
  const [newCompany, setNewCompany] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    plan: 'Pro' as SubscriptionTier
  });

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Calculation
  const totalRevenue = companies.reduce((sum, c) => {
    const price = c.subscription.tier === 'Enterprise' ? 199 : c.subscription.tier === 'Pro' ? 49 : 0;
    return sum + price;
  }, 0);
  
  const activeSubs = companies.filter(c => c.subscription.status === 'Active').length;

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const company: Company = {
      id: `COMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newCompany.name,
      adminName: newCompany.adminName,
      adminEmail: newCompany.adminEmail,
      joinedDate: new Date().toISOString().split('T')[0],
      usersCount: 1, // Starts with 1 admin
      subscription: {
        tier: newCompany.plan,
        status: 'Active',
        renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      }
    };

    setCompanies([company, ...companies]);
    setIsModalOpen(false);
    setNewCompany({ name: '', adminName: '', adminEmail: '', plan: 'Pro' });
  };

  const toggleCompanyStatus = (id: string) => {
    setCompanies(companies.map(c => {
      if (c.id === id) {
        const newStatus = c.subscription.status === 'Active' ? 'Cancelled' : 'Active';
        return { ...c, subscription: { ...c.subscription, status: newStatus } };
      }
      return c;
    }));
    setActiveActionId(null);
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company account? This action cannot be undone.')) {
      setCompanies(companies.filter(c => c.id !== id));
    }
    setActiveActionId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Owner Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Nexus Admin Console</h1>
              <p className="text-xs text-slate-400">Platform Owner: {currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('companies')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'companies' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Companies
              </button>
              <button 
                onClick={() => setActiveTab('subscriptions')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'subscriptions' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Subscriptions
              </button>
            </nav>
            <div className="h-6 w-px bg-slate-700"></div>
            <button 
              onClick={onLogout}
              className="text-sm text-slate-300 hover:text-white flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Companies</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{companies.length}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Monthly Revenue (MRR)</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">${totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
            </div>
          </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeSubs}</h3>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Enterprise Clients</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {companies.filter(c => c.subscription.tier === 'Enterprise').length}
                </h3>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden pb-24"> {/* Added pb-24 for dropdown space */}
           <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800">
                {activeTab === 'companies' ? 'Company Accounts' : 'Subscription Monitoring'}
             </h2>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search companies..." 
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'companies' && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        New Account
                    </button>
                )}
             </div>
           </div>

           <div className="overflow-visible"> {/* changed from overflow-x-auto to allow dropdowns */}
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Admin User</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Users</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredCompanies.map(company => (
                      <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                         <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                  <Building2 size={20} />
                               </div>
                               <div>
                                  <p className="font-medium text-slate-900">{company.name}</p>
                                  <p className="text-xs text-slate-500">ID: {company.id}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-4">
                            <p className="text-sm text-slate-900 font-medium">{company.adminName}</p>
                            <p className="text-xs text-slate-500">{company.adminEmail}</p>
                         </td>
                         <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                company.subscription.tier === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                company.subscription.tier === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {company.subscription.tier}
                            </span>
                         </td>
                         <td className="p-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                               <Users size={14} />
                               {company.usersCount}
                            </div>
                         </td>
                         <td className="p-4 text-sm text-slate-600">{company.joinedDate}</td>
                         <td className="p-4">
                             <div className="flex items-center gap-2">
                                 {company.subscription.status === 'Active' 
                                    ? <CheckCircle size={16} className="text-emerald-500" /> 
                                    : <XCircle size={16} className="text-red-500" />
                                 }
                                 <span className={`text-sm font-medium ${company.subscription.status === 'Active' ? 'text-emerald-700' : 'text-red-700'}`}>
                                     {company.subscription.status}
                                 </span>
                             </div>
                         </td>
                         <td className="p-4 text-right relative">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionId(activeActionId === company.id ? null : company.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${activeActionId === company.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                             >
                                 <MoreHorizontal size={18} />
                             </button>
                             
                             {/* Dropdown Menu */}
                             {activeActionId === company.id && (
                                 <div 
                                    ref={actionMenuRef}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-200 origin-top-right"
                                 >
                                     <div className="p-1">
                                         <button 
                                            onClick={() => setActiveActionId(null)}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2"
                                         >
                                             <Eye size={16} /> View Details
                                         </button>
                                         <button 
                                            onClick={() => toggleCompanyStatus(company.id)}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600 rounded-lg flex items-center gap-2"
                                         >
                                             <Power size={16} /> 
                                             {company.subscription.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                         </button>
                                         <div className="my-1 border-t border-slate-100"></div>
                                         <button 
                                            onClick={() => handleDeleteCompany(company.id)}
                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2"
                                         >
                                             <Trash2 size={16} /> Delete Account
                                         </button>
                                     </div>
                                 </div>
                             )}
                         </td>
                      </tr>
                   ))}
                   {filteredCompanies.length === 0 && (
                       <tr>
                           <td colSpan={7} className="p-8 text-center text-slate-500">No companies found matching your criteria.</td>
                       </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      </main>

      {/* Add Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={20} className="text-indigo-600" />
                        Create Company Account
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <XCircle size={20} />
                    </button>
                </div>
                <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg" 
                            placeholder="e.g. Acme Corp"
                            value={newCompany.name}
                            onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg" 
                            placeholder="e.g. Jane Doe"
                            value={newCompany.adminName}
                            onChange={e => setNewCompany({...newCompany, adminName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                        <input 
                            required 
                            type="email" 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg" 
                            placeholder="admin@acme.com"
                            value={newCompany.adminEmail}
                            onChange={e => setNewCompany({...newCompany, adminEmail: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                            value={newCompany.plan}
                            onChange={e => setNewCompany({...newCompany, plan: e.target.value as SubscriptionTier})}
                        >
                            <option value="Free">Free</option>
                            <option value="Pro">Pro</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm mt-2">
                        Provision Account
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAdminView;