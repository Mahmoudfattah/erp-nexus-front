import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Invoice, Installment } from '../types';
import {
  Search, Filter, Mail, Plus, X, UserPlus, CheckSquare, Square, Trash2, CheckCircle,
  XCircle, Send, Pencil, Phone, ArrowUpDown, DollarSign, Calendar, CreditCard, Loader
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { crmService } from '../api/crmService';

interface CRMViewProps {
  customers?: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  invoices?: Invoice[];
  user: User | null;
}

const CRMView: React.FC<CRMViewProps> = ({
  customers: propCustomers = [],
  setCustomers: setPropCustomers,
  invoices = [],
  user
}) => {
  const { t } = useLanguage();

  // API State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSaving = isCreating || isUpdating;

  // Local state for UI + sync from API
  const [customers, setCustomers] = useState<Customer[]>(propCustomers);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await crmService.getCustomers();
        setCustomers(data);
        if (setPropCustomers) setPropCustomers(data);
      } catch (err: any) {
        console.error('Failed to fetch customers:', err);
        setError(err.message || 'Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [setPropCustomers]);

   // =========== dynimac full company id ======

 const getUserId = (user: User | null): string => {
  if (!user) return '';
  
  // If role is an object with name property (from API)
  if (user.companyId ) {
    return  Number(user.companyId);
  }
  

};

 const companyId = getUserId(user) 

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    notes: '',
    company_id: companyId,
    status: 'lead',
    revenue: 0,
  });

  // Financial History State
  const [viewingFinancialsCustomer, setViewingFinancialsCustomer] = useState<Customer | null>(null);

  // Bulk loading
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = useMemo(() => {
    const arr = [...customers];
    if (!sortConfig) return arr;

    return arr.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Basic compare for string/number
      if (aValue < (bValue as any)) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > (bValue as any)) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortConfig]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedCustomers;

    return sortedCustomers.filter((c) =>
      (c.name || '').toLowerCase().includes(term) ||
      (c.company || '').toLowerCase().includes(term)
    );
  }, [sortedCustomers, searchTerm]);

  const handleSelectAll = () => {
    if (filteredCustomers.length === 0) return;

    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openEditModal = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      website: customer.website || '',
      industry: customer.industry || '',
      notes: customer.notes || '',
      status: customer.status,
      revenue: customer.revenue,
      company_id: companyId, // keep for display if you want, but won't be sent on update
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      company: '',
      company_id: companyId,
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
      notes: '',
      status: 'lead',
      revenue: 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    setIsDeleting(true);
    try {
      await crmService.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      if (setPropCustomers) {
        setPropCustomers((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ shared fields only (NO company_id here)
    const basePayload: Partial<Customer> = {
      name: formData.name || '',
      company: formData.company || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      website: formData.website || '',
      industry: formData.industry || '',
      notes: formData.notes || '',
      status: (formData.status as any) || 'lead',
      revenue: Number(formData.revenue) || 0,
    };

    if (editingId) setIsUpdating(true);
    else setIsCreating(true);

    try {
      if (editingId) {
        // ✅ UPDATE: do NOT send company_id
        const updated = await crmService.updateCustomer(editingId, basePayload);

        setCustomers((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        if (setPropCustomers) {
          setPropCustomers((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        }
      } else {
        // ✅ CREATE: send company_id
        const createPayload: Partial<Customer> = {
          ...basePayload,
          company_id: companyId ,
        };

        const created = await crmService.createCustomer(createPayload);

        setCustomers((prev) => [...prev, created]);
        if (setPropCustomers) {
          setPropCustomers((prev) => [...prev, created]);
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        industry: '',
        notes: '',
        company_id: companyId,
        status: 'lead',
        revenue: 0,
      });
    } catch (err: any) {
      console.error(err);
      alert('Failed to save customer');
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
    }
  };

  const handleBulkAction = async (action: 'active' | 'inactive' | 'Delete' | 'Email') => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'Email') {
        alert(`Sending mass email to ${selectedIds.length} recipients...`);
        setSelectedIds([]);
        return;
      }

      setIsBulkLoading(true);

      if (action === 'Delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) {
          setIsBulkLoading(false);
          return;
        }
        await Promise.all(selectedIds.map((id) => crmService.deleteCustomer(id)));
        setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        if (setPropCustomers) {
          setPropCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        }
        setSelectedIds([]);
        return;
      }

      // Status update
      const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));
      const updatePromises = selectedCustomers.map((c) =>
        crmService.updateCustomer(c.id, { status: action })
      );
      const updatedCustomers = await Promise.all(updatePromises);

      setCustomers((prev) =>
        prev.map((c) => {
          const updated = updatedCustomers.find((uc) => uc.id === c.id);
          return updated || c;
        })
      );

      if (setPropCustomers) {
        setPropCustomers((prev) =>
          prev.map((c) => {
            const updated = updatedCustomers.find((uc) => uc.id === c.id);
            return updated || c;
          })
        );
      }

      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      alert('Bulk action failed');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const getCustomerInstallments = (customerId: string) => {
    const customerInvoices = invoices.filter((inv) => inv.customerId === customerId);
    const allInstallments: Array<Installment & { invoiceId: string }> = [];

    customerInvoices.forEach((inv) => {
      if (inv.installments) {
        inv.installments.forEach((inst) => {
          allInstallments.push({ ...inst, invoiceId: inv.id });
        });
      }
    });

    return allInstallments.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  };

  const SortIcon = ({ column }: { column: keyof Customer }) => {
    if (sortConfig?.key === column) {
      return (
        <ArrowUpDown
          size={14}
          className={sortConfig.direction === 'asc' ? 'text-indigo-600 rotate-180' : 'text-indigo-600'}
        />
      );
    }
    return (
      <ArrowUpDown
        size={14}
        className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    );
  };

  const getStatusLabel = (status: string) => {
    if (status === 'lead') return t('crm.modal.status_lead');
    if (status === 'active') return t('crm.modal.status_active');
    if (status === 'inactive') return t('crm.modal.status_inactive');
    return status;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full relative">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">{t('crm.title')}</h2>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('crm.search_placeholder')}
              className="ps-10 pe-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">
            <Filter size={18} />
            {t('common.filter')}
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            {t('crm.add_customer')}
          </button>
        </div>
      </div>

      {/* Error / Loading top bar */}
      {(isLoading || error) && (
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 text-sm text-slate-600">
          {isLoading ? (
            <>
              <Loader className="animate-spin" size={16} />
              Loading customers...
            </>
          ) : (
            <span className="text-red-600">Failed to load customers</span>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4 text-sm font-medium text-indigo-900">
            <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-xs">
              {selectedIds.length} {t('crm.selected')}
            </span>
            {(isBulkLoading || isDeleting) && (
              <span className="text-xs text-indigo-700 flex items-center gap-2">
                <Loader className="animate-spin" size={14} /> Processing...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction('active')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircle size={14} />
              {t('crm.mark_active')}
            </button>

            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction('inactive')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <XCircle size={14} />
              {t('crm.mark_inactive')}
            </button>

            <div className="w-px h-4 bg-indigo-200 mx-1"></div>

            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction('Email')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {t('crm.mass_email')}
            </button>

            <button
              disabled={isBulkLoading || isDeleting}
              onClick={() => handleBulkAction('Delete')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {t('crm.delete')}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr className="border-b border-slate-100">
              <th className="p-4 w-12">
                <button
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {selectedIds.length > 0 && selectedIds.length === filteredCustomers.length ? (
                    <CheckSquare size={20} className="text-indigo-600" />
                  ) : (
                    <Square size={20} />
                  )}
                </button>
              </th>

              <th
                className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  {t('crm.table.customer')} <SortIcon column="name" />
                </div>
              </th>

              <th
                className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  {t('crm.table.status')} <SortIcon column="status" />
                </div>
              </th>

              <th
                className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center gap-1">
                  {t('crm.table.revenue')} <SortIcon column="revenue" />
                </div>
              </th>

              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('crm.table.installments')}
              </th>

              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('crm.table.contact')}
              </th>

              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                {t('crm.table.actions')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => {
              const customerInstallments = getCustomerInstallments(customer.id);
              const pendingCount = customerInstallments.filter((i) => i.status !== 'Paid').length;
              const hasInstallments = customerInstallments.length > 0;

              return (
                <tr
                  key={customer.id}
                  className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(customer.id) ? 'bg-indigo-50/50' : ''
                    }`}
                >
                  <td className="p-4">
                    <button
                      onClick={() => handleSelectOne(customer.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors block"
                    >
                      {selectedIds.includes(customer.id) ? (
                        <CheckSquare size={20} className="text-indigo-600" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {(customer.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.company}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : customer.status === 'lead'
                          ? 'bg-blue-100 text-blue-700'
                          : customer.status === 'inactive'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {getStatusLabel(customer.status)}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700 font-medium">
                    ${Number(customer.revenue || 0).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {hasInstallments ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-700 font-medium">
                          {customerInstallments.length} {t('crm.table.installments')}
                        </span>

                        {pendingCount > 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                            {pendingCount} Pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                            All Paid
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic"> _</span>
                    )}
                  </td>

                  <td className="p-4 text-slate-500 text-sm">
                    <div className="flex flex-col gap-1">
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={12} /> {customer.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Mail size={12} /> {customer.email}
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingFinancialsCustomer(customer)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title={t('crm.financial_history.title')}
                      >
                        <DollarSign size={16} />
                      </button>

                      <a
                        href={`mailto:${customer.email}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail size={16} />
                      </a>

                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteOne(customer.id)}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && !isLoading && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <UserPlus size={24} />
            </div>
            <p>{t('crm.no_results')}</p>
          </div>
        )}
      </div>

      {/* Financial History Modal */}
      {viewingFinancialsCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('crm.financial_history.title')}</h3>
                <p className="text-sm text-slate-500">
                  {viewingFinancialsCustomer.name} ({viewingFinancialsCustomer.company})
                </p>
              </div>
              <button onClick={() => setViewingFinancialsCustomer(null)}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
              {/* Summary Cards */}
              {(() => {
                const installments = getCustomerInstallments(viewingFinancialsCustomer.id);
                const totalInstallments = installments.reduce((acc, i) => acc + i.amount, 0);
                const paidInstallments = installments
                  .filter((i) => i.status === 'Paid')
                  .reduce((acc, i) => acc + i.amount, 0);
                const pendingInstallments = totalInstallments - paidInstallments;

                return (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        {t('crm.financial_history.total_installment_value')}
                      </p>
                      <p className="text-lg font-bold text-slate-800 mt-1">
                        ${totalInstallments.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        {t('crm.financial_history.amount_paid')}
                      </p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        ${paidInstallments.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        {t('crm.financial_history.amount_pending')}
                      </p>
                      <p className="text-lg font-bold text-amber-600 mt-1">
                        ${pendingInstallments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-600" />
                    {t('crm.financial_history.installment_schedule')}
                  </h4>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.invoice_num')}</th>
                      <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.due_date')}</th>
                      <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.amount')}</th>
                      <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.status')}</th>
                      <th className="p-3 font-semibold text-slate-600 text-right">{t('crm.financial_history.payment_date')}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const installments = getCustomerInstallments(viewingFinancialsCustomer.id);
                      if (installments.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              {t('crm.financial_history.no_installments')}
                            </td>
                          </tr>
                        );
                      }

                      return installments.map((inst, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-indigo-600">{inst.invoiceId}</td>

                          <td className="p-3 text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {inst.dueDate}
                            </div>
                          </td>

                          <td className="p-3 font-medium text-slate-800">
                            ${inst.amount.toLocaleString()}
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium border ${inst.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inst.status === 'Overdue'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              {inst.status}
                            </span>
                          </td>

                          <td className="p-3 text-right text-slate-500">
                            {inst.paymentDate ? inst.paymentDate : '-'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setViewingFinancialsCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium"
              >
                {t('crm.financial_history.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? t('crm.modal.edit_title') : t('crm.modal.add_title')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <UserPlus size={16} className="text-indigo-600" /> {t('crm.modal.basic_info')}
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.full_name')}</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Jane Doe"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.company')}</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Acme Corp"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.email')}</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="jane@example.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.phone')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="01xxxxxxxx"
                    pattern="^01[0125][0-9]{8}$"
                    maxLength={11}
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: value });
                    }}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    {t('crm.modal.business_details')}
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.industry')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Technology"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.website')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="www.example.com"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block hidden text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.company_id')}</label>
                  <input
                    type="text"
                    className="w-full hidden px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. 1"
                    defaultValue={companyId}
                  
                    disabled={!!editingId} // ✅ optional UX: prevent editing on update
                  />
                </div>

              

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.address')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="123 Business Rd, City, State"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    {t('crm.modal.system_status')}
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.annual_revenue')}</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="0.00"
                    value={Number(formData.revenue || 0)}
                    onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.status')}</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none bg-white"
                    value={(formData.status as any) || 'lead'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="lead">{t('crm.modal.status_lead')}</option>
                    <option value="active">{t('crm.modal.status_active')}</option>
                    <option value="inactive">{t('crm.modal.status_inactive')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.notes')}</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder={t('crm.modal.notes_placeholder')}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200 transition-all hover:shadow-indigo-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader className="animate-spin" size={16} />}
                  {editingId ? t('crm.modal.save_changes') : t('crm.modal.add_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;




// /*
// import React, { useState, useEffect, useMemo } from 'react';
// import { Customer, Invoice, Installment } from '../types';
// import {
//   Search, Filter, Mail, Plus, X, UserPlus, CheckSquare, Square, Trash2, CheckCircle,
//   XCircle, Send, Pencil, Phone, ArrowUpDown, DollarSign, Calendar, CreditCard, Loader
// } from 'lucide-react';
// import { useLanguage } from './LanguageContext';
// import {
//   useGetCustomersQuery,
//   useCreateCustomerMutation,
//   useUpdateCustomerMutation,
//   useDeleteCustomerMutation
// } from '../services/salesApi';

// interface CRMViewProps {
//   customers?: Customer[];
//   setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
//   invoices?: Invoice[];
// }

// const CRMView: React.FC<CRMViewProps> = ({
//   customers: propCustomers = [],
//   setCustomers: setPropCustomers,
//   invoices = [],
// }) => {
//   const { t } = useLanguage();

//   // API Hooks
//   const { data: customersData, isLoading, error, refetch } = useGetCustomersQuery();

//   const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
//   const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
//   const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

//   const isSaving = isCreating || isUpdating;

//   // Local state for UI + sync from API
//   const [customers, setCustomers] = useState<Customer[]>(propCustomers);

//   useEffect(() => {
//     if (customersData?.data) {
//       setCustomers(customersData.data);
//       if (setPropCustomers) setPropCustomers(customersData.data);
//     }
//   }, [customersData, setPropCustomers]);

//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);

//   // Modal & Form State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [formData, setFormData] = useState<Partial<Customer>>({
//     name: '',
//     company: '',
//     email: '',
//     phone: '',
//     address: '',
//     website: '',
//     industry: '',
//     notes: '',
//     status: 'Lead',
//     revenue: 0,
//   });

//   // Financial History State
//   const [viewingFinancialsCustomer, setViewingFinancialsCustomer] = useState<Customer | null>(null);

//   // Bulk loading
//   const [isBulkLoading, setIsBulkLoading] = useState(false);

//   const handleSort = (key: keyof Customer) => {
//     let direction: 'asc' | 'desc' = 'asc';
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }
//     setSortConfig({ key, direction });
//   };

//   const sortedCustomers = useMemo(() => {
//     const arr = [...customers];
//     if (!sortConfig) return arr;

//     return arr.sort((a, b) => {
//       const aValue = a[sortConfig.key];
//       const bValue = b[sortConfig.key];

//       if (aValue === undefined && bValue === undefined) return 0;
//       if (aValue === undefined) return 1;
//       if (bValue === undefined) return -1;

//       // Basic compare for string/number
//       if (aValue < (bValue as any)) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (aValue > (bValue as any)) return sortConfig.direction === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [customers, sortConfig]);

//   const filteredCustomers = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) return sortedCustomers;

//     return sortedCustomers.filter((c) =>
//       (c.name || '').toLowerCase().includes(term) ||
//       (c.company || '').toLowerCase().includes(term)
//     );
//   }, [sortedCustomers, searchTerm]);

//   const handleSelectAll = () => {
//     if (filteredCustomers.length === 0) return;

//     if (selectedIds.length === filteredCustomers.length) {
//       setSelectedIds([]);
//     } else {
//       setSelectedIds(filteredCustomers.map((c) => c.id));
//     }
//   };

//   const handleSelectOne = (id: string) => {
//     setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
//   };

//   const openEditModal = (customer: Customer) => {
//     setEditingId(customer.id);
//     setFormData({
//       name: customer.name,
//       company: customer.company,
//       email: customer.email,
//       phone: customer.phone || '',
//       address: customer.address || '',
//       website: customer.website || '',
//       industry: customer.industry || '',
//       notes: customer.notes || '',
//       status: customer.status,
//       revenue: customer.revenue,
//     });
//     setIsModalOpen(true);
//   };

//   const openCreateModal = () => {
//     setEditingId(null);
//     setFormData({
//       name: '',
//       company: '',
//       email: '',
//       phone: '',
//       address: '',
//       website: '',
//       industry: '',
//       notes: '',
//       status: 'Lead',
//       revenue: 0,
//     });
//     setIsModalOpen(true);
//   };

//   const handleDeleteOne = async (id: string) => {
//     if (!window.confirm('Are you sure you want to delete this customer?')) return;

//     try {
//       await deleteCustomer(id);
//       setSelectedIds((prev) => prev.filter((x) => x !== id));
//       await refetch();
//     } catch (err) {
//       console.error(err);
//       alert('Failed to delete customer');
//     }
//   };

//   const handleSaveCustomer = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // payload (match your backend fields)
//     const payload: Partial<Customer> = {
//       name: formData.name || '',
//       company: formData.company || '',
//       email: formData.email || '',
//       phone: formData.phone || '',
//       address: formData.address || '',
//       website: formData.website || '',
//       industry: formData.industry || '',
//       notes: formData.notes || '',
//       status: (formData.status as any) || 'Lead',
//       revenue: Number(formData.revenue) || 0,
//     };

//     try {
//       if (editingId) {
//         await updateCustomer(editingId, payload);
//       } else {
//         await createCustomer(payload);
//       }

//       setIsModalOpen(false);
//       setEditingId(null);
//       setFormData({
//         name: '',
//         company: '',
//         email: '',
//         phone: '',
//         address: '',
//         website: '',
//         industry: '',
//         notes: '',
//         status: 'Lead',
//         revenue: 0,
//       });

//       await refetch();
//     } catch (err) {
//       console.error(err);
//       alert('Failed to save customer');
//     }
//   };

//   const handleBulkAction = async (action: 'Active' | 'Inactive' | 'Delete' | 'Email') => {
//     if (selectedIds.length === 0) return;

//     try {
//       if (action === 'Email') {
//         alert(`Sending mass email to ${selectedIds.length} recipients...`);
//         setSelectedIds([]);
//         return;
//       }

//       setIsBulkLoading(true);

//       if (action === 'Delete') {
//         if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) return;
//         await Promise.all(selectedIds.map((id) => deleteCustomer(id)));
//         setSelectedIds([]);
//         await refetch();
//         return;
//       }

//       // Status update
//       const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));
//       await Promise.all(selectedCustomers.map((c) => updateCustomer(c.id, { status: action })));
//       setSelectedIds([]);
//       await refetch();
//     } catch (err) {
//       console.error(err);
//       alert('Bulk action failed');
//     } finally {
//       setIsBulkLoading(false);
//     }
//   };

//   const getCustomerInstallments = (customerId: string) => {
//     const customerInvoices = invoices.filter((inv) => inv.customerId === customerId);
//     const allInstallments: Array<Installment & { invoiceId: string }> = [];

//     customerInvoices.forEach((inv) => {
//       if (inv.installments) {
//         inv.installments.forEach((inst) => {
//           allInstallments.push({ ...inst, invoiceId: inv.id });
//         });
//       }
//     });

//     return allInstallments.sort(
//       (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
//     );
//   };

//   const SortIcon = ({ column }: { column: keyof Customer }) => {
//     if (sortConfig?.key === column) {
//       return (
//         <ArrowUpDown
//           size={14}
//           className={sortConfig.direction === 'asc' ? 'text-indigo-600 rotate-180' : 'text-indigo-600'}
//         />
//       );
//     }
//     return (
//       <ArrowUpDown
//         size={14}
//         className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
//       />
//     );
//   };

//   const getStatusLabel = (status: string) => {
//     if (status === 'Lead') return t('crm.modal.status_lead');
//     if (status === 'Active') return t('crm.modal.status_active');
//     if (status === 'Inactive') return t('crm.modal.status_inactive');
//     return status;
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full relative">
//       <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <h2 className="text-xl font-bold text-slate-800">{t('crm.title')}</h2>

//         <div className="flex gap-2">
//           <div className="relative">
//             <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
//             <input
//               type="text"
//               placeholder={t('crm.search_placeholder')}
//               className="ps-10 pe-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">
//             <Filter size={18} />
//             {t('common.filter')}
//           </button>

//           <button
//             onClick={openCreateModal}
//             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm shadow-indigo-200"
//           >
//             <Plus size={18} />
//             {t('crm.add_customer')}
//           </button>
//         </div>
//       </div>

//       {/* Error / Loading top bar */}
//       {(isLoading || error) && (
//         <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 text-sm text-slate-600">
//           {isLoading ? (
//             <>
//               <Loader className="animate-spin" size={16} />
//               Loading customers...
//             </>
//           ) : (
//             <span className="text-red-600">Failed to load customers</span>
//           )}
//         </div>
//       )}

//       {/* Bulk Actions Bar */}
//       {selectedIds.length > 0 && (
//         <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2">
//           <div className="flex items-center gap-4 text-sm font-medium text-indigo-900">
//             <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-xs">
//               {selectedIds.length} {t('crm.selected')}
//             </span>
//             {(isBulkLoading || isDeleting) && (
//               <span className="text-xs text-indigo-700 flex items-center gap-2">
//                 <Loader className="animate-spin" size={14} /> Processing...
//               </span>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               disabled={isBulkLoading}
//               onClick={() => handleBulkAction('Active')}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 text-xs font-semibold transition-colors disabled:opacity-50"
//             >
//               <CheckCircle size={14} />
//               {t('crm.mark_active')}
//             </button>

//             <button
//               disabled={isBulkLoading}
//               onClick={() => handleBulkAction('Inactive')}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50"
//             >
//               <XCircle size={14} />
//               {t('crm.mark_inactive')}
//             </button>

//             <div className="w-px h-4 bg-indigo-200 mx-1"></div>

//             <button
//               disabled={isBulkLoading}
//               onClick={() => handleBulkAction('Email')}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 text-xs font-semibold transition-colors disabled:opacity-50"
//             >
//               <Send size={14} />
//               {t('crm.mass_email')}
//             </button>

//             <button
//               disabled={isBulkLoading || isDeleting}
//               onClick={() => handleBulkAction('Delete')}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
//             >
//               <Trash2 size={14} />
//               {t('crm.delete')}
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="overflow-x-auto custom-scrollbar flex-1">
//         <table className="w-full text-left border-collapse">
//           <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
//             <tr className="border-b border-slate-100">
//               <th className="p-4 w-12">
//                 <button
//                   onClick={handleSelectAll}
//                   className="text-slate-400 hover:text-indigo-600 transition-colors"
//                 >
//                   {selectedIds.length > 0 && selectedIds.length === filteredCustomers.length ? (
//                     <CheckSquare size={20} className="text-indigo-600" />
//                   ) : (
//                     <Square size={20} />
//                   )}
//                 </button>
//               </th>

//               <th
//                 className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
//                 onClick={() => handleSort('name')}
//               >
//                 <div className="flex items-center gap-1">
//                   {t('crm.table.customer')} <SortIcon column="name" />
//                 </div>
//               </th>

//               <th
//                 className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
//                 onClick={() => handleSort('status')}
//               >
//                 <div className="flex items-center gap-1">
//                   {t('crm.table.status')} <SortIcon column="status" />
//                 </div>
//               </th>

//               <th
//                 className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"
//                 onClick={() => handleSort('revenue')}
//               >
//                 <div className="flex items-center gap-1">
//                   {t('crm.table.revenue')} <SortIcon column="revenue" />
//                 </div>
//               </th>

//               <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
//                 {t('crm.table.installments')}
//               </th>

//               <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
//                 {t('crm.table.contact')}
//               </th>

//               <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
//                 {t('crm.table.actions')}
//               </th>
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-slate-100">
//             {filteredCustomers.map((customer) => {
//               const customerInstallments = getCustomerInstallments(customer.id);
//               const pendingCount = customerInstallments.filter((i) => i.status !== 'Paid').length;
//               const hasInstallments = customerInstallments.length > 0;

//               return (
//                 <tr
//                   key={customer.id}
//                   className={`hover:bg-slate-50 transition-colors ${
//                     selectedIds.includes(customer.id) ? 'bg-indigo-50/50' : ''
//                   }`}
//                 >
//                   <td className="p-4">
//                     <button
//                       onClick={() => handleSelectOne(customer.id)}
//                       className="text-slate-400 hover:text-indigo-600 transition-colors block"
//                     >
//                       {selectedIds.includes(customer.id) ? (
//                         <CheckSquare size={20} className="text-indigo-600" />
//                       ) : (
//                         <Square size={20} />
//                       )}
//                     </button>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
//                         {(customer.name || '?').charAt(0)}
//                       </div>
//                       <div>
//                         <p className="font-medium text-slate-800">{customer.name}</p>
//                         <p className="text-sm text-slate-500">{customer.company}</p>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         customer.status === 'Active'
//                           ? 'bg-green-100 text-green-700'
//                           : customer.status === 'Lead'
//                           ? 'bg-blue-100 text-blue-700'
//                           : 'bg-slate-100 text-slate-600'
//                       }`}
//                     >
//                       {getStatusLabel(customer.status)}
//                     </span>
//                   </td>

//                   <td className="p-4 text-slate-700 font-medium">
//                     ${Number(customer.revenue || 0).toLocaleString()}
//                   </td>

//                   <td className="p-4">
//                     {hasInstallments ? (
//                       <div className="flex flex-col gap-1">
//                         <span className="text-sm text-slate-700 font-medium">
//                           {customerInstallments.length} {t('crm.table.installments')}
//                         </span>

//                         {pendingCount > 0 ? (
//                           <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
//                             {pendingCount} Pending
//                           </span>
//                         ) : (
//                           <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
//                             All Paid
//                           </span>
//                         )}
//                       </div>
//                     ) : (
//                       <span className="text-slate-400 text-xs italic">-</span>
//                     )}
//                   </td>

//                   <td className="p-4 text-slate-500 text-sm">
//                     <div className="flex flex-col gap-1">
//                       {customer.phone && (
//                         <div className="flex items-center gap-1">
//                           <Phone size={12} /> {customer.phone}
//                         </div>
//                       )}
//                       <div className="flex items-center gap-1">
//                         <Mail size={12} /> {customer.email}
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-4 text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <button
//                         onClick={() => setViewingFinancialsCustomer(customer)}
//                         className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
//                         title={t('crm.financial_history.title')}
//                       >
//                         <DollarSign size={16} />
//                       </button>

//                       <a
//                         href={`mailto:${customer.email}`}
//                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title="Send Email"
//                       >
//                         <Mail size={16} />
//                       </a>

//                       <button
//                         onClick={() => openEditModal(customer)}
//                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                         title={t('common.edit')}
//                       >
//                         <Pencil size={16} />
//                       </button>

//                       <button
//                         onClick={() => handleDeleteOne(customer.id)}
//                         disabled={isDeleting}
//                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
//                         title={t('common.delete')}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredCustomers.length === 0 && !isLoading && (
//           <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
//             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
//               <UserPlus size={24} />
//             </div>
//             <p>{t('crm.no_results')}</p>
//           </div>
//         )}
//       </div>

//       {/* Financial History Modal */}
//       {viewingFinancialsCustomer && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
//             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
//               <div>
//                 <h3 className="font-bold text-slate-800 text-lg">{t('crm.financial_history.title')}</h3>
//                 <p className="text-sm text-slate-500">
//                   {viewingFinancialsCustomer.name} ({viewingFinancialsCustomer.company})
//                 </p>
//               </div>
//               <button onClick={() => setViewingFinancialsCustomer(null)}>
//                 <X size={20} className="text-slate-400 hover:text-slate-600" />
//               </button>
//             </div>

//             <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
//               {/* Summary Cards */}
//               {(() => {
//                 const installments = getCustomerInstallments(viewingFinancialsCustomer.id);
//                 const totalInstallments = installments.reduce((acc, i) => acc + i.amount, 0);
//                 const paidInstallments = installments
//                   .filter((i) => i.status === 'Paid')
//                   .reduce((acc, i) => acc + i.amount, 0);
//                 const pendingInstallments = totalInstallments - paidInstallments;

//                 return (
//                   <div className="grid grid-cols-3 gap-4 mb-6">
//                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//                       <p className="text-xs font-semibold text-slate-500 uppercase">
//                         {t('crm.financial_history.total_installment_value')}
//                       </p>
//                       <p className="text-lg font-bold text-slate-800 mt-1">
//                         ${totalInstallments.toLocaleString()}
//                       </p>
//                     </div>

//                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//                       <p className="text-xs font-semibold text-slate-500 uppercase">
//                         {t('crm.financial_history.amount_paid')}
//                       </p>
//                       <p className="text-lg font-bold text-emerald-600 mt-1">
//                         ${paidInstallments.toLocaleString()}
//                       </p>
//                     </div>

//                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//                       <p className="text-xs font-semibold text-slate-500 uppercase">
//                         {t('crm.financial_history.amount_pending')}
//                       </p>
//                       <p className="text-lg font-bold text-amber-600 mt-1">
//                         ${pendingInstallments.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })()}

//               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
//                 <div className="p-4 border-b border-slate-100">
//                   <h4 className="font-bold text-slate-800 flex items-center gap-2">
//                     <CreditCard size={18} className="text-indigo-600" />
//                     {t('crm.financial_history.installment_schedule')}
//                   </h4>
//                 </div>

//                 <table className="w-full text-left text-sm">
//                   <thead className="bg-slate-50 border-b border-slate-100">
//                     <tr>
//                       <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.invoice_num')}</th>
//                       <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.due_date')}</th>
//                       <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.amount')}</th>
//                       <th className="p-3 font-semibold text-slate-600">{t('crm.financial_history.status')}</th>
//                       <th className="p-3 font-semibold text-slate-600 text-right">{t('crm.financial_history.payment_date')}</th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {(() => {
//                       const installments = getCustomerInstallments(viewingFinancialsCustomer.id);
//                       if (installments.length === 0) {
//                         return (
//                           <tr>
//                             <td colSpan={5} className="p-8 text-center text-slate-400">
//                               {t('crm.financial_history.no_installments')}
//                             </td>
//                           </tr>
//                         );
//                       }

//                       return installments.map((inst, idx) => (
//                         <tr key={idx} className="hover:bg-slate-50 transition-colors">
//                           <td className="p-3 font-mono text-indigo-600">{inst.invoiceId}</td>

//                           <td className="p-3 text-slate-600">
//                             <div className="flex items-center gap-2">
//                               <Calendar size={14} className="text-slate-400" />
//                               {inst.dueDate}
//                             </div>
//                           </td>

//                           <td className="p-3 font-medium text-slate-800">
//                             ${inst.amount.toLocaleString()}
//                           </td>

//                           <td className="p-3">
//                             <span
//                               className={`px-2 py-0.5 rounded text-xs font-medium border ${
//                                 inst.status === 'Paid'
//                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
//                                   : inst.status === 'Overdue'
//                                   ? 'bg-red-50 text-red-700 border-red-200'
//                                   : 'bg-amber-50 text-amber-700 border-amber-200'
//                               }`}
//                             >
//                               {inst.status}
//                             </span>
//                           </td>

//                           <td className="p-3 text-right text-slate-500">
//                             {inst.paymentDate ? inst.paymentDate : '-'}
//                           </td>
//                         </tr>
//                       ));
//                     })()}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
//               <button
//                 onClick={() => setViewingFinancialsCustomer(null)}
//                 className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium"
//               >
//                 {t('crm.financial_history.close')}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add/Edit Customer Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
//             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
//               <h3 className="text-lg font-bold text-slate-800">
//                 {editingId ? t('crm.modal.edit_title') : t('crm.modal.add_title')}
//               </h3>
//               <button
//                 onClick={() => setIsModalOpen(false)}
//                 className="text-slate-400 hover:text-slate-600 transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSaveCustomer} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 <div className="md:col-span-2">
//                   <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
//                     <UserPlus size={16} className="text-indigo-600" /> {t('crm.modal.basic_info')}
//                   </h4>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.full_name')}</label>
//                   <input
//                     required
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="e.g. Jane Doe"
//                     value={formData.name || ''}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.company')}</label>
//                   <input
//                     required
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="e.g. Acme Corp"
//                     value={formData.company || ''}
//                     onChange={(e) => setFormData({ ...formData, company: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.email')}</label>
//                   <input
//                     required
//                     type="email"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="jane@example.com"
//                     value={formData.email || ''}
//                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.phone')}</label>
//                   <input
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="(555) 123-4567"
//                     value={formData.phone || ''}
//                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                   />
//                 </div>

//                 <div className="md:col-span-2 mt-2">
//                   <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
//                     {t('crm.modal.business_details')}
//                   </h4>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.industry')}</label>
//                   <input
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="e.g. Technology"
//                     value={formData.industry || ''}
//                     onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.website')}</label>
//                   <input
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="www.example.com"
//                     value={formData.website || ''}
//                     onChange={(e) => setFormData({ ...formData, website: e.target.value })}
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.address')}</label>
//                   <input
//                     type="text"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="123 Business Rd, City, State"
//                     value={formData.address || ''}
//                     onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                   />
//                 </div>

//                 <div className="md:col-span-2 mt-2">
//                   <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
//                     {t('crm.modal.system_status')}
//                   </h4>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.annual_revenue')}</label>
//                   <input
//                     type="number"
//                     min="0"
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder="0.00"
//                     value={Number(formData.revenue || 0)}
//                     onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.status')}</label>
//                   <select
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none bg-white"
//                     value={(formData.status as any) || 'Lead'}
//                     onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
//                   >
//                     <option value="Lead">{t('crm.modal.status_lead')}</option>
//                     <option value="Active">{t('crm.modal.status_active')}</option>
//                     <option value="Inactive">{t('crm.modal.status_inactive')}</option>
//                   </select>
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('crm.modal.notes')}</label>
//                   <textarea
//                     rows={3}
//                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
//                     placeholder={t('crm.modal.notes_placeholder')}
//                     value={formData.notes || ''}
//                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//                   />
//                 </div>
//               </div>

//               <div className="pt-4 flex gap-3 border-t border-slate-100 mt-2">
//                 <button
//                   type="button"
//                   onClick={() => setIsModalOpen(false)}
//                   className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
//                 >
//                   {t('common.cancel')}
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={isSaving}
//                   className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200 transition-all hover:shadow-indigo-300 disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {isSaving && <Loader className="animate-spin" size={16} />}
//                   {editingId ? t('crm.modal.save_changes') : t('crm.modal.add_btn')}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CRMView;
  