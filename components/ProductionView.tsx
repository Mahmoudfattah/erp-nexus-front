import React, { useState, useMemo, useEffect } from 'react';
import { WorkOrder, Product, SalesOrder, User, MaterialAllocation, InvoiceItem } from '../types';
import {
  Hammer, Plus, Search, Hammer as HammerIcon, CheckCircle,
  Package, ShieldCheck, X, ArrowRight, List, Eye, Trash2,
  RefreshCcw, Pencil, ChevronDown
} from 'lucide-react';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import StatsCard from './StatsCard';
import { productionService } from '../api/productionService';
import { salesService } from '../api/salesService';

interface ProductionViewProps {
  workOrders: WorkOrder[];
  salesOrders: SalesOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  inventory: Product[];
  user: User;
}

// All valid statuses the backend accepts
const ALL_STATUSES: WorkOrder['status'][] = [
  'Draft', 'Allocating', 'Awaiting Approval', 'Approved', 'In Production', 'Completed'
];

const ProductionView: React.FC<ProductionViewProps> = ({
  workOrders: propWorkOrders = [],
  setWorkOrders: setPropWorkOrders,
  setSalesOrders: setPropSalesOrders,
  inventory,
  salesOrders: propSalesOrders,
  user
}) => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'all' | 'pending_allocation' | 'awaiting_approval' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal visibility
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ─── Data state ───────────────────────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(propWorkOrders);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(propSalesOrders);

  // ─── Edit WO form state ───────────────────────────────────────────────────
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    dueDate: '',
    priority: 'Normal' as 'Normal' | 'Urgent',
    items: [] as InvoiceItem[],
  });
  const [editItem, setEditItem] = useState({ productId: '', quantity: 1 });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ─── Status override state (inside detail modal) ──────────────────────────
  const [statusOverride, setStatusOverride] = useState<WorkOrder['status'] | ''>('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // ─── Inline status dropdown (table row) ───────────────────────────────────
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkOrders = async () => {
      setIsLoading(true);
      try {
        const data = await productionService.getWorkOrders();
        setWorkOrders(data);
        if (setPropWorkOrders) setPropWorkOrders(data);
      } catch (error: any) {
        console.error('Failed to fetch work orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkOrders();
  }, []);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const data = await salesService.getOrders();
        setSalesOrders(data);
        if (setPropSalesOrders) setPropSalesOrders(data);
      } catch (error: any) {
        console.error('Failed to fetch sales orders:', error);
      }
    };
    fetchSalesOrders();
  }, []);

  useEffect(() => {
    if (setPropWorkOrders) setPropWorkOrders(workOrders);
  }, [workOrders, setPropWorkOrders]);

  // ─── Create form state ────────────────────────────────────────────────────
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [manualFormData, setManualFormData] = useState({
    customerName: '',
    dueDate: defaultDueDate,
    priority: 'Normal' as 'Normal' | 'Urgent',
    items: [] as InvoiceItem[],
  });
  const [manualItem, setManualItem] = useState({ productId: '', quantity: 1 });

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => ({
    total: workOrders.length,
    pendingAllocation: workOrders.filter(w => w.status === 'Draft' || w.status === 'Allocating').length,
    awaitingApproval: workOrders.filter(w => w.status === 'Awaiting Approval').length,
    inProduction: workOrders.filter(w => w.status === 'In Production').length,
  }), [workOrders]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const matchesSearch =
        (wo.id ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.customerName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchesTab = true;
      if (activeTab === 'pending_allocation') matchesTab = wo.status === 'Draft' || wo.status === 'Allocating';
      if (activeTab === 'awaiting_approval') matchesTab = wo.status === 'Awaiting Approval';
      if (activeTab === 'active') matchesTab = wo.status === 'In Production';
      return matchesSearch && matchesTab;
    });
  }, [workOrders, searchTerm, activeTab]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getTranslatedStatus = (status?: string) => {
    const safe = status ?? 'Draft';
    const key = safe.toLowerCase().replace(/\s+/g, '_');
    return t(`production.status.${key}`) || safe;
  };

  /** Replace a WO in local state and keep open modals in sync */
  const patchWorkOrder = (updated: WorkOrder) => {
    setWorkOrders(prev => prev.map(w => w.id === updated.id ? updated : w));
    setSelectedWO(prev => prev?.id === updated.id ? updated : prev);
  };

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

  // Close the inline status dropdown when clicking outside
  useEffect(() => {
    if (!openStatusDropdown) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-status-dropdown]')) {
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openStatusDropdown]);

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openAllocationFromTable = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setIsAllocationModalOpen(true);
  };
  const openAllocationFromDetail = () => setIsAllocationModalOpen(true);
  const closeAllocationModal = () => setIsAllocationModalOpen(false);

  const closeDetailModal = () => {
    setSelectedWO(null);
    setIsAllocationModalOpen(false);
    setStatusOverride('');
  };

  /** Open the edit modal pre-filled with the WO's current data */
  const openEditModal = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setEditFormData({
      customerName: wo.customerName,
      dueDate: wo.dueDate,
      priority: wo.priority ?? 'Normal',
      items: wo.items.map(it => ({ ...it })),
    });
    setEditItem({ productId: '', quantity: 1 });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Add a product row in the edit form (new item — no DB id) */
  const handleAddEditItem = () => {
    const product = inventory.find(p => p.id === editItem.productId);
    if (!product) return;
    const newItem: InvoiceItem = {
      id: undefined as any, // no id → backend will INSERT
      productId: product.id,
      description: product.name,
      quantity: editItem.quantity,
      unitPrice: product.price,
      total: product.price * editItem.quantity,
    };
    setEditFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setEditItem({ productId: '', quantity: 1 });
  };

  /** Save edited WO — calls PUT /work_orders/:id */
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;
    if (!editFormData.customerName.trim() || editFormData.items.length === 0) {
      addNotification('error', 'Please provide a customer name and at least one item.');
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await productionService.updateWorkOrder(selectedWO.id, {
        customerName: editFormData.customerName,
        dueDate: editFormData.dueDate,
        priority: editFormData.priority,
        items: editFormData.items, // service mapper handles id presence/absence
      });
      patchWorkOrder(updated);
      closeEditModal();
      addNotification('success', `Work Order ${selectedWO.id} updated.`);
    } catch (err: any) {
      console.error('Failed to update work order:', err);
      addNotification('error', 'Failed to update work order.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  /** Force-set status — calls PATCH /work_orders/:id/status (x-www-form-urlencoded) */
  const handleStatusOverrideSave = async () => {
    if (!selectedWO || !statusOverride || statusOverride === selectedWO.status) return;
    setIsSavingStatus(true);
    try {
      const updated = await productionService.updateWOStatus(selectedWO.id, statusOverride);
      patchWorkOrder(updated);
      setStatusOverride('');
      addNotification('success', `Status updated to "${statusOverride}".`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      addNotification('error', 'Failed to update status.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  /** Inline table-row status change — same PATCH endpoint */
  const handleInlineStatusChange = async (woId: string, newStatus: WorkOrder['status']) => {
    setOpenStatusDropdown(null);
    setSavingStatusId(woId);
    try {
      const updated = await productionService.updateWOStatus(woId, newStatus);
      patchWorkOrder(updated);
      addNotification('success', `Status updated to "${newStatus}".`);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      addNotification('error', 'Failed to update status.');
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleConvertToWorkOrder = async (so: SalesOrder) => {
    const existing = workOrders.find(w => w.salesOrderId === so.id);
    if (existing) {
      addNotification('warning', `Work Order for ${so.id} already exists.`);
      return;
    }
    try {
      const newWO = await productionService.createWorkOrderFromSalesOrder({
        salesOrderId: so.id,
        dueDate: defaultDueDate,
        priority: 'Normal',
      });
      setWorkOrders(prev => [newWO, ...prev]);
      setIsConverterOpen(false);
      addNotification('success', `Sales Order ${so.id} converted to Work Order ${newWO.id}`);
    } catch (err: any) {
      addNotification('error', 'Failed to create work order');
    }
  };

  const handleAddManualItem = () => {
    const product = inventory.find(p => p.id === manualItem.productId);
    if (!product) return;
    setManualFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        description: product.name,
        quantity: manualItem.quantity,
        unitPrice: product.price,
        total: product.price * manualItem.quantity,
      }]
    }));
    setManualItem({ productId: '', quantity: 1 });
  };

  const handleCreateManualWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.customerName.trim() || manualFormData.items.length === 0) {
      addNotification('error', 'Please provide a customer name and at least one item.');
      return;
    }
    try {
      const newWO = await productionService.createWorkOrder({
        customerName: manualFormData.customerName,
        dueDate: manualFormData.dueDate,
        priority: manualFormData.priority,
        status: 'Draft',
        items: manualFormData.items.map(item => ({ ...item, id: undefined })),
        allocations: manualFormData.items.map(item => ({
          id: `AL-${Math.random().toString(36).substr(2, 5)}`,
          productId: item.productId || '',
          productName: item.description,
          sku: inventory.find(p => p.id === item.productId)?.sku || 'N/A',
          quantityRequired: item.quantity,
          quantityAllocated: 0,
          status: 'Pending',
        })),
      });
      setWorkOrders(prev => [newWO, ...prev]);
      setIsManualModalOpen(false);
      setManualFormData({ customerName: '', dueDate: defaultDueDate, priority: 'Normal', items: [] });
      addNotification('success', `Manual Work Order ${newWO.id} created.`);
    } catch (err: any) {
      addNotification('error', 'Failed to create work order');
    }
  };

  const handleAllocateMaterial = async (woId: string, allocationId: string, qty: number) => {
    try {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) return;
      const updatedAllocations: MaterialAllocation[] = wo.allocations.map(al => {
        if (al.id === allocationId) {
          const newAllocated = Math.min(al.quantityRequired, qty);
          return { ...al, quantityAllocated: newAllocated, status: newAllocated >= al.quantityRequired ? 'Full' : 'Partially Allocated' } as MaterialAllocation;
        }
        return al;
      });
      const allFull = updatedAllocations.every(al => al.status === 'Full');
      const anyAllocated = updatedAllocations.some(al => al.quantityAllocated > 0);
      let newStatus: WorkOrder['status'] = wo.status;
      if (allFull) newStatus = 'Awaiting Approval';
      else if (anyAllocated) newStatus = 'Allocating';
      let updatedWO: WorkOrder = newStatus !== wo.status
        ? await productionService.updateWOStatus(woId, newStatus)
        : { ...wo };
      patchWorkOrder({ ...updatedWO, allocations: updatedAllocations });
    } catch (err: any) {
      addNotification('error', 'Failed to allocate materials');
    }
  };

  const handleApproveWorkOrder = async (woId: string) => {
    if (!isAdminOrManager) {
      addNotification('error', 'Only Production Managers can approve work orders.');
      return;
    }
    try {
      const updated = await productionService.updateWOStatus(woId, 'Approved');
      patchWorkOrder(updated);
      addNotification('success', `Work Order ${woId} approved.`);
    } catch (err: any) {
      addNotification('error', 'Failed to approve work order');
    }
  };

  const startProduction = async (woId: string) => {
    try {
      const updated = await productionService.updateWOStatus(woId, 'In Production');
      patchWorkOrder(updated);
      addNotification('info', `Production started for WO ${woId}`);
    } catch (err: any) {
      addNotification('error', 'Failed to start production');
    }
  };

  const completeProduction = async (woId: string) => {
    try {
      const updated = await productionService.updateWOStatus(woId, 'Completed');
      patchWorkOrder(updated);
      addNotification('success', `Work Order ${woId} marked as Completed.`);
    } catch (err: any) {
      addNotification('error', 'Failed to complete production');
    }
  };

  const handleDeleteWorkOrder = async (woId: string) => {
    if (!window.confirm(`Are you sure you want to delete Work Order ${woId}?`)) return;
    try {
      await productionService.deleteWorkOrder(woId);
      setWorkOrders(prev => prev.filter(wo => wo.id !== woId));
      if (setPropWorkOrders) setPropWorkOrders(prev => prev.filter(wo => wo.id !== woId));
      if (selectedWO?.id === woId) setSelectedWO(null);
      addNotification('success', `Work Order ${woId} deleted.`);
    } catch (err: any) {
      addNotification('error', 'Failed to delete work order.');
    }
  };

  // ─── Stage stepper ────────────────────────────────────────────────────────
  const STAGES = [
    { key: 'Draft', label: 'Draft' },
    { key: 'Allocating', label: 'Allocating' },
    { key: 'Awaiting Approval', label: 'Approvals' },
    { key: 'Approved', label: 'Approved' },
    { key: 'In Production', label: 'Production' },
    { key: 'Completed', label: 'Completed' },
  ];
  const getStageIndex = (status: string) => STAGES.findIndex(s => s.key === status);

  // ─── Shared item-table sub-component ─────────────────────────────────────
  const ItemTableSection = ({
    items, onRemove, newItem, setNewItem, onAdd,
  }: {
    items: InvoiceItem[];
    onRemove: (idx: number) => void;
    newItem: { productId: string; quantity: number };
    setNewItem: React.Dispatch<React.SetStateAction<{ productId: string; quantity: number }>>;
    onAdd: () => void;
  }) => (
    <>
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Package size={16} /> {t('production.modal.add_products')}
        </h4>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-8">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('production.modal.product')}</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={newItem.productId}
              onChange={e => setNewItem(p => ({ ...p, productId: e.target.value }))}>
              <option value="">-- {t('inventory.table.category')} --</option>
              {inventory.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('production.modal.qty')}</label>
            <input type="number" min="1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={newItem.quantity}
              onChange={e => setNewItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
          </div>
          <div className="col-span-2">
            <button type="button" onClick={onAdd}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-bold transition-all h-[38px]">
              {t('common.add')}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-xs font-bold text-slate-500 uppercase">
              <th className="p-3">{t('production.modal.product')}</th>
              <th className="p-3 text-right">{t('production.modal.qty')}</th>
              <th className="p-3 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="p-3 text-sm text-slate-700">
                  {item.description}
                  {/* Badge: existing items have a real numeric DB id */}
                  {item.id && Number(item.id) > 0 && (
                    <span className="ml-2 text-[9px] font-black uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                      existing
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm text-right font-bold text-slate-800">{item.quantity}</td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center text-slate-400 text-xs italic">No items added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title={t('production.kpi.total')} value={metrics.total.toString()} icon={<HammerIcon size={20} />} color="bg-slate-700" />
        <StatsCard title={t('production.kpi.pending_material')} value={metrics.pendingAllocation.toString()} icon={<Package size={20} />} color="bg-amber-500" />
        <StatsCard title={t('production.kpi.awaiting_approval')} value={metrics.awaitingApproval.toString()} icon={<ShieldCheck size={20} />} color="bg-indigo-500" />
        <StatsCard title={t('production.kpi.in_production')} value={metrics.inProduction.toString()} icon={<HammerIcon size={20} />} color="bg-emerald-500" />
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[
            { key: 'all', label: t('production.tabs.all') },
            { key: 'pending_allocation', label: t('production.tabs.pending_material') },
            { key: 'awaiting_approval', label: t('production.tabs.needs_approval') },
            { key: 'active', label: t('production.tabs.active_floor') },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={t('common.search')}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-all">
            <Plus size={18} /> {t('production.buttons.manual_wo')}
          </button>
          <button onClick={() => setIsConverterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all">
            <RefreshCcw size={18} /> {t('production.buttons.from_sales_order')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('production.table.wo_id')}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('production.table.customer_so')}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('production.table.due_date')}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('production.table.materials')}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('production.table.status')}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('production.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkOrders.map(wo => {
                const allocatedCount = wo.allocations.filter(a => a.status === 'Full').length;
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{wo.id}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{wo.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">{wo.salesOrderId || 'Manual Entry'}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{wo.dueDate}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-slate-500">
                          {allocatedCount} / {wo.allocations.length} {t('production.modal.product')}s
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500"
                            style={{ width: `${wo.allocations.length ? (allocatedCount / wo.allocations.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {/* Clickable status badge → inline dropdown */}
                      <div className="relative inline-block" data-status-dropdown>
                        <button
                          onClick={() => setOpenStatusDropdown(openStatusDropdown === wo.id ? null : wo.id)}
                          disabled={savingStatusId === wo.id}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50 ${
                            wo.status === 'Completed'          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            wo.status === 'In Production'     ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            wo.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            wo.status === 'Approved'          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {savingStatusId === wo.id ? '…' : getTranslatedStatus(wo.status)}
                          <ChevronDown size={10} className="opacity-60 shrink-0" />
                        </button>

                        {/* Dropdown */}
                        {openStatusDropdown === wo.id && (
                          <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[170px]">
                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              Change Status
                            </div>
                            {ALL_STATUSES.map(s => (
                              <button
                                key={s}
                                onClick={() => handleInlineStatusChange(wo.id, s)}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                                  s === wo.status
                                    ? 'bg-slate-50 text-slate-400 cursor-default'
                                    : 'hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                                }`}
                                disabled={s === wo.status}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  s === 'Completed'         ? 'bg-emerald-500' :
                                  s === 'In Production'    ? 'bg-blue-500' :
                                  s === 'Awaiting Approval'? 'bg-amber-500' :
                                  s === 'Approved'         ? 'bg-indigo-500' :
                                  s === 'Allocating'       ? 'bg-orange-400' :
                                                             'bg-slate-400'
                                }`} />
                                {s}
                                {s === wo.status && <span className="ml-auto text-[9px] text-slate-400">current</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {/* View details */}
                        <button
                          onClick={() => { setSelectedWO(wo); setIsAllocationModalOpen(false); setStatusOverride(''); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                          title="View details">
                          <Eye size={16} />
                        </button>

                        {/* ✏️ Edit WO — Draft, Allocating, Awaiting Approval */}
                        {(wo.status === 'Draft' || wo.status === 'Allocating' || wo.status === 'Awaiting Approval') && (
                          <button
                            onClick={() => openEditModal(wo)}
                            className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-all"
                            title="Edit work order">
                            <Pencil size={16} />
                          </button>
                        )}

                        {/* Allocate */}
                        {(wo.status === 'Draft' || wo.status === 'Allocating') && (
                          <button onClick={() => openAllocationFromTable(wo)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title={t('production.modal.allocate_title')}>
                            <Package size={16} />
                          </button>
                        )}

                        {/* Approve */}
                        {wo.status === 'Awaiting Approval' && isAdminOrManager && (
                          <button onClick={() => handleApproveWorkOrder(wo.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title={t('finance.modal.approve')}>
                            <ShieldCheck size={16} />
                          </button>
                        )}

                        {/* Start production */}
                        {wo.status === 'Approved' && (
                          <button onClick={() => startProduction(wo.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title={t('production.status.in_production')}>
                            <Hammer size={16} />
                          </button>
                        )}

                        {/* Complete */}
                        {wo.status === 'In Production' && (
                          <button onClick={() => completeProduction(wo.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title={t('production.status.completed')}>
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {/* Delete (Draft only) */}
                        {wo.status === 'Draft' && (
                          <button onClick={() => handleDeleteWorkOrder(wo.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title={t('common.delete')}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredWorkOrders.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">{t('tasks.no_results')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Create Manual WO
      ══════════════════════════════════════════════════════════════════════ */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <HammerIcon size={20} className="text-indigo-600" /> {t('production.modal.manual_title')}
              </h3>
              <button onClick={() => setIsManualModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateManualWO} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.modal.customer_name')}</label>
                  <input required type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={manualFormData.customerName}
                    onChange={e => setManualFormData(p => ({ ...p, customerName: e.target.value }))}
                    placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.table.due_date')}</label>
                  <input required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={manualFormData.dueDate}
                    onChange={e => setManualFormData(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.modal.priority')}</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={manualFormData.priority}
                    onChange={e => setManualFormData(p => ({ ...p, priority: e.target.value as any }))}>
                    <option value="Normal">{t('production.modal.priority_normal')}</option>
                    <option value="Urgent">{t('production.modal.priority_urgent')}</option>
                  </select>
                </div>
              </div>
              <ItemTableSection
                items={manualFormData.items}
                onRemove={idx => setManualFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                newItem={manualItem}
                setNewItem={setManualItem}
                onAdd={handleAddManualItem}
              />
              <div className="pt-4 border-t flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-4">
                <button type="button" onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-medium">
                  {t('common.cancel')}
                </button>
                <button type="submit"
                  className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  {t('sales.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Edit Work Order  →  PUT /work_orders/:id
      ══════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedWO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Pencil size={18} className="text-violet-600" /> Edit Work Order
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedWO.id}</p>
              </div>
              <button onClick={closeEditModal}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.modal.customer_name')}</label>
                  <input required type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 outline-none"
                    value={editFormData.customerName}
                    onChange={e => setEditFormData(p => ({ ...p, customerName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.table.due_date')}</label>
                  <input required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 outline-none"
                    value={editFormData.dueDate}
                    onChange={e => setEditFormData(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('production.modal.priority')}</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-violet-500/20"
                    value={editFormData.priority}
                    onChange={e => setEditFormData(p => ({ ...p, priority: e.target.value as any }))}>
                    <option value="Normal">{t('production.modal.priority_normal')}</option>
                    <option value="Urgent">{t('production.modal.priority_urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-700">
                Items marked <strong>existing</strong> will be updated. Newly added items will be inserted as new rows.
              </div>

              <ItemTableSection
                items={editFormData.items}
                onRemove={idx => setEditFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                newItem={editItem}
                setNewItem={setEditItem}
                onAdd={handleAddEditItem}
              />

              <div className="pt-4 border-t flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-4">
                <button type="button" onClick={closeEditModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-medium">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSavingEdit}
                  className="px-8 py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all disabled:opacity-60">
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Convert Sales Order → WO
      ══════════════════════════════════════════════════════════════════════ */}
      {isConverterOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{t('production.modal.convert_title')}</h3>
              <button onClick={() => setIsConverterOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              {salesOrders
                .filter(so => so.status === 'confirmed' && !workOrders.some(wo => wo.salesOrderId === so.id))
                .map(so => (
                  <div key={so.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-800">{so.id} - {so.customer_name}</p>
                      <p className="text-xs text-slate-500">{so.date} • {so.items.length} items • ${so?.total_amount?.toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleConvertToWorkOrder(so)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      {t('common.view')} <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              {salesOrders.filter(so => so.status === 'confirmed' && !workOrders.some(wo => wo.salesOrderId === so.id)).length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">No confirmed sales orders available for conversion.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Allocate Materials
      ══════════════════════════════════════════════════════════════════════ */}
      {isAllocationModalOpen && selectedWO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">{t('production.modal.allocate_title')}</h3>
                <p className="text-xs text-slate-500">{t('production.table.wo_id')}: {selectedWO.id}</p>
              </div>
              <button onClick={closeAllocationModal}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedWO.allocations.map(al => {
                  const product = inventory.find(p => p.id === al.productId);
                  const available = product?.stock || 0;
                  return (
                    <div key={al.id} className="p-4 border rounded-xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{al.productName}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{al.sku}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          al.status === 'Full' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>{getTranslatedStatus(al.status)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('production.modal.required')}: <span className="font-bold text-slate-800">{al.quantityRequired}</span></span>
                        <span className="text-slate-500">{t('production.modal.stock')}: <span className={`font-bold ${available >= al.quantityRequired ? 'text-emerald-600' : 'text-rose-600'}`}>{available}</span></span>
                      </div>
                      <button
                        disabled={available === 0 || al.status === 'Full'}
                        onClick={() => handleAllocateMaterial(selectedWO.id, al.id, al.quantityRequired)}
                        className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-all">
                        {t('production.modal.allocate_max')}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-xs text-indigo-700 leading-relaxed italic">
                  Once all materials are fully allocated, the Work Order will automatically move to <strong>Awaiting Approval</strong>.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end bg-slate-50">
              <button onClick={closeAllocationModal}
                className="px-8 py-2 bg-slate-900 text-white rounded-lg font-bold transition-all hover:bg-slate-800">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: WO Detail Viewer
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedWO && !isAllocationModalOpen && !isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('production.modal.details_title')}</h3>
                <p className="text-sm text-slate-500">System Reference: {selectedWO.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit button in the detail header */}
                {(selectedWO.status === 'Draft' || selectedWO.status === 'Allocating' || selectedWO.status === 'Awaiting Approval') && (
                  <button onClick={() => openEditModal(selectedWO)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 font-medium transition-all">
                    <Pencil size={14} /> Edit
                  </button>
                )}
                <button onClick={closeDetailModal}>
                  <X size={20} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8 custom-scrollbar">
              {/* Progress Stepper */}
              <div className="relative pt-4 pb-8 px-4">
                <div className="flex justify-between items-center w-full relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
                  <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${(getStageIndex(selectedWO.status) / (STAGES.length - 1)) * 100}%` }} />
                  {STAGES.map((stage, idx) => {
                    const isCompleted = idx < getStageIndex(selectedWO.status);
                    const isActive = stage.key === selectedWO.status;
                    return (
                      <div key={stage.key} className="relative z-10 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                          isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' :
                          isActive    ? 'bg-white border-indigo-500 text-indigo-500 scale-110 shadow-lg ring-4 ring-indigo-50' :
                                        'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        <span className={`absolute top-full mt-2 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('crm.table.customer')}</label>
                    <p className="font-bold text-slate-800">{selectedWO.customerName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('finance.table.reference')}</label>
                    <p className="font-mono text-indigo-600 font-bold">{selectedWO.salesOrderId || 'Manual Entry'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Priority</label>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      selectedWO.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'
                    }`}>{selectedWO.priority ?? 'Normal'}</span>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('production.table.status')}</label>
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {getTranslatedStatus(selectedWO.status)}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('production.table.due_date')}</label>
                    <p className="font-bold text-slate-800">{selectedWO.dueDate}</p>
                  </div>
                </div>
              </div>

              {/* ── Status Override (admin/manager only) ──────────────────── */}
              {isAdminOrManager && (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ChevronDown size={14} /> Force Status Override
                  </p>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={statusOverride}
                      onChange={e => setStatusOverride(e.target.value as WorkOrder['status'])}>
                      <option value="">— select new status —</option>
                      {ALL_STATUSES.filter(s => s !== selectedWO.status).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      disabled={!statusOverride || isSavingStatus}
                      onClick={handleStatusOverrideSave}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all whitespace-nowrap">
                      {isSavingStatus ? 'Saving…' : 'Apply Status'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bill of Materials */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <List size={16} /> {t('production.modal.bom')}
                </h4>
                <div className="space-y-2">
                  {selectedWO.allocations.map(al => (
                    <div key={al.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{al.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{al.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{al.quantityAllocated} / {al.quantityRequired} {t('production.modal.allocated')}</p>
                        <span className={`text-[9px] font-black uppercase ${al.status === 'Full' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {getTranslatedStatus(al.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
              {(selectedWO.status === 'Draft' || selectedWO.status === 'Allocating') && (
                <button onClick={openAllocationFromDetail}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg font-bold transition-all hover:bg-amber-600 shadow-lg shadow-amber-100">
                  Update Allocation
                </button>
              )}
              {selectedWO.status === 'Awaiting Approval' && isAdminOrManager && (
                <button onClick={() => handleApproveWorkOrder(selectedWO.id)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold transition-all hover:bg-indigo-700">
                  Approve
                </button>
              )}
              {selectedWO.status === 'Approved' && (
                <button onClick={() => { startProduction(selectedWO.id); closeDetailModal(); }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold transition-all hover:bg-blue-700">
                  Start Work
                </button>
              )}
              {selectedWO.status === 'In Production' && (
                <button onClick={() => { completeProduction(selectedWO.id); closeDetailModal(); }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold transition-all hover:bg-emerald-700">
                  Complete Work
                </button>
              )}
              <button onClick={closeDetailModal}
                className="px-8 py-2 bg-slate-900 text-white rounded-lg font-bold transition-all hover:bg-slate-800">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionView;