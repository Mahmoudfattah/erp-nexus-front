// FinanceView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Invoice,
  RecurringInvoice,
  Customer,
  SalesOrder,
  StatusHistory,
  Subscription,
  Expense,
  PurchaseOrder,
  GeneralLedgerEntry,
  Payable,
  Vendor,
  InvoiceItem,
  User,
  CostCenter,
  Product,
} from '../types';

import {
  Plus,
  Clock,
  CheckCircle,
  Trash2,
  X,
  Download,
  Calendar,
  PauseCircle,
  PlayCircle,
  Send,
  ArrowUpDown,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FilePenLine,
  History,
  Layers,
  Split,
  Wallet,
  Tag,
  DollarSign,
  Calculator,
  Banknote,
  ShoppingCart,
  MoreHorizontal,
  Copy,
  FolderOpen,
  FileBarChart,
  Package,
  Search,
  CreditCard,
  ExternalLink,
  Building2,
  User as UserIcon,
  Users,
  Link,
  BookOpen,
  Receipt,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Network,
  Edit2,
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import StatsCard from './StatsCard';

import { useGetSalesOrdersQuery, useGetCustomersQuery } from '../services/salesApi';
import { purchaseService } from '../api/purchaseService';

import {
  financeService,
  CreateInvoicePayload,
  CreateCostCenterPayload,
  UpdateCostCenterPayload,
  toFrontendStatus,
} from '../api/financeService';

interface FinanceViewProps {
  user: User;
  customers?: Customer[];
  onNavigateToCRM?: () => void;
  salesOrders?: SalesOrder[];
  subscription?: Subscription;
  invoices?: Invoice[];
  setInvoices?: React.Dispatch<React.SetStateAction<Invoice[]>>;
  recurringInvoices?: RecurringInvoice[];
  setRecurringInvoices?: React.Dispatch<React.SetStateAction<RecurringInvoice[]>>;
  expenses?: Expense[];
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>;
  costCenters?: CostCenter[];
  setCostCenters?: React.Dispatch<React.SetStateAction<CostCenter[]>>;
  purchaseOrders?: PurchaseOrder[];
  payables?: Payable[];
  setPayables?: React.Dispatch<React.SetStateAction<Payable[]>>;
  vendors?: Vendor[];
  inventory?: Product[];
}

const mockLedger: GeneralLedgerEntry[] = [
  { id: 'GL-001', date: '2023-10-01', description: 'Opening Balance', category: 'Equity', debit: 50000, credit: 0 },
  { id: 'GL-002', date: '2023-10-15', description: 'Office Rent Payment', category: 'Expense', debit: 0, credit: 1200 },
  { id: 'GL-003', date: '2023-10-26', description: 'Service Revenue - DesignCo', category: 'Revenue', debit: 12500, credit: 0, referenceId: 'INV-1024' },
];

const SALES_TEAM = ['John Doe', 'Sarah Smith', 'Mike Brown', 'Emily Davis', 'Alex Johnson'];
const EXPENSE_CATEGORIES = ['Office', 'Travel', 'Equipment', 'Marketing', 'Payroll', 'Utilities', 'Cost of Goods'];

const ActionDropdown: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ onClose, children, align = 'right' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-200 py-1 overflow-hidden`}
    >
      {children}
    </div>
  );
};

const FinanceView: React.FC<FinanceViewProps> = ({
  user,
  customers: propCustomers = [],
  onNavigateToCRM,
  salesOrders: propSalesOrders = [],
  subscription,
  invoices: propInvoices = [],
  setInvoices: setPropInvoices,
  recurringInvoices: propRecurringInvoices = [],
  setRecurringInvoices: setPropRecurringInvoices,
  expenses: propExpenses = [],
  setExpenses: setPropSetExpenses,
  purchaseOrders: propPurchaseOrders = [],
  payables: propPayables = [],
  setPayables: setPropPayables,
  vendors = [],
  costCenters: propCostCenters = [],
  setCostCenters: setPropCostCenters,
  inventory = [],
}) => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  const { data: customersData } = useGetCustomersQuery();
  const { data: salesOrdersData } = useGetSalesOrdersQuery();

  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [poData, setPoData] = useState<any>(null);

  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingPayables, setIsLoadingPayables] = useState(false);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [isLoadingCostCenters, setIsLoadingCostCenters] = useState(false);

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        setIsLoadingPOs(true);
        const response = await purchaseService.getPurchaseOrders();
        const normalized = (response as any)?.data?.data ?? (response as any)?.data ?? response;
        setPoData(normalized);
      } catch (error) {
        console.error('Failed to fetch purchase orders:', error);
      } finally {
        setIsLoadingPOs(false);
      }
    };
    fetchPOs();
  }, []);

  const customers: Customer[] = (customersData as any)?.data || propCustomers;
  const salesOrders: SalesOrder[] = (salesOrdersData as any)?.data || propSalesOrders;
  const purchaseOrders: PurchaseOrder[] = Array.isArray(poData) ? poData : (poData?.data || propPurchaseOrders);

  const [invoices, setInvoices] = useState<Invoice[]>(propInvoices);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(propRecurringInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(propExpenses);
  const [payables, setPayables] = useState<Payable[]>(propPayables);
  const [ledger, setLedger] = useState<GeneralLedgerEntry[]>(mockLedger);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(propCostCenters);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoadingInvoices(true);
      try {
        const data = await financeService.getInvoices();
        setInvoices(data);
        if (setPropInvoices) setPropInvoices(data);
      } catch (err: any) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setIsLoadingInvoices(false);
      }
    };
    fetchInvoices();
  }, [setPropInvoices]);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoadingExpenses(true);
      try {
        const data = await financeService.getExpenses();
        setExpenses(data);
        if (setPropSetExpenses) setPropSetExpenses(data);
      } catch (err: any) {
        console.error('Failed to fetch expenses:', err);
      } finally {
        setIsLoadingExpenses(false);
      }
    };
    fetchExpenses();
  }, [setPropSetExpenses]);

  useEffect(() => {
    const fetchPayables = async () => {
      setIsLoadingPayables(true);
      try {
        const data = await financeService.getPayables();
        setPayables(data);
        if (setPropPayables) setPropPayables(data);
      } catch (err: any) {
        console.error('Failed to fetch payables:', err);
      } finally {
        setIsLoadingPayables(false);
      }
    };
    fetchPayables();
  }, [setPropPayables]);

  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoadingLedger(true);
      try {
        const data = await financeService.getLedger();
        setLedger(data);
      } catch (err: any) {
        console.error('Failed to fetch ledger:', err);
      } finally {
        setIsLoadingLedger(false);
      }
    };
    fetchLedger();
  }, []);

  useEffect(() => {
    const fetchCostCenters = async () => {
      setIsLoadingCostCenters(true);
      try {
        const data = await financeService.getCostCenters();
        setCostCenters(data);
        if (setPropCostCenters) setPropCostCenters(data);
      } catch (err: any) {
        console.error('Failed to fetch cost centers:', err);
      } finally {
        setIsLoadingCostCenters(false);
      }
    };
    fetchCostCenters();
  }, [setPropCostCenters]);

  useEffect(() => { if (setPropInvoices) setPropInvoices(invoices); }, [invoices, setPropInvoices]);
  useEffect(() => { if (setPropRecurringInvoices) setPropRecurringInvoices(recurringInvoices); }, [recurringInvoices, setPropRecurringInvoices]);
  useEffect(() => { if (setPropSetExpenses) setPropSetExpenses(expenses); }, [expenses, setPropSetExpenses]);
  useEffect(() => { if (setPropPayables) setPropPayables(payables); }, [payables, setPropPayables]);
  useEffect(() => { if (setPropCostCenters) setPropCostCenters(costCenters); }, [costCenters, setPropCostCenters]);

  const [viewMode, setViewMode] = useState<'invoices' | 'recurring' | 'expenses' | 'payables' | 'ledger' | 'cost center'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [salesNumberFilter, setSalesNumberFilter] = useState('All');
  const [paymentTermsFilter, setPaymentTermsFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [ledgerSort, setLedgerSort] = useState<{ key: keyof GeneralLedgerEntry; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isJournalEntryModalOpen, setIsJournalEntryModalOpen] = useState(false);

  const [isCostCenterModalOpen, setIsCostCenterModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [costCenterFormData, setCostCenterFormData] = useState<CreateCostCenterPayload>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  });

  const [formData, setFormData] = useState<
    Partial<Invoice> & { installmentCount?: number; downPayment?: number; paymentMode: 'Cash' | 'Installments' }
  >({
    customerId: '',
    customerName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    salesNumber: '',
    paymentTerms: 'Net 30',
    items: [],
    salesperson: user.name,
    installmentCount: 1,
    downPayment: 0,
    paymentMode: 'Cash',
  });

  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({ description: '', quantity: 1, unitPrice: 0 });
  const [selectedInvoiceProductId, setSelectedInvoiceProductId] = useState<string>('');

  const [journalFormData, setJournalFormData] = useState<Partial<GeneralLedgerEntry>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Other',
    debit: 0,
    credit: 0,
  });

  const [expenseFormData, setExpenseFormData] = useState<Partial<Expense>>({
    category: 'Office',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Pending',
    linkedPO: '',
    linkedProject: '',
    costCenterId: '',
  });

  useEffect(() => {
    if (isModalOpen && formData.date && formData.paymentTerms) {
      const issueDate = new Date(formData.date);
      let daysToAdd = 0;
      switch (formData.paymentTerms) {
        case 'Net 15': daysToAdd = 15; break;
        case 'Net 30': daysToAdd = 30; break;
        case 'Net 60': daysToAdd = 60; break;
        case 'Due on Receipt': daysToAdd = 0; break;
        default: daysToAdd = 30;
      }
      const calculatedDueDate = new Date(issueDate);
      calculatedDueDate.setDate(issueDate.getDate() + daysToAdd);
      const dueDateStr = calculatedDueDate.toISOString().split('T')[0];
      if (formData.dueDate !== dueDateStr) {
        setFormData(prev => ({ ...prev, dueDate: dueDateStr }));
      }
    }
  }, [formData.date, formData.paymentTerms, isModalOpen]);

  const financeMetrics = useMemo(() => {
    const pendingInvoices = invoices.filter(inv => inv.status !== 'Paid' && inv.status !== 'Rejected');
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const now = new Date();
    const recentPaidInvoices = invoices.filter(inv => {
      if (inv.status !== 'Paid') return false;
      const payDate = new Date(inv.date);
      return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear();
    });
    const recentPayments = recentPaidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    return { totalPending, recentPayments };
  }, [invoices]);

  const uniqueSalesNumbers = useMemo(() => {
    const nums = new Set<string>();
    invoices.forEach(inv => { if (inv.salesNumber) nums.add(inv.salesNumber); });
    return Array.from(nums).sort();
  }, [invoices]);

  const uniqueInvoiceCustomers = useMemo(() => {
    const custs = new Set<string>();
    invoices.forEach(inv => custs.add(inv.customerName));
    return Array.from(custs).sort();
  }, [invoices]);

  const uniquePayableVendors = useMemo(() => {
    const vends = new Set<string>();
    payables.forEach(p => vends.add(p.vendorName));
    return Array.from(vends).sort();
  }, [payables]);

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    inventory.forEach(p => products.add(p.name));
    return Array.from(products).sort();
  }, [inventory]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.salesperson && invoice.salesperson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        invoice.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSalesNumber = salesNumberFilter === 'All' || invoice.salesNumber === salesNumberFilter;
      const matchesPaymentTerms = paymentTermsFilter === 'All' || invoice.paymentTerms === paymentTermsFilter;
      const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
      const matchesCustomer = customerFilter === 'All' || invoice.customerName === customerFilter;
      const matchesProduct =
        productFilter === 'All' ||
        (invoice.items || []).some(item => item.description === productFilter || String((item as any).productId) === productFilter);
      const orderDate = new Date(invoice.date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      const matchesDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
      return matchesSearch && matchesSalesNumber && matchesPaymentTerms && matchesStatus && matchesCustomer && matchesDate && matchesProduct;
    });
  }, [invoices, searchTerm, salesNumberFilter, paymentTermsFilter, statusFilter, customerFilter, productFilter, dateRange]);

  const filteredExpenses = expenses.filter(exp =>
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((exp as any).linkedProject && String((exp as any).linkedProject).toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((exp as any).linkedPO && String((exp as any).linkedPO).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPayables = (payables || []).filter(p => {
    const matchesSearch =
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = vendorFilter === 'All' || p.vendorName === vendorFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesProduct = productFilter === 'All' || p.description.includes(productFilter);
    const orderDate = new Date((p as any).date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    const matchesDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
    return matchesSearch && matchesVendor && matchesStatus && matchesDate && matchesProduct;
  });

  const filteredRecurring = (recurringInvoices || []).filter(r =>
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLedger = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const filtered = ledger.filter(entry =>
      entry.description.toLowerCase().includes(search) ||
      entry.category.toLowerCase().includes(search) ||
      entry.id.toLowerCase().includes(search) ||
      (entry.referenceId && entry.referenceId.toLowerCase().includes(search))
    );
    return filtered.sort((a, b) => {
      const aVal = (a as any)[ledgerSort.key] || '';
      const bVal = (b as any)[ledgerSort.key] || '';
      if (aVal < bVal) return ledgerSort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return ledgerSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ledger, searchTerm, ledgerSort]);

  const ledgerWithBalance = useMemo(() => {
    const chronological = [...filteredLedger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentBalance = 0;
    const withBal = chronological.map(entry => {
      currentBalance += ((Number(entry.debit) || 0) - (Number(entry.credit) || 0));
      return { ...entry, balance: currentBalance } as any;
    });
    if (ledgerSort.dir === 'desc' && ledgerSort.key === 'date') return withBal.reverse();
    return withBal;
  }, [filteredLedger, ledgerSort]);

  const filteredCostCenters = useMemo(() => {
    if (!searchTerm) return costCenters;
    const s = searchTerm.toLowerCase();
    return costCenters.filter(cc =>
      cc.name.toLowerCase().includes(s) ||
      (cc as any).code?.toLowerCase().includes(s) ||
      ((cc as any).description ?? '').toLowerCase().includes(s)
    );
  }, [costCenters, searchTerm]);

  const getParentName = (parentId: number | null | undefined) => {
    if (!parentId) return null;
    const parent = costCenters.find(cc => String(cc.id) === String(parentId));
    return parent ? parent.name : null;
  };

  const getCostCenterExpenseCount = (ccId: string | number) => {
    return expenses.filter(exp => String((exp as any).costCenterId) === String(ccId)).length;
  };

  const handleLedgerSort = (key: keyof GeneralLedgerEntry) => {
    setLedgerSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const generateFilteredFinanceReport = () => {
    const isAR = viewMode === 'invoices';
    const data: any[] = isAR ? filteredInvoices : filteredPayables;
    if (data.length === 0) {
      addNotification('warning', 'No data matches your current filters to generate a report.');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(isAR ? 'Accounts Receivable Analysis' : 'Accounts Payable Analysis', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    const filtersUsed = [
      statusFilter !== 'All' ? `Status: ${statusFilter}` : null,
      (isAR ? customerFilter !== 'All' : vendorFilter !== 'All') ? (isAR ? `Customer: ${customerFilter}` : `Vendor: ${vendorFilter}`) : null,
      productFilter !== 'All' ? `Product: ${productFilter}` : null,
      dateRange.start ? `From: ${dateRange.start}` : null,
      dateRange.end ? `To: ${dateRange.end}` : null,
    ].filter(Boolean).join(' | ');
    doc.text(`Applied Filters: ${filtersUsed || 'None'}`, 14, 34);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 40, 182, 30, 'F');
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text('Count', 20, 50);
    doc.text('Total Value', 80, 50);
    doc.text('Avg Transaction', 140, 50);
    doc.setFontSize(14);
    doc.setTextColor(0);
    const totalVal = data.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    doc.text(`${data.length}`, 20, 60);
    doc.text(`$${totalVal.toLocaleString()}`, 80, 60);
    doc.text(`$${(totalVal / data.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 140, 60);
    const tableData = data.map(o => [
      o.id, (o as any).date,
      isAR ? (o as Invoice).customerName : (o as Payable).vendorName,
      `$${Number(o.amount).toLocaleString()}`, o.status,
    ]);
    autoTable(doc, {
      startY: 80,
      head: [['ID', 'Date', isAR ? 'Customer' : 'Vendor', 'Amount', 'Status']],
      body: tableData, theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, styles: { fontSize: 9 },
    });
    doc.save(`Finance_${isAR ? 'AR' : 'AP'}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    addNotification('success', 'Filtered Financial Report generated.');
  };

  const generateInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(24); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
    doc.text('NEXUS ERP', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text('123 Business Avenue, Suite 100', 14, 28);
    doc.text('Tech City, TC 94000', 14, 32);
    doc.text('billing@nexuserp.com', 14, 36);
    doc.setFontSize(18); doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 196, 20, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.id}`, 196, 28, { align: 'right' });
    doc.text(`Date Issued: ${inv.date}`, 196, 32, { align: 'right' });
    doc.text(`Due Date: ${inv.dueDate}`, 196, 36, { align: 'right' });
    doc.text(`Status: ${inv.status}`, 196, 40, { align: 'right' });
    doc.setFillColor(248, 250, 252); doc.rect(14, 48, 182, 30, 'F');
    doc.setFontSize(11); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 56);
    doc.setFontSize(12); doc.setTextColor(15, 23, 42);
    doc.text(inv.customerName, 20, 64);
    const customer = customers.find(c => c.id === inv.customerId);
    if (customer?.company) { doc.setFontSize(10); doc.setTextColor(70); doc.text(customer.company, 20, 70); }
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text(`Reference: ${inv.salesNumber || 'N/A'}`, 20, 76);
    const tableData = (inv.items || []).map(item => [
      item.description, item.quantity.toString(),
      `$${Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      `$${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ]);
    autoTable(doc, {
      startY: 85, head: [['Description', 'Qty', 'Unit Price', 'Total']], body: tableData,
      theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    const finalY = ((doc as any).lastAutoTable?.finalY ?? 120) + 10;
    doc.setFontSize(12); doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT DUE:', 130, finalY);
    doc.setFontSize(16); doc.setTextColor(79, 70, 229);
    doc.text(`$${Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });
    const footerY = 250;
    doc.setDrawColor(226, 232, 240); doc.line(14, footerY - 5, 196, footerY - 5);
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms & Instructions', 14, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Terms: ${inv.paymentTerms || 'Net 30'}. Please include Invoice # in payment reference.`, 14, footerY + 5);
    doc.text('Bank: International Nexus Bank | Account: **** 4412 | Swift: NEXUS99X', 14, footerY + 10);
    doc.setFontSize(8);
    doc.text('Thank you for your business! Generated by Nexus ERP System.', 105, 280, { align: 'center' });
    doc.save(`Invoice_${inv.id}.pdf`);
    addNotification('success', `PDF for Invoice ${inv.id} downloaded successfully.`);
    setActiveDropdownId(null);
  };

  const updateInvoiceStatus = async (id: string, newStatus: Invoice['status'], notes?: string) => {
    try {
      const updated = await financeService.updateInvoiceStatus(id, newStatus);
      const normalisedStatus = toFrontendStatus((updated as any).status ?? newStatus);
      const newHistory: StatusHistory = {
        id: Math.random().toString(36).substr(2, 9),
        status: normalisedStatus,
        changedBy: user.name,
        date: new Date().toLocaleString(),
        notes,
      };
      const updatedInstallments =
        normalisedStatus === 'Paid'
          ? (updated as any).installments?.map((inst: any) => ({ ...inst, status: 'Paid' as const, paymentDate: new Date().toISOString().split('T')[0] }))
          : (updated as any).installments;
      const invoiceWithHistory: Invoice = {
        ...(updated as any),
        status: normalisedStatus,
        installments: updatedInstallments,
        history: [newHistory, ...(((updated as any).history || []) as any[])],
      };
      setInvoices(prev => prev.map(inv => (inv.id === id ? invoiceWithHistory : inv)));
      if (setPropInvoices) setPropInvoices(prev => prev.map(inv => (inv.id === id ? invoiceWithHistory : inv)));
      if (selectedInvoice?.id === id) setSelectedInvoice(invoiceWithHistory);
      addNotification('info', `Invoice ${id} updated to ${normalisedStatus}.`);
      setActiveDropdownId(null);
    } catch (err: any) {
      console.error('Failed to update invoice status:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update invoice status.');
    }
  };

  const handlePostToLedger = async (refId: string, amount: number, desc: string, cat: string) => {
    try {
      const newEntry: Partial<GeneralLedgerEntry> = {
        date: new Date().toISOString().split('T')[0],
        description: `POSTED: ${desc}`,
        category: cat, debit: amount, credit: 0, referenceId: refId,
      };
      const created = await financeService.postToLedger(newEntry);
      setLedger([created, ...ledger]);
      addNotification('success', `Transaction ${refId} posted to General Ledger.`);
      setActiveDropdownId(null);
    } catch (err: any) {
      console.error('Failed to post to ledger:', err);
      addNotification('error', 'Failed to post to ledger');
    }
  };

  const handleAddJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entry: Partial<GeneralLedgerEntry> = {
        date: journalFormData.date || new Date().toISOString().split('T')[0],
        description: journalFormData.description || 'Manual Entry',
        category: journalFormData.category || 'Other',
        debit: Number(journalFormData.debit) || 0,
        credit: Number(journalFormData.credit) || 0,
      };
      const created = await financeService.postToLedger(entry);
      setLedger([created, ...ledger]);
      setIsJournalEntryModalOpen(false);
      addNotification('success', 'Journal entry added to ledger.');
      setJournalFormData({ date: new Date().toISOString().split('T')[0], description: '', category: 'Other', debit: 0, credit: 0 });
    } catch (err: any) {
      console.error('Failed to add journal entry:', err);
      addNotification('error', 'Failed to add journal entry');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expenseData: Partial<Expense> = {
        category: (expenseFormData.category as any) || 'Office',
        amount: Number(expenseFormData.amount) || 0,
        date: expenseFormData.date || new Date().toISOString().split('T')[0],
        description: expenseFormData.description || 'Manual Expense',
        status: 'Pending',
        linkedPO: (expenseFormData as any).linkedPO,
        linkedProject: (expenseFormData as any).linkedProject,
        costCenterId: (expenseFormData as any).costCenterId,
      };
      const newExpense = await financeService.createExpense(expenseData);
      setExpenses([newExpense, ...expenses]);
      if (setPropSetExpenses) setPropSetExpenses([newExpense, ...expenses]);
      setIsExpenseModalOpen(false);
      addNotification('success', `Expense recorded and categorized under ${newExpense.category}.`);
      setExpenseFormData({ category: 'Office', amount: 0, date: new Date().toISOString().split('T')[0], description: '', status: 'Pending', linkedPO: '', linkedProject: '', costCenterId: '' } as any);
    } catch (err: any) {
      console.error('Failed to create expense:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to create expense');
    }
  };

  const handlePayInstallment = async (
    invoiceId: string, installment: any,
    paymentType: 'cash' | 'credit_card' | 'bank_transfer' = 'bank_transfer',
    bankAccountId: number = 1
  ) => {
    try {
      const numericId =
        Number((installment as any)?.installment_id) ||
        Number((installment as any)?.numericId) ||
        Number(String((installment as any)?.id ?? '').replace(/\D/g, ''));
      if (!numericId) { addNotification('error', 'Installment ID is invalid (missing numeric backend id).'); return; }
      await financeService.payInstallment({ installment_id: numericId, payment_type: paymentType, bankAccountId });
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;
      const updatedInstallments = (invoice.installments || []).map((inst: any) => {
        const match =
          String(inst.id) === String(installment.id) ||
          Number(String(inst.id).replace(/\D/g, '')) === numericId ||
          Number((inst as any).installment_id) === numericId;
        return match ? { ...inst, status: 'Paid' as const, paymentDate: new Date().toISOString().split('T')[0] } : inst;
      });
      const allPaid = updatedInstallments.every((inst: any) => inst.status === 'Paid');
      let finalStatus = invoice.status;
      if (allPaid) {
        const updatedInvoice = await financeService.updateInvoiceStatus(invoiceId, 'Paid');
        finalStatus = toFrontendStatus((updatedInvoice as any).status ?? 'paid');
      }
      const invoiceUpdated: Invoice = {
        ...invoice,
        status: allPaid ? ('Paid' as any) : finalStatus,
        installments: updatedInstallments as any,
        history: allPaid
          ? [{ id: 'h-paid', status: 'Paid', changedBy: 'System', date: new Date().toLocaleString(), notes: 'All installments paid.' }, ...(invoice.history || [])]
          : invoice.history,
      };
      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? invoiceUpdated : inv)));
      if (setPropInvoices) setPropInvoices(prev => prev.map(inv => (inv.id === invoiceId ? invoiceUpdated : inv)));
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(invoiceUpdated);
      addNotification('success', 'Installment paid successfully.');
    } catch (err: any) {
      console.error('Failed to pay installment:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to pay installment.');
    }
  };

  const handleAddItemToInvoice = () => {
    if (!newItem.description || !newItem.quantity || newItem.unitPrice === undefined) return;
    const item: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
      total: Number(newItem.quantity) * Number(newItem.unitPrice),
    };
    const updatedItems = [...(formData.items || []), item];
    setFormData({ ...formData, items: updatedItems, amount: updatedItems.reduce((s, i) => s + (Number(i.total) || 0), 0) });
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setSelectedInvoiceProductId('');
  };

  const handleInvoiceProductSelect = (productId: string) => {
    setSelectedInvoiceProductId(productId);
    if (!productId) {
      setNewItem(prev => ({ ...prev, description: '', unitPrice: 0 }));
      return;
    }
    const product = inventory.find(p => String((p as any).id) === productId);
    if (product) {
      setNewItem(prev => ({
        ...prev,
        description: product.name,
        unitPrice: Number((product as any).price ?? (product as any).unit_price ?? 0),
      }));
    }
  };

  const handleSalesOrderSelect = (soId: string) => {
    const so = salesOrders.find(o => o.id === soId);
    if (so) {
      setFormData(prev => ({
        ...prev,
        salesNumber: so.id,
        customerId: so.customerId,
        customerName: so.customerName,
        salesperson: so.salesperson || user.name,
        items: (so.items || []).map(item => ({ ...item })),
        amount: Number((so as any).totalAmount) || Number((so as any).amount) || 0,
      }));
      addNotification('info', `Linked to Sales Order ${so.id}. Populated ${(so.items || []).length} items.`);
    } else {
      setFormData(prev => ({ ...prev, salesNumber: '', items: [], amount: 0 }));
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent, initialStatus: Invoice['status'] = 'Draft') => {
    e.preventDefault();
    if (!formData.salesNumber) { addNotification('error', 'Please link a Sales Order before creating the invoice.'); return; }
    const salesOrderId = Number(String(formData.salesNumber).replace(/\D/g, ''));
    if (!salesOrderId) { addNotification('error', 'Invalid Sales Order reference.'); return; }
    const payload: CreateInvoicePayload = {
      sales_order_id: salesOrderId,
      payment:
        formData.paymentMode === 'Cash'
          ? { type: 'full' }
          : { type: 'installments', months: Number(formData.installmentCount) || 1, ...(Number(formData.downPayment) > 0 && { payment_down: Number(formData.downPayment) }) },
    };
    try {
      const created = await financeService.createInvoice(payload);
      const baseInvoice: Invoice = { ...(created as any), status: toFrontendStatus((created as any).status ?? 'draft') };
      if (initialStatus === 'Awaiting Approval') {
        const updated = await financeService.updateInvoiceStatus(baseInvoice.id, 'Awaiting Approval');
        const finalInvoice: Invoice = { ...(updated as any), status: toFrontendStatus((updated as any).status ?? 'awaiting_approval') };
        setInvoices(prev => [finalInvoice, ...prev]);
        if (setPropInvoices) setPropInvoices(prev => [finalInvoice, ...prev]);
      } else {
        setInvoices(prev => [baseInvoice, ...prev]);
        if (setPropInvoices) setPropInvoices(prev => [baseInvoice, ...prev]);
      }
      setIsModalOpen(false);
      addNotification('success', `Invoice ${baseInvoice.id} created successfully.`);
      setFormData({ customerId: '', customerName: '', items: [], amount: 0, date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Draft', salesperson: user.name, installmentCount: 1, downPayment: 0, paymentMode: 'Cash', paymentTerms: 'Net 30', salesNumber: '' });
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to create invoice.');
    }
  };

  const handleUpdateExpenseStatus = async (id: string, status: Expense['status']) => {
    try {
      const expense = expenses.find(exp => exp.id === id);
      if (!expense) return;
      const updated = await financeService.updateExpense(id, { ...expense, status } as any);
      const updatedList = expenses.map(exp => (exp.id === id ? updated : exp));
      setExpenses(updatedList);
      if (setPropSetExpenses) setPropSetExpenses(updatedList);
      addNotification('success', `Expense ${id} status updated to ${status}`);
    } catch (err: any) {
      console.error('Failed to update expense status:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update expense status');
    }
    setActiveDropdownId(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense?')) { setActiveDropdownId(null); return; }
    try {
      await financeService.deleteExpense(id);
      const filtered = expenses.filter(exp => exp.id !== id);
      setExpenses(filtered);
      if (setPropSetExpenses) setPropSetExpenses(filtered);
      addNotification('info', 'Expense deleted');
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to delete expense');
    }
    setActiveDropdownId(null);
  };

  const handleUpdatePayableStatus = async (id: string, status: Payable['status']) => {
    try {
      const payable = payables.find(p => p.id === id);
      if (!payable) return;
      const updated = await financeService.updatePayable(id, { ...payable, status } as any);
      const updatedPayables = payables.map(p => (p.id === id ? updated : p));
      setPayables(updatedPayables);
      if (setPropPayables) setPropPayables(updatedPayables);
      addNotification('success', `Payable ${id} status updated to ${status}`);
    } catch (err: any) {
      console.error('Failed to update payable status:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update payable status');
    }
    setActiveDropdownId(null);
  };

  const handleDeletePayable = async (id: string) => {
    if (!window.confirm('Delete this payable entry?')) { setActiveDropdownId(null); return; }
    try {
      await financeService.deletePayable(id);
      const filtered = payables.filter(p => p.id !== id);
      setPayables(filtered);
      if (setPropPayables) setPropPayables(filtered);
      addNotification('info', 'Payable entry deleted');
    } catch (err: any) {
      console.error('Failed to delete payable:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to delete payable');
    }
    setActiveDropdownId(null);
  };

  const handleToggleRecurring = (id: string) => {
    setRecurringInvoices(recurringInvoices.map(r => (r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r)));
    addNotification('info', `Recurring schedule ${id} updated.`);
    setActiveDropdownId(null);
  };

  const openCreateCostCenterModal = () => {
    setEditingCostCenter(null);
    setCostCenterFormData({ name: '', description: '', parent_id: null, is_active: true });
    setIsCostCenterModalOpen(true);
  };

  const openEditCostCenterModal = (cc: CostCenter) => {
    setEditingCostCenter(cc);
    setCostCenterFormData({
      name: cc.name,
      description: (cc as any).description || '',
      parent_id: (cc as any).parent_id ?? null,
      is_active: (cc as any).is_active !== undefined ? Boolean((cc as any).is_active) : true,
    });
    setIsCostCenterModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleSaveCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCostCenter) {
        const payload: UpdateCostCenterPayload = {
          name: costCenterFormData.name,
          parent_id: costCenterFormData.parent_id,
          is_active: costCenterFormData.is_active,
          ...(costCenterFormData.description && costCenterFormData.description.trim().length > 0
            ? { description: costCenterFormData.description.trim() }
            : {}),
        };
        const apiResult = await financeService.updateCostCenter(editingCostCenter.id, payload);
        const merged: CostCenter = {
          ...editingCostCenter,
          ...(apiResult as any),
          name: costCenterFormData.name,
          description: costCenterFormData.description,
          parent_id: costCenterFormData.parent_id,
          is_active: costCenterFormData.is_active,
        } as any;
        const updatedList = costCenters.map(cc =>
          String(cc.id) === String(editingCostCenter.id) ? merged : cc
        );
        setCostCenters(updatedList);
        if (setPropCostCenters) setPropCostCenters(updatedList);
        addNotification('success', `Cost Center "${merged.name}" updated successfully.`);
      } else {
        const created = await financeService.createCostCenter({
          name: costCenterFormData.name,
          parent_id: costCenterFormData.parent_id,
          is_active: costCenterFormData.is_active,
          ...(costCenterFormData.description && costCenterFormData.description.trim().length > 0
            ? { description: costCenterFormData.description.trim() }
            : {}),
        });
        const merged: CostCenter = {
          ...(created as any),
          name: costCenterFormData.name,
          description: costCenterFormData.description,
          parent_id: costCenterFormData.parent_id,
          is_active: costCenterFormData.is_active,
        } as any;
        const newList = [merged, ...costCenters];
        setCostCenters(newList);
        if (setPropCostCenters) setPropCostCenters(newList);
        addNotification('success', `Cost Center "${merged.name}" created successfully.`);
      }
      setIsCostCenterModalOpen(false);
      setEditingCostCenter(null);
    } catch (err: any) {
      console.error('Failed to save cost center:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to save cost center.');
    }
  };

  const handleToggleCostCenterStatus = async (cc: CostCenter) => {
    try {
      const newActive = !(cc as any).is_active;
      const apiResult = await financeService.updateCostCenter(cc.id, { is_active: newActive });
      const merged: CostCenter = {
        ...cc,
        ...(apiResult as any),
        is_active: newActive,
      } as any;
      const updatedList = costCenters.map(c =>
        String(c.id) === String(cc.id) ? merged : c
      );
      setCostCenters(updatedList);
      if (setPropCostCenters) setPropCostCenters(updatedList);
      addNotification('info', `Cost Center "${cc.name}" ${newActive ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      console.error('Failed to toggle cost center:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update cost center.');
    }
    setActiveDropdownId(null);
  };

  const handleDeleteCostCenter = async (id: string | number) => {
    if (!window.confirm('Delete this cost center? This cannot be undone.')) { setActiveDropdownId(null); return; }
    try {
      await financeService.deleteCostCenter(id);
      const filtered = costCenters.filter(cc => String(cc.id) !== String(id));
      setCostCenters(filtered);
      if (setPropCostCenters) setPropCostCenters(filtered);
      addNotification('info', 'Cost Center deleted.');
    } catch (err: any) {
      console.error('Failed to delete cost center:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to delete cost center.');
    }
    setActiveDropdownId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSalesNumberFilter('All');
    setPaymentTermsFilter('All');
    setStatusFilter('All');
    setCustomerFilter('All');
    setVendorFilter('All');
    setProductFilter('All');
    setDateRange({ start: '', end: '' });
  };

  const getTranslatedStatus = (status: string) => {
    const key = status.toLowerCase().replace('awaiting approval', 'awaiting');
    return (t(`finance.status.${key}`) as any) || status;
  };

  const getCustomer = (id: string | undefined) => customers.find(c => c.id === id);

  const duplicateInvoice = async (inv: Invoice) => {
    const salesOrderId: number = Number((inv as any).sales_order_id ?? (inv as any).salesOrderId ?? String(inv.salesNumber || '').replace(/\D/g, ''));
    if (!salesOrderId) { addNotification('error', 'Cannot duplicate – no Sales Order linked to this invoice.'); return; }
    const isInstallments = ((inv as any).installments?.length ?? 0) > 1;
    const months = isInstallments ? Math.max(1, ((inv as any).installments?.length ?? 2) - 1) : undefined;
    const downPayment = isInstallments ? Number(((inv as any).installments?.[0] as any)?.payment_down ?? 0) || undefined : undefined;
    const payload: CreateInvoicePayload = {
      sales_order_id: salesOrderId,
      payment: isInstallments ? { type: 'installments', months, ...(downPayment ? { payment_down: downPayment } : {}) } : { type: 'full' },
    };
    try {
      const duplicated = await financeService.createInvoice(payload);
      const normalisedInvoice: Invoice = { ...(duplicated as any), status: toFrontendStatus((duplicated as any).status ?? 'draft') };
      setInvoices(prev => [normalisedInvoice, ...prev]);
      if (setPropInvoices) setPropInvoices(prev => [normalisedInvoice, ...prev]);
      addNotification('success', `Invoice duplicated: ${normalisedInvoice.id}`);
      setActiveDropdownId(null);
    } catch (err: any) {
      console.error('Failed to duplicate invoice:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to duplicate invoice.');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
        <StatsCard
          title={t('finance.kpi.pending_invoices')}
          value={`$${financeMetrics.totalPending.toLocaleString()}`}
          trend={t('finance.kpi.receivables_trend')}
          trendUp={false}
          icon={<Clock size={20} />}
          color="bg-amber-500"
        />
        <StatsCard
          title={t('finance.kpi.payables')}
          value={`$${(payables || []).filter(p => p.status !== 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}`}
          trend={t('finance.kpi.unpaid_trend')}
          trendUp={false}
          icon={<Wallet size={20} />}
          color="bg-rose-500"
        />
        <StatsCard
          title={t('finance.kpi.collections')}
          value={`$${financeMetrics.recentPayments.toLocaleString()}`}
          trend={t('finance.kpi.this_month')}
          trendUp={true}
          icon={<DollarSign size={20} />}
          color="bg-emerald-500"
        />
      </div>

      {/* Header + Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">{t('finance.title')}</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto custom-scrollbar">
              <button onClick={() => setViewMode('invoices')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'invoices' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('finance.tabs.invoices')}</button>
              <button onClick={() => setViewMode('recurring')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'recurring' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('finance.tabs.recurring')}</button>
              <button onClick={() => setViewMode('payables')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'payables' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('finance.tabs.payables')}</button>
              <button onClick={() => setViewMode('expenses')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'expenses' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('finance.tabs.expenses')}</button>
              <button onClick={() => setViewMode('cost center')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'cost center' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Cost Center</button>
              <button onClick={() => setViewMode('ledger')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${viewMode === 'ledger' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('finance.tabs.ledger')}</button>
            </div>
          </div>
          <div className="flex gap-2">
            {(viewMode === 'invoices' || viewMode === 'payables') && (
              <button
                onClick={generateFilteredFinanceReport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <FileBarChart size={18} />
                Generate Report
              </button>
            )}
            <button
              onClick={() => {
                if (viewMode === 'invoices') setIsModalOpen(true);
                else if (viewMode === 'expenses') setIsExpenseModalOpen(true);
                else if (viewMode === 'payables') setIsPayableModalOpen(true);
                else if (viewMode === 'ledger') setIsJournalEntryModalOpen(true);
                else if (viewMode === 'cost center') openCreateCostCenterModal();
                else addNotification('info', 'Generation automated via recurring scheduler.');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all text-center"
            >
              <Plus size={16} />
              {viewMode === 'invoices'
                ? t('finance.buttons.create_invoice')
                : viewMode === 'expenses'
                ? t('finance.buttons.add_expense')
                : viewMode === 'ledger'
                ? t('finance.buttons.create_journal')
                : viewMode === 'cost center'
                ? 'Add Cost Center'
                : t('finance.buttons.create_payable')}
            </button>
          </div>
        </div>

        {(isLoadingInvoices || isLoadingExpenses || isLoadingPayables || isLoadingLedger || isLoadingCostCenters) && (
          <div className="mt-3 text-xs text-slate-400">
            Loading: {isLoadingInvoices ? 'Invoices ' : ''}{isLoadingExpenses ? 'Expenses ' : ''}{isLoadingPayables ? 'Payables ' : ''}{isLoadingLedger ? 'Ledger ' : ''}{isLoadingCostCenters ? 'Cost Centers ' : ''}
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 bg-slate-50/50">
          <div className="self-start w-full sm:w-[220px] shrink-0">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={viewMode === 'cost center' ? 'Search cost centers...' : t(`finance.search.${viewMode}`)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {(viewMode === 'invoices' || viewMode === 'payables') && (
            <div className="flex flex-wrap gap-2">
              {viewMode === 'invoices' && (
                <div className="flex items-center gap-2">
                  <Link size={16} className="text-slate-400" />
                  <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]" value={salesNumberFilter} onChange={e => setSalesNumberFilter(e.target.value)}>
                    <option value="All">{t('finance.table.reference')}: {t('tasks.status_all')}</option>
                    {uniqueSalesNumbers.map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                {viewMode === 'invoices' ? <UserIcon size={16} className="text-slate-400" /> : <Building2 size={16} className="text-slate-400" />}
                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]" value={viewMode === 'invoices' ? customerFilter : vendorFilter} onChange={e => (viewMode === 'invoices' ? setCustomerFilter(e.target.value) : setVendorFilter(e.target.value))}>
                  <option value="All">{viewMode === 'invoices' ? t('finance.filters.all_customers') : t('finance.filters.all_vendors')}</option>
                  {(viewMode === 'invoices' ? uniqueInvoiceCustomers : uniquePayableVendors).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-slate-400" />
                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
                  <option value="All">All Products</option>
                  {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-400" />
                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-[140px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">{t('finance.filters.all_statuses')}</option>
                  <option value="Draft">{t('finance.status.draft')}</option>
                  <option value="Awaiting Approval">{t('finance.status.awaiting')}</option>
                  <option value="Approved">{t('finance.status.approved')}</option>
                  <option value="Paid">{t('finance.status.paid')}</option>
                  <option value="Rejected">{t('finance.status.rejected')}</option>
                  <option value="Overdue">{t('finance.status.overdue')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} title={t('finance.filters.start_date')} />
                <span className="text-slate-400">-</span>
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} title={t('finance.filters.end_date')} />
              </div>
              {(searchTerm || salesNumberFilter !== 'All' || paymentTermsFilter !== 'All' || statusFilter !== 'All' || customerFilter !== 'All' || vendorFilter !== 'All' || productFilter !== 'All' || dateRange.start || dateRange.end) && (
                <button onClick={clearFilters} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                  <XCircle size={16} />{t('common.clear')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
          {/* INVOICES TABLE */}
          {viewMode === 'invoices' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.invoice_num')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.customer_sales')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">{t('finance.table.ref_terms')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">{t('finance.table.installments')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.amount')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.status')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const customer = getCustomer(inv.customerId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-mono text-indigo-600 text-sm font-bold">{inv.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{inv.customerName}</div>
                        {customer?.company && <div className="text-xs text-slate-500 font-medium">{customer.company}</div>}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><UserIcon size={10} /> {inv.salesperson}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {inv.salesNumber ? <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5"><Link size={10} /> {inv.salesNumber}</span> : <span className="text-[10px] text-slate-400 italic">No Ref</span>}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{inv.paymentTerms || 'Net 30'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {(inv as any).installments && (inv as any).installments.length > 1 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase flex items-center gap-1 w-fit mx-auto border border-amber-100"><Split size={10} /> {(inv as any).installments.length} Slots</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase flex items-center gap-1 w-fit mx-auto border border-emerald-100"><Banknote size={10} /> {t('finance.modal.full_cash')}</span>
                        )}
                      </td>
                      <td className="p-4 font-black text-slate-800">${Number(inv.amount).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : inv.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-700 border-amber-100' : inv.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-100' : inv.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {getTranslatedStatus(inv.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right relative">
                        <button onClick={() => setActiveDropdownId(activeDropdownId === inv.id ? null : inv.id)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all shadow-sm group-hover:shadow-indigo-100 border border-transparent group-hover:border-slate-100">
                          <MoreHorizontal size={18} />
                        </button>
                        {activeDropdownId === inv.id && (
                          <ActionDropdown onClose={() => setActiveDropdownId(null)}>
                            <button onClick={() => { setSelectedInvoice(inv); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Eye size={14} /> {t('finance.actions.view_details')}</button>
                            {onNavigateToCRM && <button onClick={() => { onNavigateToCRM(); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Users size={14} /> {t('finance.actions.view_in_crm')}</button>}
                            <button onClick={() => generateInvoicePDF(inv)} className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-medium"><Download size={14} /> {t('finance.actions.download_pdf')}</button>
                            <button onClick={() => updateInvoiceStatus(inv.id, 'Paid')} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium"><CheckCircle size={14} /> {t('finance.actions.mark_paid')}</button>
                            <button onClick={() => handlePostToLedger(inv.id, Number(inv.amount), `Invoice to ${inv.customerName}`, 'A/R')} className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"><BookOpen size={14} /> {t('finance.actions.post_ledger')}</button>
                            <div className="border-t my-1" />
                            <button onClick={() => duplicateInvoice(inv)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Copy size={14} /> {t('finance.actions.duplicate')}</button>
                            <button onClick={async () => { if (window.confirm('Delete invoice?')) { try { await financeService.deleteInvoice(inv.id); const filtered = invoices.filter(i => i.id !== inv.id); setInvoices(filtered); if (setPropInvoices) setPropInvoices(filtered); addNotification('info', 'Invoice deleted'); } catch (err: any) { addNotification('error', err?.response?.data?.message || 'Failed to delete invoice'); } } setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 size={14} /> {t('finance.actions.void_delete')}
                            </button>
                          </ActionDropdown>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No invoices found matching your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* LEDGER */}
          {viewMode === 'ledger' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-indigo-600" onClick={() => handleLedgerSort('date')}><div className="flex items-center gap-1">{t('common.date')} <ArrowUpDown size={12} /></div></th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-indigo-600" onClick={() => handleLedgerSort('description')}><div className="flex items-center gap-1">{t('finance.table.description')} <ArrowUpDown size={12} /></div></th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-indigo-600" onClick={() => handleLedgerSort('category')}><div className="flex items-center gap-1">{t('finance.table.category')} <ArrowUpDown size={12} /></div></th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.ref_id')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.debit')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.credit')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.balance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ledgerWithBalance.map((entry: any, idx: number) => (
                  <tr key={entry.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono">{entry.date}</td>
                    <td className="p-4 font-medium text-slate-800">{entry.description}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">{entry.category}</span></td>
                    <td className="p-4 text-slate-400 font-mono text-xs">{entry.referenceId || entry.id}</td>
                    <td className="p-4 text-right text-emerald-600 font-bold">{Number(entry.debit) > 0 ? `$${Number(entry.debit).toLocaleString()}` : '-'}</td>
                    <td className="p-4 text-right text-rose-600 font-bold">{Number(entry.credit) > 0 ? `$${Number(entry.credit).toLocaleString()}` : '-'}</td>
                    <td className="p-4 text-right font-black text-slate-900 bg-slate-50/30">${Number(entry.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {ledgerWithBalance.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No ledger entries match your criteria.</td></tr>}
              </tbody>
            </table>
          )}

          {/* RECURRING */}
          {viewMode === 'recurring' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.schedule_id')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('crm.table.customer')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">{t('finance.table.frequency')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.next_gen')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.amount')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.status')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecurring.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-mono text-indigo-600 text-sm font-bold">{r.id}</td>
                    <td className="p-4 font-medium text-slate-800">{r.customerName}</td>
                    <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">{r.frequency}</span></td>
                    <td className="p-4 text-sm text-slate-500">{r.nextDueDate}</td>
                    <td className="p-4 font-black text-slate-800">${Number(r.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${r.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>{getTranslatedStatus(r.status)}</span>
                    </td>
                    <td className="p-4 text-right relative">
                      <button onClick={() => setActiveDropdownId(activeDropdownId === r.id ? null : r.id)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"><MoreHorizontal size={18} /></button>
                      {activeDropdownId === r.id && (
                        <ActionDropdown onClose={() => setActiveDropdownId(null)}>
                          <button onClick={() => handleToggleRecurring(r.id)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                            {r.status === 'Active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                            {r.status === 'Active' ? t('finance.actions.pause_schedule') : t('finance.actions.resume_schedule')}
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><FilePenLine size={14} /> {t('finance.actions.edit_terms')}</button>
                          <button onClick={() => { if (window.confirm('Stop recurring billing for this customer?')) setRecurringInvoices(recurringInvoices.filter(rec => rec.id !== r.id)); setActiveDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> {t('common.delete')}</button>
                        </ActionDropdown>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRecurring.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No recurring schedules found.</td></tr>}
              </tbody>
            </table>
          )}

          {/* EXPENSES */}
          {viewMode === 'expenses' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.date')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.category')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.desc_link')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.amount')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('finance.table.status')}</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('finance.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm text-slate-600">{exp.date}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-100">{exp.category}</span></td>
                    <td className="p-4">
                      <div className="text-sm text-slate-800 font-medium">{exp.description}</div>
                      <div className="flex gap-2 mt-1">
                        {exp.linkedPO && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"><ShoppingCart size={10} /> {exp.linkedPO}</span>}
                        {exp.linkedProject && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold"><FolderOpen size={10} /> {exp.linkedProject}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-800">${Number(exp.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : exp.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {getTranslatedStatus(exp.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right relative">
                      <button onClick={() => setActiveDropdownId(activeDropdownId === exp.id ? null : exp.id)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"><MoreHorizontal size={18} /></button>
                      {activeDropdownId === exp.id && (
                        <ActionDropdown onClose={() => setActiveDropdownId(null)}>
                          {exp.status === 'Pending' && <button onClick={() => handleUpdateExpenseStatus(exp.id, 'Approved')} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"><ThumbsUp size={14} /> {t('finance.actions.approve_expense')}</button>}
                          {exp.status === 'Approved' && <button onClick={() => handleUpdateExpenseStatus(exp.id, 'Paid')} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium"><CheckCircle size={14} /> {t('finance.actions.confirm_payment')}</button>}
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Download size={14} /> {t('finance.actions.download_receipt')}</button>
                          <button onClick={() => handlePostToLedger(exp.id, Number(exp.amount), exp.description, 'Expense')} className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"><BookOpen size={14} /> {t('finance.actions.post_gl')}</button>
                          <div className="border-t my-1" />
                          <button onClick={() => handleDeleteExpense(exp.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> {t('finance.actions.delete_entry')}</button>
                        </ActionDropdown>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* PAYABLES */}
          {viewMode === 'payables' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase">{t('finance.table.due_date')}</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase">{t('finance.table.vendor')}</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase">{t('finance.table.reference')}</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase">{t('finance.table.amount')}</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase">{t('finance.table.status')}</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 uppercase text-right">{t('finance.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredPayables || []).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm text-slate-600 font-mono">{(p as any).dueDate}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.vendorName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{p.description}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{(p as any).invoiceReference || '-'}</td>
                    <td className="p-4 font-black text-slate-800">${Number(p.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : p.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-700 border-amber-100' : p.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-100' : p.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {getTranslatedStatus(p.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right relative">
                      <button onClick={() => setActiveDropdownId(activeDropdownId === p.id ? null : p.id)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"><MoreHorizontal size={18} /></button>
                      {activeDropdownId === p.id && (
                        <ActionDropdown onClose={() => setActiveDropdownId(null)}>
                          {p.status === 'Awaiting Approval' && <button onClick={() => handleUpdatePayableStatus(p.id, 'Approved')} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"><ThumbsUp size={14} /> {t('finance.actions.approve_payable')}</button>}
                          {p.status === 'Approved' && <button onClick={() => handleUpdatePayableStatus(p.id, 'Paid')} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium"><CreditCard size={14} /> {t('finance.actions.pay_now')}</button>}
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><History size={14} /> {t('finance.actions.view_timeline')}</button>
                          <div className="border-t my-1" />
                          <button onClick={() => handleDeletePayable(p.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> {t('finance.actions.delete_bill')}</button>
                        </ActionDropdown>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayables.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No payables found matching your filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* COST CENTER TABLE */}
          {viewMode === 'cost center' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Name / Code</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">
                    <div className="flex items-center gap-1 justify-center"><Network size={12} /> Parent</div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Linked Expenses</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCostCenters.map(cc => {
                  const parentName = getParentName((cc as any).parent_id);
                  const expenseCount = getCostCenterExpenseCount(cc.id);
                  const isActive = (cc as any).is_active === undefined ? true : Boolean((cc as any).is_active);
                  const dropdownId = `cc-${cc.id}`;
                  return (
                    <tr key={cc.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers size={14} className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{cc.name}</div>
                            {(cc as any).code && <div className="text-[10px] font-mono text-indigo-500 font-bold mt-0.5">{(cc as any).code}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-500 line-clamp-2">
                          {(cc as any).description || <span className="italic text-slate-300">No description</span>}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100">
                            <Network size={10} /> {parentName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Root</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {expenseCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-100">
                            <Receipt size={10} /> {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right relative">
                        <button onClick={() => setActiveDropdownId(activeDropdownId === dropdownId ? null : dropdownId)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all border border-transparent group-hover:border-slate-100">
                          <MoreHorizontal size={18} />
                        </button>
                        {activeDropdownId === dropdownId && (
                          <ActionDropdown onClose={() => setActiveDropdownId(null)}>
                            <button onClick={() => openEditCostCenterModal(cc)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                              <Edit2 size={14} /> Edit
                            </button>
                            <button onClick={() => handleToggleCostCenterStatus(cc)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                              {isActive ? <ToggleLeft size={14} className="text-amber-500" /> : <ToggleRight size={14} className="text-emerald-500" />}
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="border-t my-1" />
                            <button onClick={() => handleDeleteCostCenter(cc.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 size={14} /> Delete
                            </button>
                          </ActionDropdown>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredCostCenters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Layers size={32} className="text-slate-200" />
                        <p className="italic">{searchTerm ? 'No cost centers match your search.' : 'No cost centers yet. Create one to get started.'}</p>
                        {!searchTerm && (
                          <button onClick={openCreateCostCenterModal} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                            <Plus size={14} /> Add Cost Center
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── COST CENTER MODAL ──────────────────────────────────────────────────── */}
      {isCostCenterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers size={20} className="text-indigo-600" />
                {editingCostCenter ? 'Edit Cost Center' : 'New Cost Center'}
              </h3>
              <button onClick={() => setIsCostCenterModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSaveCostCenter} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="e.g. Marketing Department" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm" value={costCenterFormData.name} onChange={e => setCostCenterFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} placeholder="Optional description…" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm resize-none" value={costCenterFormData.description || ''} onChange={e => setCostCenterFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Network size={14} className="text-slate-400" /> Parent Cost Center</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500/20" value={costCenterFormData.parent_id ?? ''} onChange={e => setCostCenterFormData(prev => ({ ...prev, parent_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">None (Root Level)</option>
                  {costCenters.filter(cc => !editingCostCenter || cc.id !== editingCostCenter.id).map(cc => (
                    <option key={cc.id} value={String(cc.id)}>{cc.name}{(cc as any).code ? ` (${(cc as any).code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Active Status</p>
                  <p className="text-xs text-slate-400">Inactive cost centers cannot be assigned to new expenses.</p>
                </div>
                <button type="button" onClick={() => setCostCenterFormData(prev => ({ ...prev, is_active: !prev.is_active }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${costCenterFormData.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${costCenterFormData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {editingCostCenter && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">Editing: <span className="font-black">{editingCostCenter.name}</span>{(editingCostCenter as any).code && <span className="ml-1 font-mono">({(editingCostCenter as any).code})</span>}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">{getCostCenterExpenseCount(editingCostCenter.id)} expense(s) currently linked to this cost center.</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCostCenterModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-sm transition-all active:scale-95">{editingCostCenter ? 'Save Changes' : 'Create Cost Center'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Wallet size={20} className="text-indigo-600" />{t('finance.modal.expense_title')}</h3>
              <button onClick={() => setIsExpenseModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.trans_date')}</label>
                  <input required type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={expenseFormData.date as any} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.category')}</label>
                  <select required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20" value={expenseFormData.category as any} onChange={e => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}>
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.description')}</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Server hosting renewal" value={expenseFormData.description as any} onChange={e => setExpenseFormData({ ...expenseFormData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.table.amount')} ($)</label>
                <input required type="number" step="0.01" min="0.01" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={Number(expenseFormData.amount || 0)} onChange={e => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })} />
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('finance.modal.expense_link')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><ShoppingCart size={12} /> {t('finance.modal.po')}</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={(expenseFormData as any).linkedPO || ''} onChange={e => setExpenseFormData({ ...expenseFormData, linkedPO: e.target.value } as any)}>
                      <option value="">None</option>
                      {(purchaseOrders || []).map((po: any) => <option key={po.id} value={po.id}>{po.id} - {po.vendorName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><FolderOpen size={12} /> {t('finance.modal.project')}</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Q4 Marketing" value={(expenseFormData as any).linkedProject || ''} onChange={e => setExpenseFormData({ ...expenseFormData, linkedProject: e.target.value } as any)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><Layers size={12} /> {t('finance.modal.cost_center')}</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={(expenseFormData as any).costCenterId || ''} onChange={e => setExpenseFormData({ ...expenseFormData, costCenterId: e.target.value } as any)}>
                    <option value="">None</option>
                    {(costCenters || []).filter(cc => (cc as any).is_active !== false).map(cc => <option key={cc.id} value={cc.id}>{cc.name}{(cc as any).code ? ` (${(cc as any).code})` : ''}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg mt-4 transition-all active:scale-95">{t('finance.modal.record_btn')}</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE JOURNAL ENTRY MODAL */}
      {isJournalEntryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{t('finance.modal.journal_title')}</h3>
              <button onClick={() => setIsJournalEntryModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAddJournalEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.trans_date')}</label>
                <input required type="date" className="w-full px-3 py-2 border rounded-lg" value={journalFormData.date as any} onChange={e => setJournalFormData({ ...journalFormData, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.description')}</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Manual Adjustment" value={journalFormData.description as any} onChange={e => setJournalFormData({ ...journalFormData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.category')}</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white" value={journalFormData.category as any} onChange={e => setJournalFormData({ ...journalFormData, category: e.target.value })}>
                  <option value="Equity">Equity</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.debit')}</label>
                  <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={Number(journalFormData.debit || 0)} onChange={e => setJournalFormData({ ...journalFormData, debit: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.credit')}</label>
                  <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={Number(journalFormData.credit || 0)} onChange={e => setJournalFormData({ ...journalFormData, credit: Number(e.target.value) })} />
                </div>
              </div>
              <p className="text-xs text-slate-400 italic">Balance will be calculated automatically in the ledger view.</p>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg mt-2">{t('common.save')}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE INVOICE MODAL ───────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200" dir="ltr">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">{t('finance.modal.invoice_title')}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={(e) => handleSaveInvoice(e, 'Awaiting Approval')} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

              {/* Link Sales Order */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <Link size={16} /> {t('finance.modal.link_so')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.salesNumber as any}
                  onChange={(e) => handleSalesOrderSelect(Number(e.target.value) as any)}
                >
                  <option value="">-- {t('finance.modal.select_so')} --</option>
                  {salesOrders
                    .filter(so => (so as any).status !== 'Cancelled')
                    .map(so => {
                      const isCompleted = (so as any).status === 'completed';
                      return (
                        <option key={so.id} value={so.id} disabled={!isCompleted}>
                          {so.id} - {so.customerName} (${Number((so as any).totalAmount || 0).toLocaleString()})
                          {!isCompleted ? ` - Status: ${(so as any).status}` : ''}
                        </option>
                      );
                    })
                  }
                </select>
                {formData.salesNumber && (
                  <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2">Auto-populated from {formData.salesNumber}</p>
                )}
              </div>

              {/* Customer + Salesperson + Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.customer')}</label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white" value={formData.customerId as any} onChange={e => { const customer = getCustomer(e.target.value); setFormData({ ...formData, customerId: e.target.value, customerName: customer?.name || '' }); }}>
                    <option value="">-- {t('finance.modal.customer')} --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                  </select>
                  {formData.customerId && <p className="text-xs text-indigo-600 mt-1 font-medium italic">{customers.find(c => c.id === formData.customerId)?.company}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.salesperson')}</label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white" value={formData.salesperson as any} onChange={e => setFormData({ ...formData, salesperson: e.target.value })}>
                    {SALES_TEAM.map(person => <option key={person} value={person}>{person}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.issue_date')}</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.date as any} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.payment_terms')}</label>
                  <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white" value={formData.paymentTerms as any} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value as any })}>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('finance.modal.due_date')}</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={formData.dueDate as any} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
              </div>

              {/* Payment Structure */}
              <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Calculator size={16} /> {t('finance.modal.payment_struct')}</h4>
                  <div className="flex bg-white p-1 rounded-lg border border-indigo-200 shadow-sm">
                    <button type="button" onClick={() => setFormData({ ...formData, paymentMode: 'Cash' })} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${formData.paymentMode === 'Cash' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{t('finance.modal.full_cash')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, paymentMode: 'Installments' })} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${formData.paymentMode === 'Installments' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{t('finance.modal.installments')}</button>
                  </div>
                </div>
                {formData.paymentMode === 'Installments' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t('finance.modal.down_payment')}</label>
                      <input type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg" value={Number(formData.downPayment || 0)} onChange={e => setFormData({ ...formData, downPayment: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t('finance.modal.period')}</label>
                      <select className="w-full px-3 py-2 border rounded-lg bg-white" value={Number(formData.installmentCount || 1)} onChange={e => setFormData({ ...formData, installmentCount: Number(e.target.value) })}>
                        {[1, 2, 3, 4, 6, 12, 18, 24].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Month' : 'Months'}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {formData.amount && Number(formData.amount) > 0 && formData.paymentMode === 'Installments' && (
                  <div className="p-3 bg-white/80 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <span className="text-xs text-indigo-700 font-medium italic">{t('finance.modal.monthly')}:</span>
                    <span className="text-sm font-black text-indigo-900">${((Number(formData.amount) - (Number(formData.downPayment) || 0)) / (Number(formData.installmentCount) || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} /mo</span>
                  </div>
                )}
              </div>

              {/* ── LINE ITEMS ──────────────────────────────────────────────────── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Receipt size={14} /> {t('finance.modal.line_items')}
                  </h4>
                  {(formData.items || []).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black">
                      {(formData.items || []).length} item{(formData.items || []).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Input row */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Product</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={selectedInvoiceProductId}
                      onChange={e => handleInvoiceProductSelect(e.target.value)}
                    >
                      <option value="">Select product…</option>
                      {inventory.map(p => (
                        <option key={String((p as any).id)} value={String((p as any).id)}>
                          {p.name}
                          {(p as any).price != null ? ` — $${Number((p as any).price).toFixed(2)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={Number(newItem.quantity || 1)}
                      onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('finance.modal.rate')} ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={Number(newItem.unitPrice || 0)}
                      onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-3">
                    <button
                      type="button"
                      onClick={handleAddItemToInvoice}
                      disabled={!selectedInvoiceProductId}
                      className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 h-[38px] flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} /> {t('common.add')}
                    </button>
                  </div>
                </div>

                {/* ✅ Items table — appears as soon as first item is added */}
                {(formData.items || []).length > 0 ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200">
                      <div className="col-span-5 text-[10px] font-bold text-slate-500 uppercase">{t('finance.modal.description')}</div>
                      <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase text-center">Qty</div>
                      <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase text-right">Unit Price</div>
                      <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase text-right">Total</div>
                      <div className="col-span-1" />
                    </div>

                    {/* Item rows */}
                    {(formData.items || []).map((item, idx) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50 transition-colors ${idx !== (formData.items || []).length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="col-span-5 text-sm font-medium text-slate-800 truncate" title={item.description}>
                          {item.description}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                            ×{item.quantity}
                          </span>
                        </div>
                        <div className="col-span-2 text-right text-sm text-slate-500">
                          ${Number(item.unitPrice).toFixed(2)}
                        </div>
                        <div className="col-span-2 text-right text-sm font-black text-slate-900">
                          ${Number(item.total).toFixed(2)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const nextItems = (formData.items || []).filter(i => i.id !== item.id);
                              setFormData({
                                ...formData,
                                items: nextItems,
                                amount: nextItems.reduce((s, i) => s + (Number(i.total) || 0), 0),
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Order total footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-t border-indigo-100">
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={13} /> {t('finance.modal.total')}
                      </span>
                      <span className="text-lg font-black text-indigo-700">
                        ${Number(formData.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center py-6 text-sm text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    No items yet — fill in the fields above and click <strong>Add</strong>.
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">{t('common.cancel')}</button>
                <button type="button" onClick={(e) => handleSaveInvoice(e as any, 'Draft')} className="px-4 py-2 border rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors">{t('finance.modal.save_draft')}</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors">{t('finance.modal.submit_approval')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-start mb-8 border-b pb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Invoice {selectedInvoice.id}</h3>
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">{t('finance.modal.managed_by')} {selectedInvoice.salesperson}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => generateInvoicePDF(selectedInvoice)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors" title={t('finance.actions.download_pdf')}><Download size={20} /></button>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('finance.modal.customer')}</p>
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-bold text-slate-800 leading-tight text-lg">{selectedInvoice.customerName}</p>
                    {getCustomer(selectedInvoice.customerId)?.company && <p className="text-sm text-slate-500 font-medium">{getCustomer(selectedInvoice.customerId)?.company}</p>}
                    <p className="text-xs text-slate-400 italic mt-1">{selectedInvoice.date}</p>
                  </div>
                  {onNavigateToCRM && (
                    <button onClick={() => { onNavigateToCRM(); setSelectedInvoice(null); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title={t('finance.actions.view_in_crm')}>
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('finance.modal.balance_due')}</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter">${Number(selectedInvoice.amount).toLocaleString()}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedInvoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : selectedInvoice.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-500'}`}>
                  {getTranslatedStatus(selectedInvoice.status)}
                </span>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-800"><Receipt size={16} className="text-indigo-500" /> {t('finance.modal.items_breakdown')}</h4>
                <div className="bg-slate-50 rounded-xl overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="p-4 text-left">{t('finance.modal.description')}</th>
                        <th className="p-4 text-right">Qty</th>
                        <th className="p-4 text-right">{t('finance.modal.subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedInvoice.items || []).map(i => (
                        <tr key={i.id}>
                          <td className="p-4 font-medium text-slate-700">{i.description}</td>
                          <td className="p-4 text-right text-slate-500 font-mono">x{i.quantity}</td>
                          <td className="p-4 text-right font-black text-slate-800">${Number(i.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(selectedInvoice as any).installments && (selectedInvoice as any).installments.length > 0 && (
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-amber-600"><Split size={16} /> {t('finance.modal.schedule')}</h4>
                  <div className="bg-amber-50/30 rounded-xl overflow-hidden border border-amber-100">
                    <table className="w-full text-sm">
                      <thead className="bg-amber-50/50 border-b border-amber-100">
                        <tr className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                          <th className="p-4 text-left">{t('finance.table.due_date')}</th>
                          <th className="p-4 text-right">{t('finance.table.amount')}</th>
                          <th className="p-4 text-center">{t('finance.table.status')}</th>
                          <th className="p-4 text-right">{t('finance.modal.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {(selectedInvoice as any).installments.map((inst: any) => (
                          <tr key={inst.id} className="hover:bg-white/50 transition-colors">
                            <td className="p-4 text-slate-700 font-medium font-mono">{inst.dueDate}</td>
                            <td className="p-4 text-right font-bold text-slate-800">${Number(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : inst.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400'}`}>
                                {getTranslatedStatus(inst.status)}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {inst.status !== 'Paid' && selectedInvoice.status === 'Approved' && (
                                <button onClick={() => handlePayInstallment(selectedInvoice.id, inst)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">
                                  {t('finance.actions.record_payment')}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-8">
                <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 text-indigo-800"><History size={16} className="text-indigo-500" /> {t('finance.modal.history')}</h4>
                <div className="relative border-l-2 border-indigo-100 ml-3 pl-8 space-y-8">
                  {selectedInvoice.history && selectedInvoice.history.length > 0 ? (
                    [...selectedInvoice.history]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((h, idx) => (
                        <div key={h.id || idx} className="relative group">
                          <div className="absolute -left-[37px] top-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full z-10 shadow-sm transition-transform group-hover:scale-125"></div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${h.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : h.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-100' : h.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {getTranslatedStatus(h.status)}
                              </span>
                              {h.notes && <p className="text-sm text-slate-600 mt-2 font-medium">"{h.notes}"</p>}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1 sm:justify-end"><UserIcon size={12} className="text-slate-400" /> {h.changedBy}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{h.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">{t('finance.modal.no_history')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => generateInvoicePDF(selectedInvoice)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-all">
                <Download size={18} /> {t('finance.actions.download_pdf')}
              </button>
              {selectedInvoice.status === 'Draft' && (
                <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Awaiting Approval', 'Submitted for review.')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all">
                  <Send size={18} /> {t('finance.modal.submit_approval')}
                </button>
              )}
              {selectedInvoice.status === 'Awaiting Approval' && (
                <>
                  <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Approved', 'Manager approved.')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2">
                    <ThumbsUp size={18} /> {t('finance.modal.approve')}
                  </button>
                  <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Rejected', 'Manager rejected.')} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 flex items-center gap-2">
                    <ThumbsDown size={18} /> {t('finance.modal.reject')}
                  </button>
                </>
              )}
              {selectedInvoice.status === 'Approved' && (
                <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Paid', 'Manual full payment.')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2">
                  <CreditCard size={18} /> {t('finance.actions.mark_paid')}
                </button>
              )}
              <button onClick={() => setSelectedInvoice(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;