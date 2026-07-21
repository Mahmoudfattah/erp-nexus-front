import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, Customer, SalesOrder, PurchaseOrder, Vendor, Invoice, Payable, Expense, CostCenter } from '../types';
import {
  TrendingUp, PieChart as PieChartIcon, Download, Calendar, Filter,
  ArrowUpRight, ArrowDownLeft, Wallet, DollarSign, Users, Tags,
  ShoppingBag, FolderOpen, BarChart3, TrendingDown, User, Tag,
  XCircle, Loader,
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  Area, AreaChart,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from './LanguageContext';
import { useGetProductsQuery, useGetCustomersQuery, useGetSalesOrdersQuery } from '../services/salesApi';
import { purchaseService } from '../api/purchaseService';
import { financeService } from '../api/financeService';

// ==================== NORMALIZATION HELPERS ====================

const safeStr = (v: any, fallback = '') => (v == null ? fallback : String(v));
const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toISODate = (v: any) => {
  const s = safeStr(v, '');
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes(' ')) return s.split(' ')[0];
  return s;
};

interface NormalizedSalesItem {
  id: string | number;
  productId: string | number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const normalizeSalesItem = (item: any): NormalizedSalesItem => ({
  id: item?.id ?? '',
  productId: item?.product_id ?? item?.productId ?? '',
  description: safeStr(item?.description ?? ''),
  quantity: safeNum(item?.quantity, 0),
  unitPrice: safeNum(item?.unit_price ?? item?.unitPrice, 0),
  total: safeNum(item?.total, 0),
});

const normalizeSalesOrder = (apiOrder: any): SalesOrder => {
  const items = Array.isArray(apiOrder?.items)
    ? apiOrder.items.map(normalizeSalesItem)
    : [];
  return {
    id: safeStr(apiOrder?.id ?? ''),
    orderNo: safeStr(apiOrder?.order_no ?? apiOrder?.orderNo ?? ''),
    customerId: safeStr(apiOrder?.customer_id ?? apiOrder?.customerId ?? ''),
    customerName: safeStr(
      apiOrder?.customer_name ?? apiOrder?.customerName ?? apiOrder?.customer?.name ?? ''
    ),
    date: toISODate(apiOrder?.date ?? apiOrder?.created_at ?? ''),
    status: safeStr(apiOrder?.status, 'Pending') as any,
    totalAmount: safeNum(apiOrder?.total_amount ?? apiOrder?.totalAmount, 0),
    salesperson: safeStr(apiOrder?.salesperson ?? ''),
    dealReference: safeStr(apiOrder?.deal_reference ?? apiOrder?.dealReference ?? ''),
    items,
  } as SalesOrder;
};

const normalizePurchaseItem = (item: any) => ({
  id: item?.id ?? '',
  productId: item?.product_id ?? item?.productId ?? '',
  description: safeStr(item?.description ?? ''),
  quantity: safeNum(item?.quantity, 0),
  unitPrice: safeNum(item?.unit_price ?? item?.unitPrice, 0),
  total: safeNum(item?.total, 0),
});

const normalizePurchaseOrder = (apiPO: any): PurchaseOrder => {
  const items = Array.isArray(apiPO?.items) ? apiPO.items.map(normalizePurchaseItem) : [];
  return {
    id: safeStr(apiPO?.id ?? ''),
    vendorId: safeStr(apiPO?.vendor_id ?? apiPO?.vendorId ?? ''),
    vendorName: safeStr(apiPO?.vendor?.name ?? apiPO?.vendorName ?? ''),
    date: toISODate(apiPO?.date ?? apiPO?.created_at ?? ''),
    expectedDelivery: toISODate(apiPO?.expected_delivery ?? apiPO?.expectedDelivery ?? ''),
    status: safeStr(apiPO?.status, 'Pending') as any,
    totalAmount: safeNum(apiPO?.total_amount ?? apiPO?.totalAmount, 0),
    items,
    approval: apiPO?.approval
      ? {
          id: safeStr(apiPO.approval.id ?? ''),
          approvedBy: safeStr(apiPO.approval.approved_by ?? apiPO.approval.approvedBy ?? ''),
          status: safeStr(apiPO.approval.status, 'pending'),
          approvedAt: apiPO.approval.approved_at ?? apiPO.approval.approvedAt ?? null,
        }
      : undefined,
  } as PurchaseOrder;
};

const normalizeProduct = (apiProduct: any): Product => ({
  id: safeStr(apiProduct?.id ?? ''),
  name: safeStr(apiProduct?.name ?? ''),
  sku: safeStr(apiProduct?.sku ?? ''),
  category: safeStr(apiProduct?.category ?? 'Uncategorized'),
  price: safeNum(apiProduct?.price, 0),
  cost: safeNum(apiProduct?.cost, 0),
  quantity: safeNum(apiProduct?.quantity ?? apiProduct?.stock, 0),
  minStock: safeNum(apiProduct?.min_stock ?? apiProduct?.minStock, 0),
  unit: safeStr(apiProduct?.unit, 'unit'),
  description: safeStr(apiProduct?.description ?? ''),
});

const normalizeCustomer = (apiCustomer: any): Customer => ({
  id: safeStr(apiCustomer?.id ?? ''),
  name: safeStr(apiCustomer?.name ?? ''),
  company: safeStr(apiCustomer?.company ?? ''),
  email: safeStr(apiCustomer?.email ?? ''),
  phone: safeStr(apiCustomer?.phone ?? ''),
  address: safeStr(apiCustomer?.address ?? ''),
  status: safeStr(apiCustomer?.status, 'active') as any,
  revenue: safeNum(apiCustomer?.revenue, 0),
  industry: safeStr(apiCustomer?.industry ?? ''),
});

const normalizeVendor = (apiVendor: any): Vendor => ({
  id: safeStr(apiVendor?.id ?? ''),
  name: safeStr(apiVendor?.name ?? ''),
  contactPerson: safeStr(apiVendor?.contact_person ?? apiVendor?.contactPerson ?? ''),
  email: safeStr(apiVendor?.email ?? ''),
  phone: safeStr(apiVendor?.phone ?? ''),
  address: safeStr(apiVendor?.address ?? ''),
  paymentTerms: safeStr(apiVendor?.payment_terms ?? apiVendor?.paymentTerms ?? ''),
  status: safeStr(apiVendor?.status, 'Active') as any,
});

// ==================== PROPS ====================

interface ReportsViewProps {
  inventory?: Product[];
  customers?: Customer[];
  salesOrders?: SalesOrder[];
  purchaseOrders?: PurchaseOrder[];
  vendors?: Vendor[];
  invoices?: Invoice[];
  payables?: Payable[];
  expenses?: Expense[];
  costCenters?: CostCenter[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#10b981', '#3b82f6', '#eab308'];

// ==================== COMPONENT ====================

const ReportsView: React.FC<ReportsViewProps> = ({
  inventory: propInventory = [],
  customers: propCustomers = [],
  salesOrders: propSalesOrders = [],
  purchaseOrders: propPurchaseOrders = [],
  vendors: propVendors = [],
  invoices: propInvoices = [],
  payables: propPayables = [],
  expenses: propExpenses = [],
  costCenters = [],
}) => {
  const { t, language } = useLanguage();
  const isRTL = (language || '').toLowerCase().startsWith('ar');

  // ── RTK Query (products, customers, sales orders) ──────────────────────────
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const { data: salesOrdersData, isLoading: isLoadingSalesOrders } = useGetSalesOrdersQuery();

  // ── Manual API fetches ──────────────────────────────────────────────────────
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);

  const [rawPOs, setRawPOs] = useState<any[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>(propInvoices);
  const [payables, setPayables] = useState<Payable[]>(propPayables);
  const [expenses, setExpenses] = useState<Expense[]>(propExpenses);

  // Fetch Purchase Orders
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoadingPOs(true);
        const response = await purchaseService.getPurchaseOrders();
        // Normalize possible shapes: response.data.data | response.data | response
        const raw = (response as any)?.data?.data ?? (response as any)?.data ?? response;
        setRawPOs(Array.isArray(raw) ? raw : []);
      } catch (e) {
        console.error('Failed to fetch POs:', e);
      } finally {
        setIsLoadingPOs(false);
      }
    };
    fetch();
  }, []);

  // Fetch Vendors
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoadingVendors(true);
        const response = await purchaseService.getVendors();
        const raw = (response as any)?.data?.data ?? (response as any)?.data ?? response;
        setRawVendors(Array.isArray(raw) ? raw : []);
      } catch (e) {
        console.error('Failed to fetch vendors:', e);
      } finally {
        setIsLoadingVendors(false);
      }
    };
    fetch();
  }, []);

  // ✅ Fetch finance data (invoices, expenses, payables) from financeService
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoadingFinance(true);
        const [inv, exp, pay] = await Promise.allSettled([
          financeService.getInvoices(),
          financeService.getExpenses(),
          financeService.getPayables(),
        ]);
        if (inv.status === 'fulfilled') setInvoices(inv.value);
        if (exp.status === 'fulfilled') setExpenses(exp.value);
        if (pay.status === 'fulfilled') setPayables(pay.value);
      } catch (e) {
        console.error('Failed to fetch finance data:', e);
      } finally {
        setIsLoadingFinance(false);
      }
    };
    fetch();
  }, []);

  // ── Normalize API data ──────────────────────────────────────────────────────

  const inventory = useMemo(() => {
    // RTK Query wraps in {data: {data: [...]}} or {data: [...]}
    const raw = Array.isArray((productsData as any)?.data)
      ? (productsData as any).data
      : Array.isArray(productsData)
      ? productsData
      : Array.isArray(propInventory)
      ? propInventory
      : [];
    return (raw as any[]).map(normalizeProduct);
  }, [productsData, propInventory]);

  const customers = useMemo(() => {
    const raw = Array.isArray((customersData as any)?.data)
      ? (customersData as any).data
      : Array.isArray(customersData)
      ? customersData
      : Array.isArray(propCustomers)
      ? propCustomers
      : [];
    return (raw as any[]).map(normalizeCustomer);
  }, [customersData, propCustomers]);

  const salesOrders = useMemo(() => {
    const raw = Array.isArray((salesOrdersData as any)?.data)
      ? (salesOrdersData as any).data
      : Array.isArray(salesOrdersData)
      ? salesOrdersData
      : Array.isArray(propSalesOrders)
      ? propSalesOrders
      : [];
    return (raw as any[]).map(normalizeSalesOrder);
  }, [salesOrdersData, propSalesOrders]);

  const purchaseOrders = useMemo(() => {
    const raw = rawPOs.length > 0 ? rawPOs : propPurchaseOrders;
    return (raw as any[]).map(normalizePurchaseOrder);
  }, [rawPOs, propPurchaseOrders]);

  const vendors = useMemo(() => {
    const raw = rawVendors.length > 0 ? rawVendors : propVendors;
    return (raw as any[]).map(normalizeVendor);
  }, [rawVendors, propVendors]);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [timeRange, setTimeRange] = useState<
    'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'ytd' | 'all' | 'custom'
  >('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState<'financial' | 'sales'>('sales');
  const [filterSalesperson, setFilterSalesperson] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // ✅ Stable filterByDate using useCallback — memoized on timeRange/customRange
  //    so useMemos that depend on it don't go stale
  const filterByDate = useCallback(
    (dateString: string, overrideRange?: typeof timeRange) => {
      const range = overrideRange ?? timeRange;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      const now = new Date();

      switch (range) {
        case 'thisMonth':
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        case 'lastMonth': {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            date.getMonth() === lm.getMonth() &&
            date.getFullYear() === lm.getFullYear()
          );
        }
        case 'thisQuarter': {
          const cq = Math.floor(now.getMonth() / 3);
          return (
            Math.floor(date.getMonth() / 3) === cq &&
            date.getFullYear() === now.getFullYear()
          );
        }
        case 'lastQuarter': {
          let tq = Math.floor(now.getMonth() / 3) - 1;
          let ty = now.getFullYear();
          if (tq < 0) { tq = 3; ty -= 1; }
          return (
            Math.floor(date.getMonth() / 3) === tq &&
            date.getFullYear() === ty
          );
        }
        case 'ytd':
          return date.getFullYear() === now.getFullYear();
        case 'custom': {
          const start = customRange.start ? new Date(customRange.start) : null;
          const end = customRange.end ? new Date(customRange.end) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);
          return (!start || date >= start) && (!end || date <= end);
        }
        case 'all':
        default:
          return true;
      }
    },
    [timeRange, customRange]
  );

  // ── Derived filter dropdowns ────────────────────────────────────────────────
  const uniqueSalespeople = useMemo(() => {
    const people = new Set<string>();
    salesOrders.forEach(o => { if (o.salesperson) people.add(o.salesperson); });
    return Array.from(people).sort();
  }, [salesOrders]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [inventory]);

  // ── Core processed sales ────────────────────────────────────────────────────
  const processedSales = useMemo(() => {
    return salesOrders
      .filter(
        o =>
          filterByDate(o.date) &&
          o.status !== 'Cancelled' &&
          o.status !== 'cancelled' &&
          o.status !== 'Quote'
      )
      .map(order => {
        const matchingItems = order.items.filter(item => {
          if (filterCategory === 'All') return true;
          const product = inventory.find(
            p => String(p.id) === String(item.productId) || p.name === item.description
          );
          return product?.category === filterCategory;
        });
        return {
          ...order,
          activeRevenue: matchingItems.reduce((sum, i) => sum + i.total, 0),
          hasMatchingItems: matchingItems.length > 0,
        };
      })
      .filter(o => {
        const matchesSalesperson =
          filterSalesperson === 'All' || o.salesperson === filterSalesperson;
        const matchesCategory =
          filterCategory === 'All' || o.hasMatchingItems;
        return matchesSalesperson && matchesCategory;
      });
  }, [salesOrders, filterByDate, filterSalesperson, filterCategory, inventory]);

  const filteredPurchases = useMemo(
    () =>
      purchaseOrders.filter(
        p =>
          filterByDate(p.date) &&
          p.status !== 'Cancelled' &&
          p.status !== 'cancelled' &&
          p.status !== 'Draft'
      ),
    [purchaseOrders, filterByDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter(e => filterByDate(e.date)),
    [expenses, filterByDate]
  );

  // ── KPI totals ──────────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => processedSales.reduce((sum, o) => sum + o.activeRevenue, 0),
    [processedSales]
  );
  const totalPOExpense = useMemo(
    () => filteredPurchases.reduce((sum, po) => sum + po.totalAmount, 0),
    [filteredPurchases]
  );
  const totalOpExpense = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const totalExpenses = totalPOExpense + totalOpExpense;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // ── Growth metrics ──────────────────────────────────────────────────────────
  const salesPerformanceMetrics = useMemo(() => {
    // Choose a "previous" range for comparison
    const prevRange: typeof timeRange =
      timeRange === 'lastMonth' ? 'all'
      : timeRange === 'lastQuarter' ? 'thisQuarter'
      : timeRange === 'thisMonth' ? 'lastMonth'
      : timeRange === 'thisQuarter' ? 'lastQuarter'
      : 'all';

    const prevSales = salesOrders
      .filter(
        o =>
          filterByDate(o.date, prevRange) &&
          o.status !== 'Cancelled' &&
          o.status !== 'cancelled' &&
          o.status !== 'Quote'
      )
      .map(o => {
        const matchingItems = o.items.filter(item => {
          if (filterCategory === 'All') return true;
          const product = inventory.find(
            p => String(p.id) === String(item.productId) || p.name === item.description
          );
          return product?.category === filterCategory;
        });
        return {
          ...o,
          activeRevenue: matchingItems.reduce((sum, i) => sum + i.total, 0),
          hasMatch: matchingItems.length > 0,
        };
      })
      .filter(
        o =>
          (filterSalesperson === 'All' || o.salesperson === filterSalesperson) &&
          (filterCategory === 'All' || o.hasMatch)
      );

    const prevRevenue = prevSales.reduce((sum, o) => sum + o.activeRevenue, 0);
    const prevOrders = prevSales.length;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    const currentOrders = processedSales.length;
    const currentAov = currentOrders > 0 ? totalRevenue / currentOrders : 0;

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      revenueGrowth: calcGrowth(totalRevenue, prevRevenue),
      ordersGrowth: calcGrowth(currentOrders, prevOrders),
      aovGrowth: calcGrowth(currentAov, prevAov),
      currentAov,
    };
  }, [salesOrders, totalRevenue, processedSales, timeRange, filterSalesperson, filterCategory, inventory, filterByDate]);

  // ── Chart data ──────────────────────────────────────────────────────────────

  // ✅ FIX: use YYYY-MM key so months sort correctly and don't collide across years
  const financialPerformanceData = useMemo(() => {
    const data: Record<string, { name: string; revenue: number; expense: number; profit: number }> = {};

    const getKey = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      };
    };

    processedSales.forEach(order => {
      const r = getKey(order.date);
      if (!r) return;
      if (!data[r.key]) data[r.key] = { name: r.label, revenue: 0, expense: 0, profit: 0 };
      data[r.key].revenue += order.activeRevenue;
    });
    filteredPurchases.forEach(po => {
      const r = getKey(po.date);
      if (!r) return;
      if (!data[r.key]) data[r.key] = { name: r.label, revenue: 0, expense: 0, profit: 0 };
      data[r.key].expense += po.totalAmount;
    });
    filteredExpenses.forEach(exp => {
      const r = getKey(exp.date);
      if (!r) return;
      if (!data[r.key]) data[r.key] = { name: r.label, revenue: 0, expense: 0, profit: 0 };
      data[r.key].expense += exp.amount;
    });

    return Object.keys(data)
      .sort() // YYYY-MM sorts lexicographically = chronologically
      .map(key => {
        const item = data[key];
        return { ...item, profit: item.revenue - item.expense };
      });
  }, [processedSales, filteredPurchases, filteredExpenses]);

  const salesBySalespersonData = useMemo(() => {
    const data: Record<string, number> = {};
    processedSales.forEach(order => {
      const name = order.salesperson || 'Unassigned';
      data[name] = (data[name] || 0) + order.activeRevenue;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processedSales]);

  const salesByCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    processedSales.forEach(order => {
      order.items.forEach(item => {
        const product = inventory.find(
          p => String(p.id) === String(item.productId) || p.name === item.description
        );
        const category = product?.category || 'Uncategorized';
        if (filterCategory === 'All' || category === filterCategory) {
          data[category] = (data[category] || 0) + item.total;
        }
      });
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processedSales, inventory, filterCategory]);

  // ✅ FIX: use YYYY-MM key for correct chronological sorting; label derived from key
  const categoricalTrendData = useMemo(() => {
    const dataMap: Record<string, Record<string, any>> = {};

    processedSales.forEach(order => {
      const d = new Date(order.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (!dataMap[key]) dataMap[key] = { _key: key, name: label };

      order.items.forEach(item => {
        const product = inventory.find(
          p => String(p.id) === String(item.productId) || p.name === item.description
        );
        const cat = product?.category || 'Uncategorized';
        if (filterCategory === 'All' || cat === filterCategory) {
          dataMap[key][cat] = (dataMap[key][cat] || 0) + item.total;
        }
      });
    });

    return Object.keys(dataMap)
      .sort()
      .map(k => dataMap[k]);
  }, [processedSales, inventory, filterCategory]);

  // ✅ FIX: daily vs monthly properly, using YYYY-MM-DD or YYYY-MM keys
  const salesTrendData = useMemo(() => {
    const isDaily =
      timeRange === 'thisMonth' ||
      timeRange === 'lastMonth' ||
      (timeRange === 'custom' &&
        customRange.start &&
        customRange.end &&
        Math.abs(
          new Date(customRange.end).getTime() - new Date(customRange.start).getTime()
        ) <=
          62 * 24 * 60 * 60 * 1000);

    const aggregated: Record<string, { label: string; val: number }> = {};

    processedSales.forEach(order => {
      const d = new Date(order.date);
      if (isNaN(d.getTime())) return;
      const key = isDaily
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = isDaily
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!aggregated[key]) aggregated[key] = { label, val: 0 };
      aggregated[key].val += order.activeRevenue;
    });

    return Object.keys(aggregated)
      .sort()
      .map(k => ({ name: aggregated[k].label, value: aggregated[k].val }));
  }, [processedSales, timeRange, customRange]);

  const projectSpendData = useMemo(() => {
    const projects: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      if ((exp as any).linkedProject) {
        projects[(exp as any).linkedProject] =
          (projects[(exp as any).linkedProject] || 0) + exp.amount;
      }
    });
    return Object.entries(projects)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const detailedExpenseData = useMemo(() => {
    const categories: Record<string, number> = {
      'Cost of Goods (POs)': totalPOExpense,
    };
    filteredExpenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, totalPOExpense]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const clearFilters = () => {
    setTimeRange('all'); // ✅ FIX: was resetting to 'thisMonth' but initial state is 'all'
    setCustomRange({ start: '', end: '' });
    setFilterSalesperson('All');
    setFilterCategory('All');
  };

  const hasActiveFilters =
    timeRange !== 'all' ||
    filterSalesperson !== 'All' ||
    filterCategory !== 'All' ||
    customRange.start !== '' ||
    customRange.end !== '';

  // ── Loading state ────────────────────────────────────────────────────────────
  const isLoading =
    isLoadingProducts ||
    isLoadingCustomers ||
    isLoadingSalesOrders ||
    isLoadingPOs ||
    isLoadingFinance;

  // ── PDF export ───────────────────────────────────────────────────────────────
  const generateReport = () => {
    const doc = new jsPDF();
    const periodLabel =
      timeRange === 'custom'
        ? `${customRange.start} to ${customRange.end}`
        : timeRange.replace(/([A-Z])/g, ' $1').trim();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);

    if (reportType === 'sales') {
      doc.text('Sales Performance Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Period: ${periodLabel}`, 14, 34);
      doc.text(
        `Filters: Salesperson: ${filterSalesperson} | Category: ${filterCategory}`,
        14,
        40
      );

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 46, 182, 25, 'F');
      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text('Matching Revenue', 20, 56);
      doc.text('Total Orders', 80, 56);
      doc.text('Avg Order Value', 140, 56);
      doc.setFontSize(14);
      doc.setTextColor(0);
      const avgOrder =
        processedSales.length > 0 ? totalRevenue / processedSales.length : 0;
      doc.text(`$${totalRevenue.toLocaleString()}`, 20, 66);
      doc.text(`${processedSales.length}`, 80, 66);
      doc.text(
        `$${avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        140,
        66
      );

      let finalY = 85;
      doc.setFontSize(14);
      doc.text('Sales by Salesperson', 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Salesperson', 'Revenue Contribution']],
        body: salesBySalespersonData.map(d => [d.name, `$${d.value.toLocaleString()}`]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Sales by Category', 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Category', 'Revenue Contribution']],
        body: salesByCategoryData.map(d => [d.name, `$${d.value.toLocaleString()}`]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
      });

      doc.save(`Sales_Report_${timeRange}_${new Date().getTime()}.pdf`);
    } else {
      doc.text('Executive Financial Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Period: ${periodLabel}`, 14, 34);

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 40, 182, 30, 'F');
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text('Total Revenue', 20, 50);
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`$${totalRevenue.toLocaleString()}`, 20, 60);
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text('Total Expenses', 80, 50);
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`$${totalExpenses.toLocaleString()}`, 80, 60);
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text('Net Profit', 140, 50);
      doc.setFontSize(14);
      doc.setTextColor(netProfit >= 0 ? 0 : 200, netProfit >= 0 ? 128 : 0, 0);
      doc.text(`$${netProfit.toLocaleString()}`, 140, 60);

      let finalY = 85;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Expense Breakdown', 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Category', 'Amount']],
        body: detailedExpenseData.map(d => [d.name, `$${d.value.toLocaleString()}`]),
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94] },
      });

      finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Monthly Performance', 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Month', 'Revenue', 'Expenses', 'Net Profit']],
        body: financialPerformanceData.map(d => [
          d.name,
          `$${d.revenue.toLocaleString()}`,
          `$${d.expense.toLocaleString()}`,
          `$${d.profit.toLocaleString()}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`Financial_Report_${timeRange}_${new Date().getTime()}.pdf`);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Filter Dashboard Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('reports.title')}</h2>
            <p className="text-slate-500 text-sm">{t('reports.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader size={14} className="animate-spin" />
                Loading data…
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setReportType('financial')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${reportType === 'financial' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('reports.types.financial')}
              </button>
              <button
                onClick={() => setReportType('sales')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${reportType === 'sales' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('reports.types.sales')}
              </button>
            </div>
            <button
              onClick={generateReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Download size={16} /> {t('reports.buttons.export_pdf')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-4 border-t border-slate-50">
          {/* Period Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Time Period
            </label>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as any)}
              className="w-[85%] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            >
              <option value="thisMonth">{t('reports.ranges.thisMonth')}</option>
              <option value="lastMonth">{t('reports.ranges.lastMonth')}</option>
              <option value="thisQuarter">{t('reports.ranges.thisQuarter')}</option>
              <option value="lastQuarter">{t('reports.ranges.lastQuarter')}</option>
              <option value="ytd">{t('reports.ranges.ytd')}</option>
              <option value="all">{t('reports.ranges.all')}</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          <div
            className={`space-y-1.5 transition-all duration-300 ${timeRange === 'custom' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
          >
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="flex-1 min-w-0 px-2 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={customRange.start}
                onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
              />
              <span className="text-slate-300 shrink-0">–</span>
              <input
                type="date"
                className="flex-1 min-w-0 px-2 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={customRange.end}
                onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
              />
            </div>
          </div>

          {/* Salesperson Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} /> Salesperson
            </label>
            <select
              value={filterSalesperson}
              onChange={e => setFilterSalesperson(e.target.value)}
              className="w-[85%] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            >
              <option value="All">All Sales Staff</option>
              {uniqueSalespeople.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Category Filter + Clear */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} /> Product Category
            </label>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-[85%] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                  title="Reset Filters"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL VIEW ── */}
      {reportType === 'financial' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.total_revenue')}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">${totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={20} /></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.total_expenses')}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">${totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Wallet size={20} /></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.net_profit')}</p>
                  <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${netProfit.toLocaleString()}
                  </h3>
                </div>
                <div className={`p-3 rounded-lg ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {netProfit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.profit_margin')}</p>
                  <h3 className={`text-2xl font-bold mt-1 ${profitMargin >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {profitMargin.toFixed(1)}%
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6">{t('reports.charts.financial_performance')}</h3>
              {financialPerformanceData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-slate-400 text-sm italic">
                  No data for selected period
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={financialPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={val => `$${val}`} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="revenue" name={t('reports.charts.revenue')} fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="expense" name={t('reports.charts.expenses')} fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                      <Line type="monotone" dataKey="profit" name={t('reports.charts.profit_trend')} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">{t('reports.charts.expense_breakdown')}</h3>
                {detailedExpenseData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">No expense data</div>
                ) : (
                  <div className="h-48 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 90 }}>
  <Pie
    data={detailedExpenseData}
    dataKey="value"
    nameKey="name"
    cx="35%"      // ✅ بدل 50%
    cy="50%"
    innerRadius={40}
    outerRadius={60}
    paddingAngle={5}
  >
    {detailedExpenseData.map((_, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>

  <Tooltip formatter={(val: number) => `$${Number(val).toLocaleString()}`} />

  <Legend
    layout="vertical"
    verticalAlign="left"
    align="right"
    wrapperStyle={{ width: 130 }} // ✅ مساحة ثابتة للـ legend
  />
</PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col" style={{ minHeight: 200 }}>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FolderOpen size={18} className="text-indigo-600" /> Project Spend
                </h3>
                {projectSpendData.length > 0 ? (
                  <div className="flex-1" style={{ minHeight: 160 }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={projectSpendData} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                    <FolderOpen size={24} className="opacity-20 mb-1" /> No project spend data.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── SALES VIEW ── */
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.total_sales_revenue')}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">${totalRevenue.toLocaleString()}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${salesPerformanceMetrics.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {salesPerformanceMetrics.revenueGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(salesPerformanceMetrics.revenueGrowth).toFixed(1)}%{' '}
                    <span className="text-slate-400 font-normal">{t('reports.kpi.vs_prev')}</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><ShoppingBag size={20} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.total_orders')}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{processedSales.length}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${salesPerformanceMetrics.ordersGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {salesPerformanceMetrics.ordersGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(salesPerformanceMetrics.ordersGrowth).toFixed(1)}%{' '}
                    <span className="text-slate-400 font-normal">{t('reports.kpi.vs_prev')}</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Filter size={20} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t('reports.kpi.avg_order_value')}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    ${salesPerformanceMetrics.currentAov.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </h3>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${salesPerformanceMetrics.aovGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {salesPerformanceMetrics.aovGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(salesPerformanceMetrics.aovGrowth).toFixed(1)}%{' '}
                    <span className="text-slate-400 font-normal">{t('reports.kpi.vs_prev')}</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><BarChart3 size={20} /></div>
              </div>
            </div>
          </div>

          {/* Trend Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Monthly Trend by Category
              </h3>
              {categoricalTrendData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-slate-400 text-sm italic">No data for selected period</div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoricalTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tickMargin={isRTL ? 90 : 0} tickFormatter={val => `$${val}`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                      <Legend />
                      {uniqueCategories.map((cat, idx) => (
                        <Bar
                          key={cat}
                          dataKey={cat}
                          stackId="a"
                          fill={COLORS[idx % COLORS.length]}
                          radius={idx === uniqueCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Salesperson Contribution
              </h3>
              {salesBySalespersonData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-slate-400 text-sm italic">No data for selected period</div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesBySalespersonData} margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tickMargin={isRTL ? 60 : 0} tickFormatter={val => `$${val}`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="value" name={t('reports.charts.revenue')} radius={[4, 4, 0, 0]} barSize={40}>
                        {salesBySalespersonData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Trend Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Tags size={18} className="text-indigo-600" /> Overall Category Breakdown
              </h3>
              {salesByCategoryData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm italic">No data for selected period</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCategoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={val => `$${val}`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tickMargin={isRTL ? 60 : 0} dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="value" name={t('reports.charts.revenue')} radius={[0, 4, 4, 0]} barSize={30}>
                        {salesByCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Overall Sales Trend
              </h3>
              {salesTrendData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm italic">No data for selected period</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={val => `$${val}`} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, t('reports.charts.sales')]}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;