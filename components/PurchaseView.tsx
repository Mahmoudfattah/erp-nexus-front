// PurchaseView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Vendor,
  PurchaseOrder,
  InvoiceItem,
  Product,
  StockMovement,
  User,
} from '../types';

import {
  ShoppingBag,
  Plus,
  Search,
  FileText,
  Download,
  Truck,
  CheckCircle,
  X,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Send,
  Eye,
  Package,
  History,
  DollarSign,
  CreditCard,
  Receipt,
  Calendar,
  MapPin,
  Filter,
  XCircle,
  CheckSquare,
  Square,
  Trash2,
  PieChart as PieChartIcon,
  Pencil,
  User as UserIcon,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Info,
  Tag,
  FileBarChart,
  Loader,
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useLanguage } from './LanguageContext';
import StatsCard from './StatsCard';
import { purchaseService } from '../api/purchaseService';

interface PurchaseViewProps {
  user?: User;
  inventory?: Product[];
  setInventory?: React.Dispatch<React.SetStateAction<Product[]>>;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// ✅ lock rule: cannot EDIT/DELETE when Approved, Ordered, or Received
const isLockedPO = (status?: string) =>
  status === 'Approved' || status === 'Ordered' || status === 'Received';

const PurchaseView: React.FC<PurchaseViewProps> = ({
  user,
  inventory: propInventory = [],
  setInventory: setPropInventory,
}) => {
  const { t } = useLanguage();

  // ---------- API DATA ----------
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [posError, setPosError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<Product[]>(propInventory);
  useEffect(() => { setInventory(propInventory); }, [propInventory]);
  useEffect(() => { if (setPropInventory) setPropInventory(inventory); }, [inventory, setPropInventory]);

  const refreshVendors = async () => {
    try {
      setVendorsError(null);
      setIsLoadingVendors(true);
      const data = await purchaseService.getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setVendorsError(err?.message || 'Failed to fetch vendors');
      console.error('Failed to fetch vendors:', err);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const refreshPOs = async () => {
    try {
      setPosError(null);
      setIsLoadingPOs(true);
      const data = await purchaseService.getPurchaseOrders();
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPosError(err?.message || 'Failed to fetch purchase orders');
      console.error('Failed to fetch purchase orders:', err);
    } finally {
      setIsLoadingPOs(false);
    }
  };

  useEffect(() => {
    refreshVendors();
    refreshPOs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI STATE ----------
  const [viewMode, setViewMode] = useState<'orders' | 'vendors' | 'analytics'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeVendorTab, setActiveVendorTab] = useState<'overview' | 'orders' | 'payments'>('overview');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetPO, setPaymentTargetPO] = useState<PurchaseOrder | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    invoiceReference: '',
  });

  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
    name: '', contactPerson: '', email: '', phone: '',
    address: '', website: '', tax_id: '', payment_terms: '', notes: '', status: 'Active',
  });

  const [poForm, setPoForm] = useState<Partial<PurchaseOrder>>({
    vendorId: '', date: new Date().toISOString().split('T')[0], expectedDelivery: '', items: [],
  });

  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    description: '', quantity: 1, unitPrice: 0,
  });

  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [isSavingPO, setIsSavingPO] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- Analytics ----------
  const analyticsData = useMemo(() => {
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalOrders = purchaseOrders.length;
    const activeVendors = vendors.filter((v) => v.status === 'Active').length;

    const spendByVendor = purchaseOrders.reduce((acc, po) => {
      const key = po.vendorName || 'Unknown';
      acc[key] = (acc[key] || 0) + (po.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const vendorChartData = Object.entries(spendByVendor).map(([name, value]) => ({ name, value }));

    const monthlySpend = purchaseOrders.reduce((acc, po) => {
      const d = new Date(po.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += po.totalAmount || 0;
      return acc;
    }, {} as Record<string, number>);

    const trendChartData = Object.entries(monthlySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, spend: value }));

    return { totalSpend, totalOrders, activeVendors, vendorChartData, trendChartData };
  }, [purchaseOrders, vendors]);

  const [analyticsFromApi, setAnalyticsFromApi] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const refreshAnalytics = async () => {
    try {
      setAnalyticsError(null);
      setIsLoadingAnalytics(true);
      const data = await purchaseService.getAnalytics();
      setAnalyticsFromApi(data || null);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setAnalyticsError(err?.message || 'Failed to fetch analytics');
      setAnalyticsFromApi(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'analytics') refreshAnalytics();
  }, [viewMode]);

  const effectiveAnalytics = useMemo(() => {
    if (analyticsFromApi && typeof analyticsFromApi === 'object') {
      return {
        totalSpend: analyticsFromApi.totalSpend ?? analyticsData.totalSpend,
        totalOrders: analyticsFromApi.totalOrders ?? analyticsData.totalOrders,
        activeVendors: analyticsFromApi.activeVendors ?? analyticsData.activeVendors,
        vendorChartData: analyticsFromApi.vendorChartData ?? analyticsData.vendorChartData,
        trendChartData: analyticsFromApi.trendChartData ?? analyticsData.trendChartData,
      };
    }
    return analyticsData;
  }, [analyticsFromApi, analyticsData]);

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const nonCancelledPOs = purchaseOrders.filter((po) => po.status !== 'Cancelled' && po.status !== 'Rejected');

    const thisMonthPOs = nonCancelledPOs.filter((po) => {
      const d = new Date(po.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && po.status !== 'Draft';
    });

    const monthlySpend = thisMonthPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthPOs = nonCancelledPOs.filter((po) => {
      const d = new Date(po.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear() && po.status !== 'Draft';
    });

    const lastMonthSpend = lastMonthPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const spendTrend = lastMonthSpend > 0
      ? (((monthlySpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1) + '%'
      : '0%';
    const spendUp = monthlySpend >= lastMonthSpend;

    const pendingApprovals = purchaseOrders.filter((po) => po.status === 'Awaiting Approval').length;
    const pendingDeliveries = purchaseOrders.filter((po) => po.status === 'Ordered' || po.status === 'Approved').length;
    const totalOutstanding = nonCancelledPOs
      .filter((po) => po.status !== 'Paid')
      .reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    return { monthlySpend, spendTrend, spendUp, pendingApprovals, pendingDeliveries, totalOutstanding };
  }, [purchaseOrders]);

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    inventory.forEach((p) => products.add(p.name));
    return Array.from(products).sort();
  }, [inventory]);

  const filteredPOs = useMemo(() => {
    return (purchaseOrders || []).filter((po) => {
      const matchesSearch =
        (po.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
      const matchesVendor = vendorFilter === 'All' || po.vendorId === vendorFilter;
      const matchesProduct =
        productFilter === 'All' ||
        (po.items || []).some((item) => item.description === productFilter || item.productId === productFilter);
      const orderDate = new Date(po.date);
      const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
      const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
      const matchesDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
      return matchesSearch && matchesStatus && matchesVendor && matchesDate && matchesProduct;
    });
  }, [purchaseOrders, searchTerm, statusFilter, vendorFilter, productFilter, dateFilter]);

  const filteredVendors = useMemo(() => {
    return (vendors || []).filter(
      (v) =>
        (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  const clearFilters = () => {
    setSearchTerm(''); setStatusFilter('All'); setVendorFilter('All');
    setProductFilter('All'); setDateFilter({ start: '', end: '' });
  };

  const handleSelectAll = () => {
    if (selectedPOIds.length === filteredPOs.length) setSelectedPOIds([]);
    else setSelectedPOIds(filteredPOs.map((po) => po.id));
  };

  const handleSelectOne = (id: string) => {
    if (selectedPOIds.includes(id)) setSelectedPOIds(selectedPOIds.filter((poId) => poId !== id));
    else setSelectedPOIds([...selectedPOIds, id]);
  };

  const getVendorFinancials = (vendorId: string) => {
    const vendorPOs = (purchaseOrders || []).filter((po) => po.vendorId === vendorId);
    const outstanding = vendorPOs
      .filter((po) => ['Ordered', 'Received', 'Awaiting Approval', 'Draft', 'Approved'].includes(po.status))
      .reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const paid = vendorPOs.filter((po) => po.status === 'Paid').reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    return { outstanding, paid };
  };

  // ---------- Modal openers ----------
  const openAddVendorModal = () => {
    setEditingVendorId(null);
    setVendorForm({
      name: '', contactPerson: '', email: '', phone: '',
      address: '', website: '', tax_id: '', payment_terms: '', notes: '', status: 'Active',
    });
    setIsVendorModalOpen(true);
  };

  const openEditVendorModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setVendorForm({
      name: vendor.name, contactPerson: vendor.contactPerson, email: vendor.email, phone: vendor.phone,
      address: vendor.address || '', website: vendor.website || '', tax_id: vendor.tax_id || '',
      payment_terms: vendor.payment_terms || '', notes: vendor.notes || '', status: vendor.status,
    });
    setIsVendorModalOpen(true);
  };

  const openCreatePOModal = () => {
    setEditingPOId(null);
    setPoForm({ vendorId: '', date: new Date().toISOString().split('T')[0], expectedDelivery: '', items: [] });
    setIsPOModalOpen(true);
  };

  const openEditPOModal = (po: PurchaseOrder) => {
    if (isLockedPO(po.status)) {
      alert('This Purchase Order is locked (Approved/Ordered/Received). You cannot edit it.');
      return;
    }
    setEditingPOId(po.id);
    setPoForm({
      vendorId: po.vendorId, date: po.date,
      expectedDelivery: po.expectedDelivery,
      items: (po.items || []).map((item) => ({ ...item })),
    });
    setIsPOModalOpen(true);
  };

  // ---------- API: Save Vendor ----------
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingVendor(true);
      const payload: Partial<Vendor> = {
        name: vendorForm.name || '', contactPerson: vendorForm.contactPerson || '',
        email: vendorForm.email || '', phone: vendorForm.phone || '',
        address: vendorForm.address || '', website: vendorForm.website || '',
        tax_id: vendorForm.tax_id || '', payment_terms: vendorForm.payment_terms || '',
        notes: vendorForm.notes || '', status: (vendorForm.status as any) || 'Active',
      };
      if (editingVendorId) {
        const updated = await purchaseService.updateVendor(editingVendorId, payload);
        setVendors((prev) => prev.map((v) => (v.id === editingVendorId ? updated : v)));
      } else {
        const created = await purchaseService.createVendor(payload);
        setVendors((prev) => [created, ...prev]);
      }
      setIsVendorModalOpen(false);
      setEditingVendorId(null);
    } catch (err: any) {
      console.error('Failed to save vendor:', err);
      alert('Failed to save vendor. The email has already been taken.');
    } finally {
      setIsSavingVendor(false);
    }
  };

  // ---------- API: Delete Vendor ----------
  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      setIsDeleting(true);
      await purchaseService.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      console.error('Failed to delete vendor:', err);
      alert('Failed to delete vendor.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Items ----------
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = inventory.find((p) => p.id === productId);
    if (product) setNewItem({ ...newItem, description: product.name, unitPrice: product.price });
    else setNewItem({ ...newItem, description: '', unitPrice: 0 });
  };

  const addItemToPO = () => {
    if (!selectedProductId && !newItem.description) { alert('Please select a product.'); return; }
    if (!newItem.quantity || newItem.unitPrice === undefined) return;
    const item: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProductId || undefined,
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
      total: Number(newItem.quantity) * Number(newItem.unitPrice),
    };
    setPoForm({ ...poForm, items: [...(poForm.items || []), item] });
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setSelectedProductId('');
  };

  const removeItemFromPO = (id: string) => {
    setPoForm({ ...poForm, items: (poForm.items || []).filter((i) => i.id !== id) });
  };

  // ---------- API: Save PO ----------
  const handleSavePO = async (e: React.FormEvent, initialStatus: PurchaseOrder['status'] = 'Draft') => {
    e.preventDefault();
    if (editingPOId) {
      const current = purchaseOrders.find((p) => p.id === editingPOId);
      if (current && isLockedPO(current.status)) {
        alert('This Purchase Order is locked. You cannot update it.');
        return;
      }
    }
    if (!vendors.find((v) => v.id === poForm.vendorId)) { alert('Please select a vendor.'); return; }
    if (!poForm.items || poForm.items.length === 0) { alert('Please add at least one item.'); return; }

    const totalAmount = (poForm.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
    try {
      setIsSavingPO(true);
      const payload: Partial<PurchaseOrder> = {
        vendorId: poForm.vendorId || '', date: poForm.date || new Date().toISOString().split('T')[0],
        expectedDelivery: poForm.expectedDelivery || '', items: poForm.items || [], totalAmount, status: initialStatus,
      };
      if (editingPOId) await purchaseService.updatePurchaseOrder(editingPOId, payload);
      else await purchaseService.createPurchaseOrder(payload);
      await refreshPOs();
      setIsPOModalOpen(false);
      setEditingPOId(null);
      setPoForm({ vendorId: '', date: new Date().toISOString().split('T')[0], expectedDelivery: '', items: [] });
    } catch (err: any) {
      console.error('Failed to save purchase order:', err);
      alert('Failed to save purchase order.');
    } finally {
      setIsSavingPO(false);
    }
  };

  // ---------- API: Delete PO ----------
  const handleDeleteOne = async (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (po && isLockedPO(po.status)) {
      alert('This Purchase Order is locked. You cannot delete it.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      setIsDeleting(true);
      await purchaseService.deletePurchaseOrder(id);
      setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
      setSelectedPOIds((prev) => prev.filter((x) => x !== id));
    } catch (err: any) {
      console.error('Failed to delete purchase order:', err);
      alert('Failed to delete purchase order.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- API: Bulk actions ----------
  const handleBulkAction = async (action: string) => {
    if (selectedPOIds.length === 0) return;
    const selectedPOs = purchaseOrders.filter((po) => selectedPOIds.includes(po.id));

    if (action === 'Delete') {
      if (selectedPOs.some((po) => isLockedPO(po.status))) {
        alert('Some selected POs are locked and cannot be deleted.');
        return;
      }
      if (!window.confirm(`Delete ${selectedPOIds.length} purchase orders?`)) return;
      try {
        setIsDeleting(true);
        await Promise.all(selectedPOIds.map((id) => purchaseService.deletePurchaseOrder(id)));
        setPurchaseOrders((prev) => prev.filter((po) => !selectedPOIds.includes(po.id)));
        setSelectedPOIds([]);
      } catch (err: any) {
        alert('Bulk delete failed.');
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    const newStatus = action as PurchaseOrder['status'];
    try {
      setIsUpdatingStatus(true);
      const updatedPOs = await Promise.all(
        selectedPOIds.map((id) => purchaseService.updatePOStatus(id, { status: newStatus }))
      );
      setPurchaseOrders((prev) =>
        prev.map((po) => { const updated = updatedPOs.find((u) => u.id === po.id); return updated || po; })
      );
      setSelectedPOIds([]);
    } catch (err: any) {
      alert('Bulk status update failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ---------- ✅ Approval Flow ----------
 // ---------- ✅ Approval Flow helpers ----------
const getApprovalId = (po: PurchaseOrder) => {
  const id = (po as any)?.approval?.id;
  return id ? String(id) : '';
};

const findApprovalIdFromList = async (poId: string): Promise<string | null> => {
  // 1) refetch list (endpoint اللي انت متأكد إنه بيرجع approval)
  const list = await purchaseService.getPurchaseOrders();
  const po = (list || []).find((x) => String(x.id) === String(poId));
  const approvalId = (po as any)?.approval?.id;
  return approvalId ? String(approvalId) : null;
};

const approvePO = async (po: PurchaseOrder, comments?: string) => {
  try {
    setIsUpdatingStatus(true);

    // try from current state first
    let approvalId = (po as any)?.approval?.id ? String((po as any).approval.id) : '';

    // ✅ fallback from list endpoint
    if (!approvalId) {
      approvalId = (await findApprovalIdFromList(po.id)) || '';
    }

    if (!approvalId) {
      alert('Approval لسه مش متسجل للطلب ده. اضغط Refresh Orders وجرب تاني.');
      return;
    }

    await purchaseService.approvePurchaseOrder(approvalId, comments || 'Manager approved.');
    await refreshPOs();
  } catch (err: any) {
    console.error('Approve failed:', err);
    alert(err?.message || 'Approve failed.');
  } finally {
    setIsUpdatingStatus(false);
  }
};

const rejectPO = async (po: PurchaseOrder, comments?: string) => {
  try {
    setIsUpdatingStatus(true);

    let approvalId = (po as any)?.approval?.id ? String((po as any).approval.id) : '';

    if (!approvalId) {
      approvalId = (await findApprovalIdFromList(po.id)) || '';
    }

    if (!approvalId) {
      alert('Approval لسه مش متسجل للطلب ده. اضغط Refresh Orders وجرب تاني.');
      return;
    }

    await purchaseService.rejectPurchaseOrder(approvalId, comments || 'Manager rejected.');
    await refreshPOs();
  } catch (err: any) {
    console.error('Reject failed:', err);
    alert(err?.message || 'Reject failed.');
  } finally {
    setIsUpdatingStatus(false);
  }
};

// ---------- ✅ Status update (non-approval flow) ----------
const updatePOStatus = async (id: string, status: PurchaseOrder['status']) => {
  try {
    setIsUpdatingStatus(true);

    // call API
    const updated = await purchaseService.updatePOStatus(id, { status });

  

    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id !== id) return po;

        // لو updated مفيهوش approval → حافظ على القديم
        const updatedAny: any = updated as any;
        const oldAny: any = po as any;

        return {
          ...po,
          ...updated,
          approval: updatedAny?.approval ? updatedAny.approval : oldAny?.approval,
          items: updatedAny?.items?.length ? updatedAny.items : oldAny?.items,
        };
      })
    );

    // ✅ الأفضل والأضمن:
    await refreshPOs();

  } catch (err: any) {
    console.error('Failed to update status:', err);
    alert('فشل تغيير الحالة.');
  } finally {
    setIsUpdatingStatus(false);
  }
};

  // ---------- API: Payment submit ----------
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetPO) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await purchaseService.updatePOStatus(paymentTargetPO.id, {
        status: 'Paid',
        invoice_reference: paymentForm.invoiceReference,
        payment_date: paymentForm.date,
      });
      setPurchaseOrders((prev) => prev.map((po) => (po.id === paymentTargetPO.id ? updated : po)));
      setIsPaymentModalOpen(false);
      setPaymentTargetPO(null);
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      alert('Failed to record payment.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ---------- PDF ----------
  const generatePO_PDF = (po: PurchaseOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(79, 70, 229);
    doc.text('PURCHASE ORDER', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Order #: ${po.id}`, 14, 28);
    doc.text(`Date: ${po.date}`, 14, 34);
    doc.text(`Vendor: ${po.vendorName}`, 14, 40);
    doc.text(`Expected Delivery: ${po.expectedDelivery}`, 14, 46);
    const tableData = (po.items || []).map((item) => [
      item.description, item.quantity, `$${item.unitPrice.toFixed(2)}`, `$${item.total.toFixed(2)}`,
    ]);
    autoTable(doc, {
      startY: 55, head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData, theme: 'striped', headStyles: { fillColor: [79, 70, 229] },
    });
    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    doc.setFontSize(14); doc.setTextColor(0);
    doc.text(`Grand Total: $${(po.totalAmount || 0).toLocaleString()}`, 14, finalY + 15);
    doc.save(`PO_${po.id}.pdf`);
  };

  const generateFilteredReport = () => {
    if (filteredPOs.length === 0) { alert('No data matches your current filters.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(79, 70, 229);
    doc.text('Procurement Analysis Report', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    const filtersUsed = [
      statusFilter !== 'All' ? `Status: ${statusFilter}` : null,
      vendorFilter !== 'All' ? `Vendor: ${vendors.find((v) => v.id === vendorFilter)?.name}` : null,
      productFilter !== 'All' ? `Product: ${productFilter}` : null,
      dateFilter.start ? `From: ${dateFilter.start}` : null,
      dateFilter.end ? `To: ${dateFilter.end}` : null,
    ].filter(Boolean).join(' | ');
    doc.text(`Applied Filters: ${filtersUsed || 'None'}`, 14, 34);
    doc.setFillColor(248, 250, 252); doc.rect(14, 40, 182, 30, 'F');
    doc.setFontSize(12); doc.setTextColor(60);
    doc.text('Total Orders', 20, 50); doc.text('Total Spend', 80, 50); doc.text('Avg Order Value', 140, 50);
    doc.setFontSize(14); doc.setTextColor(0);
    const totalSpendVal = filteredPOs.reduce((s, o) => s + (o.totalAmount || 0), 0);
    doc.text(`${filteredPOs.length}`, 20, 60);
    doc.text(`$${totalSpendVal.toLocaleString()}`, 80, 60);
    doc.text(`$${(totalSpendVal / filteredPOs.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 140, 60);
    const tableData = filteredPOs.map((o) => [o.id, o.date, o.vendorName, `$${(o.totalAmount || 0).toLocaleString()}`, o.status]);
    autoTable(doc, {
      startY: 80, head: [['PO Number', 'Date', 'Vendor', 'Total', 'Status']],
      body: tableData, theme: 'grid', headStyles: { fillColor: [79, 70, 229] }, styles: { fontSize: 9 },
    });
    doc.save(`Purchase_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isBusy = isSavingVendor || isSavingPO || isUpdatingStatus || isDeleting;

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      {viewMode === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2">
          <StatsCard title={t('purchases.kpi.procurement')} value={`$${dashboardMetrics.monthlySpend.toLocaleString()}`} trend={dashboardMetrics.spendTrend} trendUp={dashboardMetrics.spendUp} icon={<DollarSign size={20} />} color="bg-indigo-500" />
          <StatsCard title={t('purchases.kpi.pending')} value={dashboardMetrics.pendingApprovals.toString()} trend="Requires Action" trendUp={false} icon={<Clock size={20} />} color="bg-amber-500" />
          <StatsCard title={t('purchases.kpi.incoming')} value={dashboardMetrics.pendingDeliveries.toString()} trend="Orders in Transit" trendUp={true} icon={<Truck size={20} />} color="bg-blue-500" />
          <StatsCard title="Outstanding Bal." value={`$${dashboardMetrics.totalOutstanding.toLocaleString()}`} trend="Total Unpaid" trendUp={false} icon={<Receipt size={20} />} color="bg-rose-500" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">{t('purchases.title')}</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['orders', 'vendors', 'analytics'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t(`purchases.tabs.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {viewMode === 'orders' && (
              <button onClick={generateFilteredReport} disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-60">
                <FileBarChart size={18} /> Generate Report
              </button>
            )}
            {viewMode === 'orders' ? (
              <button onClick={openCreatePOModal} disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm disabled:opacity-60">
                <Plus size={18} /> {t('purchases.buttons.new_order')}
              </button>
            ) : viewMode === 'vendors' ? (
              <button onClick={openAddVendorModal} disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm disabled:opacity-60">
                <UserPlus size={18} /> {t('purchases.buttons.add_vendor')}
              </button>
            ) : (
              <button onClick={refreshAnalytics} disabled={isBusy || isLoadingAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-60">
                {isLoadingAnalytics ? <><Loader className="animate-spin" size={18} /> Refreshing...</> : <><FileBarChart size={18} /> Refresh Analytics</>}
              </button>
            )}
          </div>
        </div>

        {(vendorsError || posError) && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-sm">
            {vendorsError && <div>Vendors: {vendorsError}</div>}
            {posError && <div>Purchase Orders: {posError}</div>}
          </div>
        )}

        {viewMode !== 'analytics' && (
          <div className="flex flex-wrap gap-3 flex-1 min-w-0">
            <div className="self-start w-full sm:w-[220px] shrink-0">
              <div className="flex h-10 items-center gap-2 px-3 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500">
                <Search className="text-slate-400 shrink-0" size={18} />
                <input type="text" placeholder={t('common.search')}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {viewMode === 'orders' && (
              <>
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-slate-400" />
                  <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]"
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">{t('common.status')}: {t('tasks.status_all')}</option>
                    {['Draft', 'Awaiting Approval', 'Approved', 'Ordered', 'Received', 'Paid', 'Rejected', 'Cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-slate-400" />
                  <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]"
                    value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
                    <option value="All">All Vendors</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Package size={18} className="text-slate-400" />
                  <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 w-50"
                    value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                    <option value="All">All Products</option>
                    {uniqueProducts.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />
                  <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    value={dateFilter.start} onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))} />
                  <span className="text-slate-400">-</span>
                  <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    value={dateFilter.end} onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))} />
                </div>

                {(searchTerm || statusFilter !== 'All' || vendorFilter !== 'All' || productFilter !== 'All' || dateFilter.start || dateFilter.end) && (
                  <button onClick={clearFilters}
                    className="px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1">
                    <XCircle size={16} /> {t('common.clear')}
                  </button>
                )}
              </>
            )}

            <div className="flex gap-2 ml-auto">
              <button onClick={refreshVendors} disabled={isBusy}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60">
                {isLoadingVendors ? <Loader className="animate-spin" size={16} /> : 'Refresh Vendors'}
              </button>
              <button onClick={refreshPOs} disabled={isBusy}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60">
                {isLoadingPOs ? <Loader className="animate-spin" size={16} /> : 'Refresh Orders'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedPOIds.length > 0 && viewMode === 'orders' && (
        <div className="bg-indigo-50 px-6 py-3 border border-indigo-100 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold">{selectedPOIds.length} POs Selected</span>
          <div className="flex items-center gap-2">
            <select disabled={isBusy}
              className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-bold bg-white text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
              onChange={(e) => { if (e.target.value) handleBulkAction(e.target.value); e.target.value = ''; }}>
              <option value="">-- Change Status --</option>
              {['Awaiting Approval', 'Approved', 'Ordered', 'Received', 'Cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-indigo-200 mx-1" />
            <button onClick={() => handleBulkAction('Delete')} disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-xs font-bold disabled:opacity-60">
              {isDeleting ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />} Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {viewMode === 'orders' ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 w-12">
                    <button onClick={handleSelectAll} disabled={filteredPOs.length === 0}
                      className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {selectedPOIds.length > 0 && selectedPOIds.length === filteredPOs.length
                        ? <CheckSquare size={20} className="text-indigo-600" />
                        : <Square size={20} />}
                    </button>
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('purchases.table.po_number')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('purchases.table.vendor')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('common.date')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('purchases.table.total')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('common.status')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(isLoadingPOs || isUpdatingStatus || isDeleting) && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Working...</div>
                  </td></tr>
                )}
                {!isLoadingPOs && filteredPOs.map((po) => {
                  const locked = isLockedPO(po.status);
                  return (
                    <tr key={po.id} className={`hover:bg-slate-50 transition-colors ${selectedPOIds.includes(po.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-4">
                        <button onClick={() => handleSelectOne(po.id)} className="text-slate-400 hover:text-indigo-600 transition-colors block">
                          {selectedPOIds.includes(po.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-600">{po.id}</td>
                      <td className="p-4 font-medium text-slate-800">{po.vendorName}</td>
                      <td className="p-4 text-sm text-slate-500">{po.date}</td>
                      <td className="p-4 font-medium text-slate-800">${(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          po.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          po.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          po.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          po.status === 'Ordered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          po.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>{po.status}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {po.status === 'Awaiting Approval' && (
                            <>
                              <button disabled={isBusy} onClick={() => approvePO(po, 'Manager approved.')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-60" title="Approve Order">
                                <ThumbsUp size={16} />
                              </button>
                              <button disabled={isBusy} onClick={() => rejectPO(po, 'Manager rejected.')}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-60" title="Reject Order">
                                <ThumbsDown size={16} />
                              </button>
                            </>
                          )}
                          {po.status === 'Approved' && (
                            <button disabled={isBusy} onClick={() => updatePOStatus(po.id, 'Ordered')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-60" title="Mark as Ordered">
                              <Send size={16} />
                            </button>
                          )}
                          <button disabled={isBusy} onClick={() => setSelectedPO(po)}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60" title="View Details">
                            <Eye size={16} />
                          </button>
                          {!locked && (
                            <button disabled={isBusy} onClick={() => openEditPOModal(po)}
                              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60" title="Edit Order">
                              <Pencil size={16} />
                            </button>
                          )}
                          {po.status === 'Ordered' && (
                            <button disabled={isBusy} onClick={() => updatePOStatus(po.id, 'Received')}
                              className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 disabled:opacity-60" title="Mark as Received">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {po.status === 'Received' && (
                            <button disabled={isBusy}
                              onClick={() => { setPaymentTargetPO(po); setPaymentForm({ date: new Date().toISOString().split('T')[0], invoiceReference: '' }); setIsPaymentModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-60" title="Record Payment">
                              <CreditCard size={16} />
                            </button>
                          )}
                          {!locked && (
                            <button disabled={isBusy} onClick={() => handleDeleteOne(po.id)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoadingPOs && filteredPOs.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No purchase orders found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          ) : viewMode === 'vendors' ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('purchases.table.vendor')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('purchases.table.contact')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('purchases.table.outstanding')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('purchases.table.paid')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingVendors && (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Loading vendors...</div>
                  </td></tr>
                )}
                {!isLoadingVendors && filteredVendors.map((vendor) => {
                  const { outstanding, paid } = getVendorFinancials(vendor.id);
                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{vendor.name}</div>
                        <div className="text-xs text-slate-500">{vendor.tax_id || 'No Tax ID'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-700">{vendor.contactPerson}</div>
                        <div className="text-xs text-slate-500">{vendor.email}</div>
                      </td>
                      <td className="p-4 text-right text-sm text-red-600 font-medium">${outstanding.toLocaleString()}</td>
                      <td className="p-4 text-right text-sm text-emerald-600 font-medium">${paid.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button disabled={isBusy} onClick={() => { setSelectedVendor(vendor); setActiveVendorTab('overview'); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60" title="View Profile">
                            <Eye size={16} />
                          </button>
                          <button disabled={isBusy} onClick={() => openEditVendorModal(vendor)}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60" title="Edit Vendor">
                            <Pencil size={16} />
                          </button>
                          <button disabled={isBusy} onClick={() => handleDeleteVendor(vendor.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60" title="Delete Vendor">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoadingVendors && filteredVendors.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No vendors found.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><p className="text-xs uppercase text-slate-500 font-bold">Total Spend</p><p className="text-2xl font-black text-slate-900">${effectiveAnalytics.totalSpend.toLocaleString()}</p></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><p className="text-xs uppercase text-slate-500 font-bold">Total Orders</p><p className="text-2xl font-black text-slate-900">{effectiveAnalytics.totalOrders}</p></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><p className="text-xs uppercase text-slate-500 font-bold">Active Vendors</p><p className="text-2xl font-black text-slate-900">{effectiveAnalytics.activeVendors}</p></div>
              </div>
              {analyticsError && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-sm">{analyticsError}</div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon size={18} /> Spend by Vendor</h3>
                  <div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={effectiveAnalytics.vendorChartData} dataKey="value" nameKey="name" outerRadius={110} label>{effectiveAnalytics.vendorChartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileBarChart size={18} /> Monthly Spend Trend</h3>
                  <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={effectiveAnalytics.trendChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="spend" fill="#4f46e5" /></BarChart></ResponsiveContainer></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VENDOR DETAILS MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><Building2 size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{selectedVendor.name}</h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1"><Tag size={10} /> {selectedVendor.id} <span className="mx-1">•</span> {selectedVendor.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50/50 border-b border-slate-100">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase">Paid Total</p><p className="text-lg font-black text-emerald-600">${getVendorFinancials(selectedVendor.id).paid.toLocaleString()}</p></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</p><p className="text-lg font-black text-rose-600">${getVendorFinancials(selectedVendor.id).outstanding.toLocaleString()}</p></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase">Active Orders</p><p className="text-lg font-black text-indigo-600">{purchaseOrders.filter((po) => po.vendorId === selectedVendor.id && po.status !== 'Paid' && po.status !== 'Cancelled').length}</p></div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase">Avg. Fulfillment</p><p className="text-lg font-black text-slate-800">7.2 Days</p></div>
              </div>
              <div className="flex border-b border-slate-100 px-6">
                {(['overview', 'orders', 'payments'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveVendorTab(tab)}
                    className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeVendorTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {tab === 'overview' ? <><Info size={16} /> Overview</> : tab === 'orders' ? <><ShoppingBag size={16} /> Purchase History</> : <><CreditCard size={16} /> Payment History</>}
                  </button>
                ))}
              </div>
              <div className="p-6 flex-1 bg-slate-50/20">
                {activeVendorTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-2">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Contact Information</h4>
                      <div className="space-y-3">
                        {[{ icon: <UserIcon size={16} />, label: 'Contact Person', value: selectedVendor.contactPerson }, { icon: <Mail size={16} />, label: 'Email', value: selectedVendor.email }, { icon: <Phone size={16} />, label: 'Phone', value: selectedVendor.phone }].map(({ icon, label, value }) => (
                          <div key={label} className="flex items-center gap-3 text-sm">
                            <span className="text-slate-400">{icon}</span>
                            <div><p className="text-slate-500 text-[10px] uppercase font-bold">{label}</p><p className="text-slate-800 font-medium">{value}</p></div>
                          </div>
                        ))}
                        {selectedVendor.address && (
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin size={16} className="text-slate-400" />
                            <div><p className="text-slate-500 text-[10px] uppercase font-bold">Address</p><p className="text-slate-800 font-medium">{selectedVendor.address}</p></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Business Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl"><p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Tax ID</p><p className="text-slate-800 font-bold font-mono">{selectedVendor.tax_id || 'N/A'}</p></div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl"><p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Terms</p><p className="text-slate-800 font-bold">{selectedVendor.payment_terms || 'N/A'}</p></div>
                      </div>
                      {selectedVendor.notes && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1"><FileText size={10} /> Private Notes</p>
                          <p className="text-sm text-amber-900 italic">"{selectedVendor.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeVendorTab === 'orders' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 border-b border-slate-200"><tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest"><th className="p-3">Order ID</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3 text-right">Total Amount</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {purchaseOrders.filter((po) => po.vendorId === selectedVendor.id).length > 0
                          ? purchaseOrders.filter((po) => po.vendorId === selectedVendor.id).map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-indigo-600 font-bold">{po.id}</td>
                              <td className="p-3 text-slate-500">{po.date}</td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${po.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>{po.status}</span></td>
                              <td className="p-3 text-right font-black text-slate-800">${(po.totalAmount || 0).toLocaleString()}</td>
                            </tr>
                          ))
                          : <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No orders found for this vendor.</td></tr>
                        }
                      </tbody>
                    </table>
                  </div>
                )}
                {activeVendorTab === 'payments' && (
                  <div className="animate-in fade-in slide-in-from-right-2">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-indigo-50 border-b border-indigo-100"><tr className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"><th className="p-4">Payment Date</th><th className="p-4">Order Reference</th><th className="p-4">Vendor Invoice #</th><th className="p-4 text-right">Amount Paid</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {purchaseOrders.filter((po) => po.vendorId === selectedVendor.id && po.status === 'Paid').length > 0
                          ? purchaseOrders.filter((po) => po.vendorId === selectedVendor.id && po.status === 'Paid').map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><CheckCircle size={14} className="text-emerald-500" />{po.paymentDate || po.date}</div></td>
                              <td className="p-4 font-mono text-xs text-slate-500">{po.id}</td>
                              <td className="p-4 font-mono text-sm text-indigo-600">{po.invoiceReference || 'N/A'}</td>
                              <td className="p-4 text-right"><p className="text-slate-800 font-black">${(po.totalAmount || 0).toLocaleString()}</p></td>
                            </tr>
                          ))
                          : <tr><td colSpan={4} className="p-12 text-center"><div className="flex flex-col items-center gap-2 text-slate-400"><CreditCard size={32} className="opacity-20" /><p className="italic text-sm">No payment records found for this vendor.</p></div></td></tr>
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button disabled={isBusy} onClick={() => { setSelectedVendor(null); openEditVendorModal(selectedVendor); }}
                className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-white flex items-center gap-2 disabled:opacity-60">
                <Pencil size={16} /> Edit Profile
              </button>
              <button onClick={() => setSelectedVendor(null)} className="px-8 py-2 bg-slate-900 text-white rounded-lg font-black hover:bg-slate-800 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PO MODAL */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingPOId ? 'Edit Purchase Order' : t('purchases.modal.create_po')}</h3>
              <button onClick={() => setIsPOModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={(e) => handleSavePO(e, 'Awaiting Approval')} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('purchases.table.vendor')}</label>
                  <select required className="w-full px-3 py-2 border rounded-lg bg-white"
                    value={poForm.vendorId} onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
                  <input required type="date" className="w-full px-3 py-2 border rounded-lg"
                    value={poForm.expectedDelivery} onChange={(e) => setPoForm({ ...poForm, expectedDelivery: e.target.value })} />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Package size={16} /> Order Items</h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                      value={selectedProductId} onChange={(e) => handleProductSelect(e.target.value)}>
                      <option value="">-- Select Product --</option>
                      {inventory.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price}) - Stock: {p.stock}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                    <input type="number" min="1" className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Unit Cost</label>
                    <input type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={addItemToPO}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 h-[42px]">Add</button>
                  </div>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="border-b border-slate-200">
                  <tr className="text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Cost</th><th className="py-2 text-right">Total</th><th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poForm.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 text-sm text-slate-800">{item.description}</td>
                      <td className="py-2 text-sm text-right">{item.quantity}</td>
                      <td className="py-2 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-sm text-right font-bold">${item.total.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => removeItemFromPO(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="py-3 text-right font-bold">Grand Total:</td>
                    <td className="py-3 text-right font-bold text-indigo-600">${poForm.items?.reduce((s, i) => s + i.total, 0).toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>

              <div className="p-4 border-t flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6">
                <button type="button" onClick={() => setIsPOModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600">{t('common.cancel')}</button>
                <button type="button" disabled={isSavingPO} onClick={(e) => handleSavePO(e as any, 'Draft')}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-60">
                  {isSavingPO ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Saving...</span> : 'Save Draft'}
                </button>
                <button type="submit" disabled={isSavingPO} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-60">
                  {isSavingPO ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Submitting...</span> : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO DETAILS MODAL */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Purchase Order Details</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedPO.id}</p>
              </div>
              <button onClick={() => setSelectedPO(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500 uppercase text-xs font-bold mb-1">Vendor</p><p className="font-medium text-slate-900">{selectedPO.vendorName}</p></div>
                <div><p className="text-slate-500 uppercase text-xs font-bold mb-1">Order Date</p><p className="font-medium text-slate-900">{selectedPO.date}</p></div>
                <div><p className="text-slate-500 uppercase text-xs font-bold mb-1">Expected Delivery</p><p className="font-medium text-slate-900">{selectedPO.expectedDelivery}</p></div>
                <div><p className="text-slate-500 uppercase text-xs font-bold mb-1">Status</p><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200">{selectedPO.status}</span></div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-xs font-semibold text-slate-500 uppercase"><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-sm text-right">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-sm text-right font-bold">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50"><tr><td colSpan={3} className="p-3 text-right font-bold">Total Amount</td><td className="p-3 text-right font-bold text-indigo-600">${(selectedPO.totalAmount || 0).toLocaleString()}</td></tr></tfoot>
                </table>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
            {selectedPO.status === 'Awaiting Approval' && (
  <>
    <button
      disabled={isBusy}
      onClick={() => {
        // ✅ always get latest PO from list (with approval)
        const latest =
          purchaseOrders.find((p) => p.id === selectedPO.id) || selectedPO;

        approvePO(latest, 'Manager approved.');
        setSelectedPO(null);
      }}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60"
    >
      <ThumbsUp size={16} /> Approve
    </button>

    <button
      disabled={isBusy}
      onClick={() => {
        const latest =
          purchaseOrders.find((p) => p.id === selectedPO.id) || selectedPO;

        rejectPO(latest, 'Manager rejected.');
        setSelectedPO(null);
      }}
      className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 flex items-center gap-2 disabled:opacity-60"
    >
      <ThumbsDown size={16} /> Reject
    </button>
  </>
)}
              <button onClick={() => generatePO_PDF(selectedPO)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-white font-medium"><Download size={16} /> PDF</button>
              <button onClick={() => setSelectedPO(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && paymentTargetPO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Record Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                <p className="text-xs text-indigo-700 font-bold uppercase">Order Total</p>
                <p className="text-2xl font-black text-indigo-900">${(paymentTargetPO.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                <input required type="date" className="w-full px-3 py-2 border rounded-lg"
                  value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Reference (from Vendor)</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. INV-9900"
                  value={paymentForm.invoiceReference} onChange={(e) => setPaymentForm({ ...paymentForm, invoiceReference: e.target.value })} />
              </div>
              <button type="submit" disabled={isUpdatingStatus}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 mt-2 disabled:opacity-60">
                {isUpdatingStatus ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Saving...</span> : 'Confirm Full Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR ADD/EDIT MODAL */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingVendorId ? 'Edit Vendor Profile' : 'Add New Vendor'}</h3>
              <button onClick={() => setIsVendorModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSaveVendor} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    value={vendorForm.name || ''} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    value={vendorForm.contactPerson || ''} onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input required type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    value={vendorForm.email || ''} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input required type="tel" placeholder="01xxxxxxxx" pattern="^01[0125][0-9]{8}$" maxLength={11}
                    value={vendorForm.phone || ''}
                    onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); setVendorForm({ ...vendorForm, phone: value }); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / VAT Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    value={vendorForm.tax_id || ''} onChange={(e) => setVendorForm({ ...vendorForm, tax_id: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    value={vendorForm.payment_terms || 'Net 30'} onChange={(e) => setVendorForm({ ...vendorForm, payment_terms: e.target.value })}>
                    {['Net 15', 'Net 30', 'Net 60', 'Due on Receipt'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" rows={2}
                  value={vendorForm.address || ''} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} />
              </div>
              <div className="p-4 border-t flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6">
                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600">Cancel</button>
                <button type="submit" disabled={isSavingVendor} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-60">
                  {isSavingVendor ? <span className="inline-flex items-center gap-2"><Loader className="animate-spin" size={16} /> Saving...</span> : editingVendorId ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseView;