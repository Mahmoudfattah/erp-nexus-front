// // SalesView.tsx

// import React, { useState, useMemo, useEffect } from 'react';
// import { InvoiceItem, Product, Customer, Subscription } from '../types';

// import {
//   Plus,
//   Search,
//   Download,
//   Truck,
//   CheckCircle,
//   X,
//   Send,
//   Eye,
//   AlertCircle,
//   Filter,
//   XCircle,
//   Lock,
//   CheckSquare,
//   Square,
//   Trash2,
//   Loader,
//   TrendingUp,
//   Pencil,
// } from 'lucide-react';

// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';

// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from 'recharts';

// import { useNotification } from './NotificationContext';
// import { useLanguage } from './LanguageContext';
// import StatsCard from './StatsCard';
// import { salesService } from '../api/salesService';
// import { crmService } from '../api/crmService';
// import { inventoryService } from '../api/inventoryService';

// interface SalesViewProps {
//   inventory: Product[];
//   setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
//   customers?: Customer[];
//   salesOrders?: any[];
//   setSalesOrders?: React.Dispatch<React.SetStateAction<any[]>>;
//   subscription?: Subscription;
// }

// const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// type OrderStatus = 'quote' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

// type Location = {
//   id: number;
//   name: string;
//   allocations?: Array<{
//     product_id: number;
//     location_id: number;
//     quantity: number;
//   }>;
// };

// type AllocationRow = {
//   location_id: number;
//   quantity: number;
// };

// type AllocationState = Record<number, AllocationRow[]>;

// type ItemValidation = {
//   requiredQty: number;
//   totalAllocated: number;
//   available: number;
//   valid: boolean;
//   error?: string;
// };

// const normalizeStatus = (s: any): OrderStatus => {
//   const v = String(s ?? '').toLowerCase().trim();
//   if (v === 'complete') return 'completed';
//   if (v === 'completed') return 'completed';
//   if (v === 'quote') return 'quote';
//   if (v === 'confirmed') return 'confirmed';
//   if (v === 'shipped') return 'shipped';
//   if (v === 'cancelled' || v === 'canceled') return 'cancelled';
//   return 'quote';
// };

// const eqId = (a: any, b: any) => String(a ?? '') === String(b ?? '');

// type UiOrder = {
//   id: string;
//   dbId: number;
//   customerName?: string;
//   customer_id?: number;
//   date?: string;
//   status: OrderStatus;
//   salesperson?: string;
//   dealReference?: string | null;
//   totalAmount: number;
//   items: Array<{
//     id?: number;
//     productId?: string;
//     product_id?: number;
//     description: string;
//     quantity: number;
//     unitPrice: number;
//     unit_price?: number;
//     total: number;
//   }>;
// };

// const mapApiOrderToUi = (order: any): UiOrder => {
//   const displayId = (order?.order_no ?? order?.id ?? '').toString();
//   const dbId = Number(order?.id ?? 0);
//   const items = Array.isArray(order?.items) ? order.items : [];
//   const mappedItems = items.map((item: any) => {
//     const qty = Number(item?.quantity ?? 0);
//     const unit = Number(item?.unit_price ?? item?.unitPrice ?? 0);
//     const total = Number(item?.total ?? qty * unit);
//     return {
//       id: item?.id != null ? Number(item.id) : undefined,
//       productId: item?.product_id != null ? String(item.product_id) : item?.productId != null ? String(item.productId) : undefined,
//       product_id: item?.product_id != null ? Number(item.product_id) : undefined,
//       description: String(item?.description ?? ''),
//       quantity: qty,
//       unitPrice: unit,
//       unit_price: item?.unit_price != null ? Number(item.unit_price) : undefined,
//       total,
//     };
//   });
//   const totalAmount = Number(order?.total_amount ?? order?.totalAmount ?? 0);
//   return {
//     id: displayId,
//     dbId,
//     customerName: order?.customer_name ?? order?.customerName ?? '',
//     customer_id: order?.customer_id != null ? Number(order.customer_id) : undefined,
//     date: order?.date ?? '',
//     status: normalizeStatus(order?.status),
//     salesperson: order?.salesperson ?? '',
//     dealReference: order?.deal_reference ?? order?.dealReference ?? null,
//     totalAmount,
//     items: mappedItems,
//   };
// };

// type StatusChangePayload = {
//   orders: Array<{
//     order_id: number;
//     items?: Array<{
//       item_id: number;
//       allocations: Array<{ location_id: number; quantity: number }>;
//     }>;
//   }>;
//   status: OrderStatus;
// };

// const getAllowedNextStatuses = (current: OrderStatus): OrderStatus[] => {
//   if (current === 'quote') return ['confirmed'];
//   if (current === 'confirmed') return ['shipped', 'cancelled'];
//   if (current === 'shipped') return ['completed', 'cancelled'];
//   return [];
// };

// const canEditOrder = (order: UiOrder) => order.status === 'quote';

// const canBulkDelete = (orders: UiOrder[], selectedDbIds: number[]) => {
//   if (selectedDbIds.length === 0) return false;
//   const selected = orders.filter(o => selectedDbIds.includes(o.dbId));
//   return selected.length > 0 && selected.every(o => o.status === 'quote');
// };

// const canBulkConfirm = (orders: UiOrder[], selectedDbIds: number[]) => {
//   if (selectedDbIds.length === 0) return false;
//   const selected = orders.filter(o => selectedDbIds.includes(o.dbId));
//   return selected.length > 0 && selected.every(o => o.status === 'quote');
// };

// const SalesView: React.FC<SalesViewProps> = ({ inventory: propInventory, setInventory, subscription }) => {
//   const { t } = useLanguage();
//   const { addNotification } = useNotification();

//   const [viewMode, setViewMode] = useState<'orders' | 'analytics'>('orders');
//   const [searchTerm, setSearchTerm] = useState('');

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingOrder, setEditingOrder] = useState<UiOrder | null>(null);

//   const [isLinkDealModalOpen, setIsLinkDealModalOpen] = useState(false);
//   const [newDealRef, setNewDealRef] = useState('');
//   const [linkOrderIdsInput, setLinkOrderIdsInput] = useState('');

//   const [selectedSO, setSelectedSO] = useState<UiOrder | null>(null);
//   const [selectedDbIds, setSelectedDbIds] = useState<number[]>([]);
//   const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

//   // API State
//   const [salesOrders, setSalesOrders] = useState<UiOrder[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [isLoadingOrders, setIsLoadingOrders] = useState(false);
//   const [isCreating, setIsCreating] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [ordersError, setOrdersError] = useState<any>(null);

//   // ✅ API-driven inventory state
//   const [apiInventory, setApiInventory] = useState<Product[]>([]);
//   const [isLoadingInventory, setIsLoadingInventory] = useState(false);

//   const [analyticsFromApi, setAnalyticsFromApi] = useState<any | null>(null);
//   const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
//   const [analyticsError, setAnalyticsError] = useState<string | null>(null);

//   const isMutating = isCreating || isUpdating || isDeleting;

//   // Allocations modal state
//   const [isAllocationsModalOpen, setIsAllocationsModalOpen] = useState(false);
//   const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
//   const [pendingOrderForStatus, setPendingOrderForStatus] = useState<UiOrder | null>(null);

//   const [locations, setLocations] = useState<Location[]>([]);
//   const [isLoadingLocations, setIsLoadingLocations] = useState(false);
//   const [locationsError, setLocationsError] = useState<string | null>(null);
//   const [locationsFetched, setLocationsFetched] = useState(false);
//   const [allocationState, setAllocationState] = useState<AllocationState>({});

//   // ✅ Effective inventory: API takes priority, falls back to prop
//   const inventory = apiInventory.length > 0 ? apiInventory : propInventory;

//   // ✅ Fetch products from API on mount
//   useEffect(() => {
//     const fetchProducts = async () => {
//       setIsLoadingInventory(true);
//       try {
//         const data = await inventoryService.getProducts();
//         const normalized = (data as any)?.data?.data ?? (data as any)?.data ?? data;
//         const list: Product[] = Array.isArray(normalized) ? normalized : [];
//         setApiInventory(list);
//         setInventory(list);
//       } catch (error: any) {
//         console.error('Failed to fetch products:', error);
//       } finally {
//         setIsLoadingInventory(false);
//       }
//     };
//     fetchProducts();
//   }, []);

//   const fetchLocations = async (): Promise<Location[]> => {
//     if (locationsFetched) return locations;
//     try {
//       setIsLoadingLocations(true);
//       setLocationsError(null);
//       const result = await inventoryService.getLocations();
//       let data: Location[] = [];
//       if (result && typeof result === 'object') {
//         if ('success' in result && Array.isArray((result as any).data)) {
//           data = (result as any).data;
//         } else if (Array.isArray(result)) {
//           data = result as Location[];
//         }
//       }
//       setLocations(data);
//       setLocationsFetched(true);
//       return data;
//     } catch (err: any) {
//       console.error('Failed to fetch locations:', err);
//       setLocationsError(err?.message || 'Failed to fetch locations');
//       setLocations([]);
//       return [];
//     } finally {
//       setIsLoadingLocations(false);
//     }
//   };

//   const buildStockMap = (locations: Location[]): Map<string, number> => {
//     const stockMap = new Map<string, number>();
//     locations.forEach(loc => {
//       if (Array.isArray(loc.allocations)) {
//         loc.allocations.forEach(alloc => {
//           stockMap.set(`${loc.id}-${alloc.product_id}`, alloc.quantity || 0);
//         });
//       }
//     });
//     return stockMap;
//   };

//   const suggestAllocations = (items: UiOrder['items'], locations: Location[]): AllocationState => {
//     const stockMap = buildStockMap(locations);
//     const suggested: AllocationState = {};
//     items.forEach(item => {
//       if (!item.id || !item.product_id) return;
//       let remaining = item.quantity;
//       const allocations: AllocationRow[] = [];
//       const candidates = locations
//         .map(loc => ({ location_id: loc.id, available: stockMap.get(`${loc.id}-${item.product_id}`) || 0 }))
//         .filter(c => c.available > 0)
//         .sort((a, b) => b.available - a.available);
//       for (const candidate of candidates) {
//         if (remaining <= 0) break;
//         const qty = Math.min(remaining, candidate.available);
//         allocations.push({ location_id: candidate.location_id, quantity: qty });
//         remaining -= qty;
//       }
//       suggested[item.id] = allocations;
//     });
//     return suggested;
//   };

//   const validateAllocations = (
//     items: UiOrder['items'],
//     allocationState: AllocationState,
//     locations: Location[],
//     isShipped: boolean
//   ): Map<number, ItemValidation> => {
//     const stockMap = buildStockMap(locations);
//     const validations = new Map<number, ItemValidation>();
//     items.forEach(item => {
//       if (!item.id) return;
//       const requiredQty = item.quantity;
//       const allocations = allocationState[item.id] || [];
//       let totalAllocated = 0;
//       let hasError = false;
//       let error: string | undefined;
//       allocations.forEach(alloc => { totalAllocated += alloc.quantity; });
//       if (allocations.length === 0) { hasError = true; error = 'No allocations provided'; }
//       else if (allocations.some(a => a.quantity <= 0)) { hasError = true; error = 'All quantities must be > 0'; }
//       else if (totalAllocated !== requiredQty) { hasError = true; error = `Allocated ${totalAllocated}, required ${requiredQty}`; }
//       if (isShipped && !hasError && item.product_id) {
//         for (const alloc of allocations) {
//           const available = stockMap.get(`${alloc.location_id}-${item.product_id}`) || 0;
//           if (alloc.quantity > available) {
//             hasError = true;
//             error = `Location ${alloc.location_id}: allocated ${alloc.quantity}, available ${available}`;
//             break;
//           }
//         }
//       }
//       let totalAvailable = 0;
//       if (item.product_id) {
//         locations.forEach(loc => { totalAvailable += stockMap.get(`${loc.id}-${item.product_id}`) || 0; });
//       }
//       validations.set(item.id, { requiredQty, totalAllocated, available: totalAvailable, valid: !hasError, error });
//     });
//     return validations;
//   };

//   const buildAllocationsPayload = (order: UiOrder, allocationState: AllocationState, status: OrderStatus): StatusChangePayload => {
//     const items = order.items
//       .filter(item => item.id != null)
//       .map(item => ({
//         item_id: Number(item.id),
//         allocations: (allocationState[item.id!] || []).map(alloc => ({
//           location_id: Number(alloc.location_id),
//           quantity: Number(alloc.quantity),
//         })),
//       }));
//     return { orders: [{ order_id: order.dbId, items }], status };
//   };

//   const updateAllocation = (itemId: number, rowIndex: number, field: 'location_id' | 'quantity', value: number) => {
//     setAllocationState(prev => {
//       const current = prev[itemId] || [];
//       const updated = [...current];
//       if (rowIndex >= updated.length) return prev;
//       updated[rowIndex] = { ...updated[rowIndex], [field]: value };
//       return { ...prev, [itemId]: updated };
//     });
//   };

//   const addAllocationRow = (itemId: number) => {
//     setAllocationState(prev => ({
//       ...prev,
//       [itemId]: [...(prev[itemId] || []), { location_id: locations[0]?.id || 1, quantity: 0 }],
//     }));
//   };

//   const removeAllocationRow = (itemId: number, rowIndex: number) => {
//     setAllocationState(prev => ({
//       ...prev,
//       [itemId]: (prev[itemId] || []).filter((_, i) => i !== rowIndex),
//     }));
//   };

//   const isAccessDenied = subscription && subscription.tier === 'Free';

//   const fetchAnalytics = async () => {
//     try {
//       setIsLoadingAnalytics(true);
//       setAnalyticsError(null);
//       const data = await salesService.getAnalytics();
//       setAnalyticsFromApi(data);
//     } catch (err: any) {
//       console.error('Failed to fetch analytics:', err);
//       setAnalyticsError(err?.message || 'Failed to fetch analytics');
//       setAnalyticsFromApi(null);
//     } finally {
//       setIsLoadingAnalytics(false);
//     }
//   };

//   const fetchOrders = async () => {
//     try {
//       setIsLoadingOrders(true);
//       setOrdersError(null);
//       const data = await salesService.getOrders();
//       const mapped = Array.isArray(data) ? data.map(mapApiOrderToUi) : [];
//       setSalesOrders(mapped);
//     } catch (err: any) {
//       console.error('Failed to fetch sales orders:', err);
//       setOrdersError(err);
//       setSalesOrders([]);
//     } finally {
//       setIsLoadingOrders(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       const data = await crmService.getCustomers();
//       const maybe = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
//       setCustomers(maybe);
//     } catch (err: any) {
//       console.error('Failed to fetch customers:', err);
//       setCustomers([]);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     fetchCustomers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (viewMode === 'analytics') fetchAnalytics();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [viewMode]);

//   useEffect(() => {
//     if (lastUpdatedId) {
//       const timer = setTimeout(() => setLastUpdatedId(null), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [lastUpdatedId]);

//   const [statusFilter, setStatusFilter] = useState<string>('All');
//   const [salespersonFilter, setSalespersonFilter] = useState<string>('All');
//   const [productFilter, setProductFilter] = useState<string>('All');
//   const [brandFilter, setBrandFilter] = useState<string>('All');
//   const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

//   const [formData, setFormData] = useState<any>({
//     customerId: '',
//     date: new Date().toISOString().split('T')[0],
//     status: 'quote' as OrderStatus,
//     items: [] as any[],
//     salesperson: '',
//     dealReference: '',
//   });

//   const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({ description: '', quantity: 1, unitPrice: 0 });
//   const [selectedProductId, setSelectedProductId] = useState<string>('');

//   const [editFormData, setEditFormData] = useState<any>({
//     customer_id: undefined as number | undefined,
//     date: '',
//     salesperson: '',
//     deal_reference: null as string | null,
//     items: [] as Array<{ id?: number; product_id: number; description: string; quantity: number; unit_price: number }>,
//   });

//   const [editNewItem, setEditNewItem] = useState<Partial<InvoiceItem>>({ description: '', quantity: 1, unitPrice: 0 });
//   const [editSelectedProductId, setEditSelectedProductId] = useState<string>('');

//   const analyticsData = useMemo(() => {
//     const totalRevenueLocal = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
//     const totalOrdersLocal = salesOrders.length;
//     const salesByPerson = salesOrders.reduce((acc, order) => {
//       const person = order.salesperson || 'Unassigned';
//       if (!acc[person]) acc[person] = { name: person, total: 0, count: 0 };
//       acc[person].total += order.totalAmount;
//       acc[person].count += 1;
//       return acc;
//     }, {} as Record<string, { name: string; total: number; count: number }>);
//     const salesPersonList = Object.values(salesByPerson)
//       .map(p => ({ ...p, percentage: totalRevenueLocal > 0 ? (p.total / totalRevenueLocal) * 100 : 0 }))
//       .sort((a, b) => b.total - a.total);
//     const monthlyData = salesOrders.reduce((acc, order) => {
//       const d = new Date(order.date || new Date().toISOString());
//       const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
//       if (!acc[key]) acc[key] = 0;
//       acc[key] += order.totalAmount;
//       return acc;
//     }, {} as Record<string, number>);
//     const chartData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, sales: value }));
//     return {
//       totalRevenue: analyticsFromApi?.summary ? Number(analyticsFromApi.summary.total_revenue) : totalRevenueLocal,
//       totalOrders: analyticsFromApi?.summary?.total_orders ?? totalOrdersLocal,
//       averageOrderValue: analyticsFromApi?.summary?.average_order_value ?? (totalOrdersLocal > 0 ? totalRevenueLocal / totalOrdersLocal : 0),
//       byStatus: analyticsFromApi?.by_status ?? [],
//       topCustomers: analyticsFromApi?.top_customers ?? [],
//       salesPersonList,
//       chartData,
//     };
//   }, [salesOrders, analyticsFromApi]);

//   const dashboardMetrics = useMemo(() => {
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();
//     const getMonthRevenue = (m: number, y: number) =>
//       salesOrders
//         .filter(o => { const d = new Date(o.date || new Date().toISOString()); return d.getMonth() === m && d.getFullYear() === y && o.status !== 'cancelled' && o.status !== 'quote'; })
//         .reduce((sum, o) => sum + o.totalAmount, 0);
//     const monthlyRevenue = getMonthRevenue(currentMonth, currentYear);
//     const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
//     const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
//     const prevRevenue = getMonthRevenue(lastMonth, lastMonthYear);
//     const revenueTrend = prevRevenue > 0 ? (((monthlyRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) + '%' : '0%';
//     const revenueUp = monthlyRevenue >= prevRevenue;
//     const activeQuotes = salesOrders.filter(o => o.status === 'quote').length;
//     const pendingShipments = salesOrders.filter(o => o.status === 'confirmed').length;
//     const avgOrderValue = salesOrders.length > 0 ? monthlyRevenue / salesOrders.length : 0;
//     return { monthlyRevenue, revenueTrend, revenueUp, activeQuotes, pendingShipments, avgOrderValue };
//   }, [salesOrders]);

//   const uniqueSalespeople = useMemo(() => {
//     const people = new Set<string>();
//     salesOrders.forEach(order => { if (order.salesperson) people.add(order.salesperson); });
//     return Array.from(people).sort();
//   }, [salesOrders]);

//   const uniqueProducts = useMemo(() => {
//     const products = new Set<string>();
//     inventory.forEach(p => products.add(p.name));
//     return Array.from(products).sort();
//   }, [inventory]);

//   const uniqueBrands = useMemo(() => {
//     const brands = new Set<string>();
//     inventory.forEach(p => { if ((p as any).brand) brands.add((p as any).brand); });
//     return Array.from(brands).sort();
//   }, [inventory]);

//   const filteredOrders = useMemo(() => {
//     return salesOrders.filter(so => {
//       const matchesSearch =
//         (so.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (so.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (so.salesperson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (so.dealReference || '').toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesStatus = statusFilter === 'All' || so.status === normalizeStatus(statusFilter);
//       const matchesSalesperson = salespersonFilter === 'All' || so.salesperson === salespersonFilter;
//       const matchesProduct = productFilter === 'All' || so.items.some(item => item.description === productFilter || String(item.productId) === String(productFilter));
//       const matchesBrand = brandFilter === 'All' || so.items.some(item => {
//         const product = inventory.find(p => eqId(p.id, item.productId) || p.name === item.description);
//         return ((product as any)?.brand || '') === brandFilter;
//       });
//       const orderDate = new Date(so.date || new Date().toISOString());
//       const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
//       const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
//       const matchesDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
//       return matchesSearch && matchesStatus && matchesSalesperson && matchesDate && matchesProduct && matchesBrand;
//     });
//   }, [salesOrders, searchTerm, statusFilter, salespersonFilter, productFilter, brandFilter, dateFilter, inventory]);

//   const clearFilters = () => {
//     setSearchTerm(''); setStatusFilter('All'); setSalespersonFilter('All');
//     setProductFilter('All'); setBrandFilter('All'); setDateFilter({ start: '', end: '' });
//   };

//   const handleSelectAll = () => {
//     if (selectedDbIds.length === filteredOrders.length) setSelectedDbIds([]);
//     else setSelectedDbIds(filteredOrders.map(o => o.dbId));
//   };

//   const handleSelectOne = (dbId: number) => {
//     if (selectedDbIds.includes(dbId)) setSelectedDbIds(selectedDbIds.filter(x => x !== dbId));
//     else setSelectedDbIds([...selectedDbIds, dbId]);
//   };

//   const handleBulkAction = async (action: string) => {
//     if (selectedDbIds.length === 0) return;
//     if (action === 'confirmed' && !canBulkConfirm(salesOrders, selectedDbIds)) {
//       addNotification('warning', 'Bulk confirm is allowed for QUOTE orders only.'); return;
//     }
//     if (action === 'Delete') {
//       if (!canBulkDelete(salesOrders, selectedDbIds)) { addNotification('warning', 'Delete is allowed for QUOTE orders only.'); return; }
//       if (!window.confirm(`Are you sure you want to delete ${selectedDbIds.length} orders?`)) return;
//       try {
//         setIsDeleting(true);
//         await salesService.deleteOrders(selectedDbIds);
//         setSalesOrders(prev => prev.filter(o => !selectedDbIds.includes(o.dbId)));
//         addNotification('success', `Deleted ${selectedDbIds.length} sales orders.`);
//         setSelectedDbIds([]);
//       } catch (err: any) {
//         addNotification('error', err?.message || 'Failed to delete some orders.');
//       } finally { setIsDeleting(false); }
//       return;
//     }
//     if (action === 'Link') { setLinkOrderIdsInput(''); setIsLinkDealModalOpen(true); return; }
//     const newStatus = normalizeStatus(action);
//     if (newStatus === 'shipped' || newStatus === 'cancelled') {
//       addNotification('warning', 'Bulk shipped/cancelled requires allocations. Use per-order actions.'); return;
//     }
//     try {
//       setIsUpdating(true);
//       const payload: StatusChangePayload = { orders: selectedDbIds.map(id => ({ order_id: id })), status: newStatus };
//       await salesService.changeStatus(payload as any);
//       setSalesOrders(prev => prev.map(o => (selectedDbIds.includes(o.dbId) ? { ...o, status: newStatus } : o)));
//       addNotification('success', `Updated status to ${newStatus} for ${selectedDbIds.length} orders.`);
//       setLastUpdatedId('BULK'); setSelectedDbIds([]);
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to update some orders.');
//     } finally { setIsUpdating(false); }
//   };

//   const handleConfirmLinkToDeal = async () => {
//     if (!newDealRef.trim()) { addNotification('warning', 'Please enter a Deal Reference.'); return; }
//     try {
//       setIsUpdating(true);
//       let orderIds: number[] = [];
//       if (linkOrderIdsInput.trim()) {
//         orderIds = linkOrderIdsInput.split(/[,\s]+/).map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0);
//         if (orderIds.length === 0) { addNotification('warning', 'Please enter valid DB Order IDs.'); return; }
//       } else {
//         orderIds = selectedDbIds;
//         if (orderIds.length === 0) { addNotification('warning', 'Please select at least one order.'); return; }
//       }
//       await salesService.linkToDeal(orderIds, newDealRef.trim());
//       setSalesOrders(prev => prev.map(order => (orderIds.includes(order.dbId) ? { ...order, dealReference: newDealRef.trim() } : order)));
//       addNotification('success', `Linked ${orderIds.length} orders to deal "${newDealRef.trim()}"`);
//       setIsLinkDealModalOpen(false); setSelectedDbIds([]); setNewDealRef(''); setLinkOrderIdsInput('');
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to link orders.');
//     } finally { setIsUpdating(false); }
//   };

//   const openEditModal = (order: UiOrder) => {
//     if (!canEditOrder(order)) { addNotification('warning', 'Edit is allowed for QUOTE orders only.'); return; }
//     setEditingOrder(order);
//     setEditFormData({
//       customer_id: order.customer_id != null ? Number(order.customer_id) : undefined,
//       date: order.date || '',
//       salesperson: order.salesperson || '',
//       deal_reference: order.dealReference ?? null,
//       items: (order.items || []).map(item => ({
//         id: item.id,
//         product_id: item.product_id ?? Number(item.productId ?? 0),
//         description: item.description || '',
//         quantity: Number(item.quantity || 0),
//         unit_price: Number(item.unit_price ?? item.unitPrice ?? 0),
//       })),
//     });
//     setEditNewItem({ description: '', quantity: 1, unitPrice: 0 });
//     setEditSelectedProductId('');
//     setIsEditModalOpen(true);
//   };

//   // ✅ Edit modal uses `inventory` (which comes from API)
//   const handleProductSelectForEdit = (productId: string) => {
//     setEditSelectedProductId(productId);
//     const product = inventory.find(p => eqId(p.id, productId));
//     if (product) setEditNewItem(prev => ({ ...prev, description: product.name, unitPrice: (product as any).price ?? 0 }));
//     else setEditNewItem(prev => ({ ...prev, description: '', unitPrice: 0 }));
//   };

//   const addEditItemToOrder = () => {
//     if (!editNewItem.description || !editNewItem.quantity || editNewItem.unitPrice === undefined) return;
//     const product = inventory.find(p => p.name === editNewItem.description || eqId(p.id, editSelectedProductId));
//     const item = {
//       product_id: product ? Number((product as any).id) : 0,
//       description: String(editNewItem.description),
//       quantity: Number(editNewItem.quantity),
//       unit_price: Number(editNewItem.unitPrice),
//     };
//     setEditFormData((prev: any) => ({ ...prev, items: [...(prev.items || []), item] }));
//     setEditNewItem({ description: '', quantity: 1, unitPrice: 0 });
//     setEditSelectedProductId('');
//   };

//   const removeEditItem = (idx: number) => {
//     setEditFormData((prev: any) => ({ ...prev, items: (prev.items || []).filter((_: any, i: number) => i !== idx) }));
//   };

//   const handleUpdateOrder = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingOrder) return;
//     if (editingOrder.status !== 'quote') { addNotification('warning', 'Update is allowed for QUOTE orders only.'); return; }
//     try {
//       setIsUpdating(true);
//       const payload: any = {};
//       if (editFormData.customer_id != null) payload.customer_id = editFormData.customer_id;
//       if (editFormData.date) payload.date = editFormData.date;
//       if (editFormData.salesperson !== undefined) payload.salesperson = editFormData.salesperson;
//       if (editFormData.deal_reference !== undefined) payload.deal_reference = editFormData.deal_reference;
//       if (Array.isArray(editFormData.items)) {
//         payload.items = editFormData.items.map((item: any) => ({
//           ...(item.id != null && { id: item.id }),
//           product_id: item.product_id, description: item.description,
//           quantity: item.quantity, unit_price: item.unit_price,
//         }));
//       }
//       const updated = await salesService.updateOrder(String(editingOrder.dbId), payload);
//       const mapped = mapApiOrderToUi(updated);
//       setSalesOrders(prev => prev.map(o => (o.dbId === editingOrder.dbId ? mapped : o)));
//       if (selectedSO?.dbId === editingOrder.dbId) setSelectedSO(mapped);
//       setIsEditModalOpen(false); setEditingOrder(null);
//       addNotification('success', 'Sales order updated.');
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to update sales order.');
//     } finally { setIsUpdating(false); }
//   };

//   // ✅ Create modal uses `inventory` (which comes from API)
//   const handleProductSelect = (productId: string) => {
//     setSelectedProductId(productId);
//     const product = inventory.find(p => eqId(p.id, productId));
//     if (product) setNewItem(prev => ({ ...prev, description: product.name, unitPrice: (product as any).price ?? 0 }));
//     else setNewItem(prev => ({ ...prev, description: '', unitPrice: 0 }));
//   };

//   const addItemToOrder = () => {
//     if (!newItem.description || !newItem.quantity || newItem.unitPrice === undefined) return;
//     const qty = Number(newItem.quantity);
//     const unit = Number(newItem.unitPrice);
//     const item: InvoiceItem = {
//       id: Math.random().toString(36).substr(2, 9),
//       productId: selectedProductId || undefined,
//       description: String(newItem.description),
//       quantity: qty, unitPrice: unit, total: qty * unit,
//     };
//     setFormData((prev: any) => ({ ...prev, items: [...(prev.items || []), item] }));
//     setNewItem({ description: '', quantity: 1, unitPrice: 0 });
//     setSelectedProductId('');
//   };

//   const handleCreateOrder = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!String(formData.customerId || '').trim()) { addNotification('warning', 'Please select a customer.'); return; }
//     try {
//       setIsCreating(true);
//       const payload: any = {
//         customer_id: Number(formData.customerId),
//         date: formData.date || new Date().toISOString().split('T')[0],
//         status: normalizeStatus(formData.status || 'quote'),
//         salesperson: formData.salesperson || 'Unassigned',
//         deal_reference: formData.dealReference || null,
//         items: (formData.items || []).map((item: any) => {
//           const base: any = { description: item.description, quantity: Number(item.quantity), unit_price: Number(item.unitPrice) };
//           if (item.productId) base.product_id = Number(item.productId);
//           return base;
//         }),
//       };
//       const created = await salesService.createOrder(payload);
//       const mapped = mapApiOrderToUi(created);
//       setSalesOrders(prev => [mapped, ...prev]);
//       setIsCreateModalOpen(false);
//       setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], status: 'quote', items: [], salesperson: '', dealReference: '' });
//       addNotification('success', 'Sales Order created successfully.');
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to create sales order.');
//     } finally { setIsCreating(false); }
//   };

//   const requestStatusChange = async (order: UiOrder, status: OrderStatus) => {
//     const next = normalizeStatus(status);
//     const allowed = getAllowedNextStatuses(order.status);
//     if (!allowed.includes(next)) { addNotification('warning', `Not allowed: ${order.status} → ${next}`); return; }
//     const needsAllocations = next === 'shipped' || (next === 'cancelled' && order.status === 'shipped');
//     if (needsAllocations) {
//       const freshLocations = await fetchLocations();
//       const suggested = suggestAllocations(order.items, freshLocations);
//       setAllocationState(suggested);
//       setPendingOrderForStatus(order); setPendingStatus(next); setIsAllocationsModalOpen(true);
//       return;
//     }
//     try {
//       setIsUpdating(true);
//       const payload: StatusChangePayload = { orders: [{ order_id: order.dbId }], status: next };
//       await salesService.changeStatus(payload as any);
//       setSalesOrders(prev => prev.map(o => (o.dbId === order.dbId ? { ...o, status: next } : o)));
//       setLastUpdatedId(order.id);
//       addNotification('success', `Order ${order.id} status updated to ${next}.`);
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to update order status.');
//     } finally { setIsUpdating(false); }
//   };

//   const confirmAllocationsAndChangeStatus = async () => {
//     if (!pendingOrderForStatus || !pendingStatus) return;
//     const isShipped = pendingStatus === 'shipped';
//     const validations = validateAllocations(pendingOrderForStatus.items, allocationState, locations, isShipped);
//     let hasErrors = false;
//     validations.forEach(v => { if (!v.valid) hasErrors = true; });
//     if (hasErrors) { addNotification('error', 'Please fix validation errors before confirming.'); return; }
//     try {
//       setIsUpdating(true);
//       const payload = buildAllocationsPayload(pendingOrderForStatus, allocationState, pendingStatus);
//       await salesService.changeStatus(payload as any);
//       setSalesOrders(prev => prev.map(o => (o.dbId === pendingOrderForStatus.dbId ? { ...o, status: pendingStatus } : o)));
//       setLastUpdatedId(pendingOrderForStatus.id);
//       addNotification('success', `Order ${pendingOrderForStatus.id} status updated to ${pendingStatus}.`);
//       setIsAllocationsModalOpen(false); setPendingOrderForStatus(null); setPendingStatus(null); setAllocationState({});
//     } catch (err: any) {
//       addNotification('error', err?.message || 'Failed to update order status.');
//     } finally { setIsUpdating(false); }
//   };

//   const generatePDF = (order: UiOrder) => {
//     const doc = new jsPDF();
//     doc.setFontSize(20); doc.setTextColor(79, 70, 229); doc.text('Nexus ERP', 14, 22);
//     doc.setFontSize(16); doc.setTextColor(0);
//     doc.text(order.status === 'quote' ? 'SALES QUOTE' : 'SALES ORDER', 196, 22, { align: 'right' });
//     doc.setFontSize(10); doc.setTextColor(100);
//     doc.text(`Order #: ${order.id}`, 196, 30, { align: 'right' });
//     doc.text(`Date: ${order.date || ''}`, 196, 34, { align: 'right' });
//     autoTable(doc, {
//       startY: 75,
//       head: [['Item', 'Quantity', 'Unit Price', 'Total']],
//       body: (order.items || []).map(item => [item.description, item.quantity, `$${Number(item.unitPrice).toFixed(2)}`, `$${Number(item.total).toFixed(2)}`]),
//       theme: 'striped', headStyles: { fillColor: [79, 70, 229], textColor: 255 },
//     });
//     doc.save(`${order.id}.pdf`);
//   };

//   const generateFilteredReport = () => {
//     if (filteredOrders.length === 0) { addNotification('warning', 'No data matches your current filters to generate a report.'); return; }
//     const doc = new jsPDF();
//     doc.setFontSize(22); doc.setTextColor(79, 70, 229); doc.text('Sales Performance Report', 14, 20);
//     doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
//     doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
//     addNotification('success', 'Comprehensive Sales Report generated.');
//   };

//   const generateAnalyticsPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(20); doc.setTextColor(79, 70, 229); doc.text('Nexus ERP - Sales Analytics Report', 14, 22);
//     doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
//     doc.save('Sales_Analytics_Report.pdf');
//   };

//   const linkedOrdersForSelected = useMemo(() => {
//     if (!selectedSO || !selectedSO.dealReference) return [];
//     return salesOrders.filter(o => o.dealReference === selectedSO.dealReference && o.dbId !== selectedSO.dbId);
//   }, [selectedSO, salesOrders]);

//   const bulkDeleteAllowed = canBulkDelete(salesOrders, selectedDbIds);
//   const bulkConfirmAllowed = canBulkConfirm(salesOrders, selectedDbIds);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-semibold text-slate-900">Sales</h2>
//           <p className="text-sm text-slate-500">Orders, quotes, analytics, and reporting</p>
//         </div>
//         <div className="flex flex-wrap items-center gap-2">
//           <button className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${viewMode === 'orders' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`} onClick={() => setViewMode('orders')}>
//             <Truck size={16} /> Orders
//           </button>
//           <button className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`} onClick={() => setViewMode('analytics')}>
//             <TrendingUp size={16} /> Analytics
//           </button>
//           <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" onClick={() => setIsCreateModalOpen(true)} disabled={isAccessDenied} title={isAccessDenied ? 'Upgrade to create orders' : 'Create'}>
//             <Plus size={16} /> Create
//           </button>
//           <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={generateFilteredReport} disabled={filteredOrders.length === 0}>
//             <Download size={16} /> Report
//           </button>
//         </div>
//       </div>

//       {isAccessDenied && (
//         <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 flex items-center gap-2">
//           <Lock size={18} /> Your plan is Free. Some actions are disabled.
//         </div>
//       )}

//       {/* Orders */}
//       {viewMode === 'orders' && (
//         <>
//           <div className="flex flex-col xl:flex-row gap-4">
//             <div className="shrink-0">
//               <div className="inline-flex h-10 items-center gap-2 px-3 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500">
//                 <Search className="text-slate-400 shrink-0" size={18} />
//                 <input type="text" placeholder={t?.('common.search') || 'Search...'} className="w-full bg-transparent outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-3 items-center">
//               <div className="flex items-center gap-2">
//                 <Filter size={18} className="text-slate-400" />
//                 <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//                   <option value="All">All Status</option>
//                   <option value="quote">quote</option>
//                   <option value="confirmed">confirmed</option>
//                   <option value="shipped">shipped</option>
//                   <option value="completed">completed</option>
//                   <option value="cancelled">cancelled</option>
//                 </select>
//               </div>
//               <div className="flex items-center gap-2">
//                 <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))} />
//                 <span className="text-slate-400 text-sm">to</span>
//                 <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))} />
//               </div>
//               <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={clearFilters}>
//                 <XCircle size={16} /> Clear
//               </button>
//             </div>
//           </div>

//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//             <div className="text-sm text-slate-500">
//               Showing <span className="text-slate-900 font-medium">{filteredOrders.length}</span> orders
//               {selectedDbIds.length > 0 && <> | Selected <span className="text-slate-900 font-medium">{selectedDbIds.length}</span></>}
//             </div>
//             <div className="flex flex-wrap gap-2 items-center">
//               <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={selectedDbIds.length === 0 || isMutating} onClick={() => handleBulkAction('Link')}>
//                 <Send size={16} /> Link Deal
//               </button>
//               <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={!bulkConfirmAllowed || isMutating} onClick={() => handleBulkAction('confirmed')} title={!bulkConfirmAllowed ? 'Confirm is only for QUOTE orders' : 'Confirm'}>
//                 <CheckCircle size={16} /> Mark confirmed
//               </button>
//               {bulkDeleteAllowed ? (
//                 <button className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={selectedDbIds.length === 0 || isMutating} onClick={() => handleBulkAction('Delete')}>
//                   {isDeleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
//                 </button>
//               ) : (
//                 <button className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-300 text-sm flex items-center gap-2 cursor-not-allowed" disabled title="Delete is only for QUOTE orders">
//                   <Trash2 size={16} /> Delete
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
//             <div className="overflow-auto">
//               <table className="min-w-full text-sm">
//                 <thead className="bg-slate-50 text-slate-600">
//                   <tr>
//                     <th className="p-3 w-10">
//                       <button onClick={handleSelectAll} className="inline-flex items-center justify-center">
//                         {selectedDbIds.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-400" />}
//                       </button>
//                     </th>
//                     <th className="p-3 text-left">Order</th>
//                     <th className="p-3 text-left">Customer</th>
//                     <th className="p-3 text-left">Date</th>
//                     <th className="p-3 text-left">Status</th>
//                     <th className="p-3 text-left">Salesperson</th>
//                     <th className="p-3 text-right">Total</th>
//                     <th className="p-3 text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {isLoadingOrders ? (
//                     <tr><td colSpan={8} className="p-6 text-center text-slate-500"><div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Loading orders...</div></td></tr>
//                   ) : ordersError ? (
//                     <tr><td colSpan={8} className="p-6 text-center text-red-600">Failed to load orders.</td></tr>
//                   ) : filteredOrders.length === 0 ? (
//                     <tr><td colSpan={8} className="p-6 text-center text-slate-500">No orders found.</td></tr>
//                   ) : (
//                     filteredOrders.map(order => (
//                       <tr key={order.dbId} className="border-t border-slate-100 hover:bg-slate-50">
//                         <td className="p-3">
//                           <button onClick={() => handleSelectOne(order.dbId)} className="inline-flex items-center justify-center">
//                             {selectedDbIds.includes(order.dbId) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-400" />}
//                           </button>
//                         </td>
//                         <td className="p-3 font-medium text-slate-900">{order.id}</td>
//                         <td className="p-3 text-slate-700">{order.customerName || '-'}</td>
//                         <td className="p-3 text-slate-700">{order.date || '-'}</td>
//                         <td className="p-3">
//                           <span className="px-2 py-1 rounded-full text-xs border border-slate-200 bg-white text-slate-700">{order.status}</span>
//                           {lastUpdatedId === order.id && <span className="ml-2 text-xs text-green-600">Updated</span>}
//                         </td>
//                         <td className="p-3 text-slate-700">{order.salesperson || '-'}</td>
//                         <td className="p-3 text-right text-slate-900 font-medium">${Number(order.totalAmount || 0).toLocaleString()}</td>
//                         <td className="p-3">
//                           <div className="flex justify-end gap-2">
//                             <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => setSelectedSO(order)} title="View"><Eye size={16} /></button>
//                             {canEditOrder(order) && (
//                               <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => openEditModal(order)} title="Edit (Quote only)" disabled={isMutating}><Pencil size={16} /></button>
//                             )}
//                             <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => generatePDF(order)} title="PDF"><Download size={16} /></button>
//                             {order.status === 'quote' && (
//                               <button className="px-2 py-1 rounded-lg bg-slate-900 text-white" onClick={() => requestStatusChange(order, 'confirmed')} disabled={isMutating} title="Confirm">Confirm</button>
//                             )}
//                             {order.status === 'confirmed' && (
//                               <>
//                                 <button className="px-2 py-1 rounded-lg bg-indigo-600 text-white" onClick={() => requestStatusChange(order, 'shipped')} disabled={isMutating} title="Ship">Ship</button>
//                                 <button className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700" onClick={() => requestStatusChange(order, 'cancelled')} disabled={isMutating} title="Cancel">Cancel</button>
//                               </>
//                             )}
//                             {order.status === 'shipped' && (
//                               <>
//                                 <button className="px-2 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => requestStatusChange(order, 'completed')} disabled={isMutating} title="Complete">Complete</button>
//                                 <button className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700" onClick={() => requestStatusChange(order, 'cancelled')} disabled={isMutating} title="Cancel">Cancel</button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {selectedSO && (
//               <div className="border-t border-slate-200 p-4">
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <div className="text-slate-900 font-semibold">Order {selectedSO.id}</div>
//                     <div className="text-sm text-slate-500">{selectedSO.customerName} • {selectedSO.status} • ${Number(selectedSO.totalAmount || 0).toLocaleString()}</div>
//                     {selectedSO.dealReference && <div className="text-sm text-slate-600 mt-1">Deal: <span className="font-medium">{selectedSO.dealReference}</span></div>}
//                   </div>
//                   <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={() => setSelectedSO(null)}>
//                     <X size={16} /> Close
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {/* Analytics */}
//       {viewMode === 'analytics' && (
//         <div className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <StatsCard title="Revenue" value={`$${Number(analyticsData.totalRevenue || 0).toLocaleString()}`} trend={dashboardMetrics.revenueTrend} trendUp={dashboardMetrics.revenueUp} icon={<TrendingUp size={20} />} color="bg-indigo-500" />
//             <StatsCard title="Orders" value={String(analyticsData.totalOrders || 0)} trend="Total" trendUp={true} icon={<CheckCircle size={20} />} color="bg-emerald-500" />
//             <StatsCard title="Avg Order" value={`$${Number(analyticsData.averageOrderValue || 0).toLocaleString()}`} trend="Average" trendUp={true} icon={<CheckCircle size={20} />} color="bg-amber-500" />
//             <StatsCard title="Pending Shipments" value={String(dashboardMetrics.pendingShipments || 0)} trend="confirmed" trendUp={false} icon={<Truck size={20} />} color="bg-blue-500" />
//           </div>
//           {isLoadingAnalytics ? (
//             <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500"><div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Loading analytics...</div></div>
//           ) : analyticsError ? (
//             <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2"><AlertCircle size={18} />{analyticsError}</div>
//           ) : (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="rounded-xl border border-slate-200 bg-white p-4">
//                 <div className="text-sm font-semibold text-slate-900 mb-3">Monthly Revenue</div>
//                 <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analyticsData.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="sales" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
//               </div>
//               <div className="rounded-xl border border-slate-200 bg-white p-4">
//                 <div className="text-sm font-semibold text-slate-900 mb-3">Sales by Person</div>
//                 <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analyticsData.salesPersonList}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" /></BarChart></ResponsiveContainer></div>
//               </div>
//               <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
//                 <div className="flex items-center justify-between gap-3 mb-3">
//                   <div className="text-sm font-semibold text-slate-900">By Status</div>
//                   <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={generateAnalyticsPDF}><Download size={16} /> PDF</button>
//                 </div>
//                 <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Array.isArray(analyticsData.byStatus) ? analyticsData.byStatus : []} dataKey="count" nameKey="status" outerRadius={110} label>{(Array.isArray(analyticsData.byStatus) ? analyticsData.byStatus : []).map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
//       {isCreateModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="w-full max-w-3xl rounded-xl bg-white border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col" dir="ltr">
//             <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
//               <div className="font-semibold text-slate-900">Create Sales Order</div>
//               <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
//             </div>

//             <form onSubmit={handleCreateOrder} className="p-4 space-y-4 overflow-y-auto flex-1">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <div className="flex flex-col gap-1">
//                   <label className="text-xs font-medium text-slate-500">Customer *</label>
//                   <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.customerId} onChange={(e) => setFormData((p: any) => ({ ...p, customerId: e.target.value }))} required>
//                     <option value="">Select customer</option>
//                     {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name || `Customer ${c.id}`}</option>)}
//                   </select>
//                 </div>
//                 <div className="flex flex-col gap-1">
//                   <label className="text-xs font-medium text-slate-500">Date</label>
//                   <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.date} onChange={(e) => setFormData((p: any) => ({ ...p, date: e.target.value }))} />
//                 </div>
//                 <div className="flex flex-col gap-1">
//                   <label className="text-xs font-medium text-slate-500">Salesperson</label>
//                   <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="e.g. John Smith" value={formData.salesperson} onChange={(e) => setFormData((p: any) => ({ ...p, salesperson: e.target.value }))} />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div className="flex flex-col gap-1">
//                   <label className="text-xs font-medium text-slate-500">Deal Reference</label>
//                   <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference (optional)" value={formData.dealReference} onChange={(e) => setFormData((p: any) => ({ ...p, dealReference: e.target.value }))} />
//                 </div>
//                 <div className="flex flex-col gap-1">
//                   <label className="text-xs font-medium text-slate-500">Status</label>
//                   <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.status} onChange={(e) => setFormData((p: any) => ({ ...p, status: normalizeStatus(e.target.value) }))}>
//                     <option value="quote">Quote</option>
//                     <option value="confirmed">Confirmed</option>
//                   </select>
//                 </div>
//               </div>

//               {/* ── ADD ITEM ── */}
//               <div className="rounded-lg border border-slate-200 p-3 space-y-3">
//                 <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
//                   Add Item
//                   {isLoadingInventory && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader size={12} className="animate-spin" /> Loading products…</span>}
//                 </div>

//                 <div className="grid grid-cols-12 gap-2 items-end">
//                   {/* ✅ Product dropdown — populated from API */}
//                   <div className="col-span-5 flex flex-col gap-1">
//                     <label className="text-xs text-slate-500">Product</label>
//                     <select
//                       className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
//                       value={selectedProductId}
//                       onChange={(e) => handleProductSelect(e.target.value)}
//                       disabled={isLoadingInventory}
//                     >
//                       <option value="">{isLoadingInventory ? 'Loading…' : 'Select product'}</option>
//                       {inventory.map((p: any) => (
//                         <option key={String(p.id)} value={String(p.id)}>
//                           {p.name}{(p.price ?? p.unit_price) != null ? ` — $${Number(p.price ?? p.unit_price).toFixed(2)}` : ''}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="col-span-2 flex flex-col gap-1">
//                     <label className="text-xs text-slate-500">Qty</label>
//                     <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="1" min={1} value={Number(newItem.quantity ?? 1)} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
//                   </div>

//                   <div className="col-span-3 flex flex-col gap-1">
//                     <label className="text-xs text-slate-500">Unit Price</label>
//                     <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="0.00" min={0} value={Number(newItem.unitPrice ?? 0)} onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
//                   </div>

//                   <div className="col-span-2">
//                     <button type="button" className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-40" onClick={addItemToOrder} disabled={!selectedProductId}>
//                       <Plus size={15} /> Add
//                     </button>
//                   </div>
//                 </div>

//                 {/* Added items list */}
//                 {(formData.items || []).length > 0 && (
//                   <div className="space-y-2 pt-2 border-t border-slate-100">
//                     <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items ({formData.items.length})</div>
//                     <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium px-1">
//                       <div className="col-span-5">Product</div>
//                       <div className="col-span-2 text-center">Qty</div>
//                       <div className="col-span-2 text-right">Unit Price</div>
//                       <div className="col-span-2 text-right">Total</div>
//                       <div className="col-span-1" />
//                     </div>
//                     {(formData.items || []).map((it: any, idx: number) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
//                         <div className="col-span-5 text-sm font-medium text-slate-800 truncate">{it.description}</div>
//                         <div className="col-span-2 text-center"><span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">{it.quantity}</span></div>
//                         <div className="col-span-2 text-right text-sm text-slate-600">${Number(it.unitPrice || 0).toFixed(2)}</div>
//                         <div className="col-span-2 text-right text-sm font-semibold text-slate-900">${(Number(it.quantity) * Number(it.unitPrice || 0)).toFixed(2)}</div>
//                         <div className="col-span-1 flex justify-end">
//                           <button type="button" className="p-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors" onClick={() => setFormData((p: any) => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) }))} title="Remove item"><X size={13} /></button>
//                         </div>
//                       </div>
//                     ))}
//                     <div className="flex justify-end pt-1 border-t border-slate-200">
//                       <div className="text-sm font-semibold text-slate-900">
//                         Order Total: <span className="text-indigo-600">${(formData.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice || 0), 0).toFixed(2)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center justify-end gap-2 pt-2">
//                 <button type="button" className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
//                 <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60 hover:bg-indigo-700 transition-colors" disabled={isCreating}>
//                   {isCreating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} Create Order
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ── LINK DEAL MODAL ───────────────────────────────────────────────────── */}
//       {isLinkDealModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 overflow-hidden">
//             <div className="flex items-center justify-between p-4 border-b border-slate-200">
//               <div className="font-semibold text-slate-900">Link Orders to Deal</div>
//               <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsLinkDealModalOpen(false)}><X size={18} /></button>
//             </div>
//             <div className="p-4 space-y-3">
//               <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference" value={newDealRef} onChange={(e) => setNewDealRef(e.target.value)} />
//               <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" rows={3} placeholder="Optional: paste DB order ids (e.g. 6, 7, 8). If empty, we'll use your current selection." value={linkOrderIdsInput} onChange={(e) => setLinkOrderIdsInput(e.target.value)} />
//               <div className="flex items-center justify-end gap-2 pt-2">
//                 <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm" onClick={() => setIsLinkDealModalOpen(false)}>Cancel</button>
//                 <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" onClick={handleConfirmLinkToDeal} disabled={isUpdating}>
//                   {isUpdating ? <Loader size={16} className="animate-spin" /> : <Send size={16} />} Link
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── ALLOCATIONS MODAL ─────────────────────────────────────────────────── */}
//       {isAllocationsModalOpen && pendingOrderForStatus && pendingStatus && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
//           <div className="w-full max-w-4xl rounded-xl bg-white border border-slate-200 my-8">
//             <div className="flex items-center justify-between p-4 border-b border-slate-200">
//               <div>
//                 <div className="font-semibold text-slate-900">Allocate Inventory • Order {pendingOrderForStatus.id}</div>
//                 <div className="text-sm text-slate-500 mt-1">Status: {pendingOrderForStatus.status} → {pendingStatus}</div>
//               </div>
//               <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => { setIsAllocationsModalOpen(false); setAllocationState({}); }}><X size={18} /></button>
//             </div>
//             <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
//               {isLoadingLocations ? (
//                 <div className="text-center py-6 text-slate-500"><Loader className="animate-spin inline-block" size={24} /><div className="mt-2">Loading locations...</div></div>
//               ) : locationsError ? (
//                 <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2"><AlertCircle size={18} />{locationsError}</div>
//               ) : locations.length === 0 ? (
//                 <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 flex items-center gap-2"><AlertCircle size={18} />No locations found. Please add locations first.</div>
//               ) : (
//                 pendingOrderForStatus.items.map((item) => {
//                   if (!item.id) return null;
//                   const allocations = allocationState[item.id] || [];
//                   const stockMap = buildStockMap(locations);
//                   const validations = validateAllocations([item], allocationState, locations, pendingStatus === 'shipped');
//                   const validation = validations.get(item.id);
//                   const selectedLocationIds = allocations.map(a => a.location_id);
//                   return (
//                     <div key={item.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
//                       <div className="flex items-start justify-between">
//                         <div>
//                           <div className="font-medium text-slate-900">{item.description}</div>
//                           <div className="text-sm text-slate-500">Required: <span className="font-semibold">{item.quantity}</span> units{validation && <span className="ml-2">• Available: <span className="font-semibold">{validation.available}</span> units</span>}</div>
//                         </div>
//                         {validation && !validation.valid && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} /><span className="font-medium">{validation.error}</span></div>}
//                         {validation && validation.valid && <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle size={16} /><span className="font-medium">Valid</span></div>}
//                       </div>
//                       {validation && validation.available < validation.requiredQty && pendingStatus === 'shipped' && (
//                         <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm flex items-start gap-2">
//                           <AlertCircle size={16} className="shrink-0 mt-0.5" />
//                           <div><strong>Insufficient stock:</strong> Required {validation.requiredQty}, available {validation.available}.</div>
//                         </div>
//                       )}
//                       <div className="space-y-2">
//                         {allocations.length === 0 && <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">No allocations yet. Click "Add Location" below to start.</div>}
//                         {allocations.map((alloc, rowIndex) => {
//                           const available = item.product_id ? (stockMap.get(`${alloc.location_id}-${item.product_id}`) || 0) : 0;
//                           return (
//                             <div key={rowIndex} className="grid grid-cols-12 gap-2 items-center">
//                               <div className="col-span-5">
//                                 <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500" value={alloc.location_id} onChange={(e) => updateAllocation(item.id!, rowIndex, 'location_id', Number(e.target.value))}>
//                                   {locations.map(loc => <option key={loc.id} value={loc.id} disabled={selectedLocationIds.includes(loc.id) && loc.id !== alloc.location_id}>{loc.name}{selectedLocationIds.includes(loc.id) && loc.id !== alloc.location_id && ' (already selected)'}</option>)}
//                                 </select>
//                               </div>
//                               <div className="col-span-3"><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Quantity" min={0} value={alloc.quantity} onChange={(e) => updateAllocation(item.id!, rowIndex, 'quantity', Number(e.target.value))} /></div>
//                               <div className="col-span-3 text-sm text-slate-600"><span className="font-medium">Available:</span> {available}</div>
//                               <div className="col-span-1 flex justify-end"><button type="button" className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors" onClick={() => removeAllocationRow(item.id!, rowIndex)}><Trash2 size={16} /></button></div>
//                             </div>
//                           );
//                         })}
//                         <button type="button" className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors" onClick={() => addAllocationRow(item.id!)}>
//                           <Plus size={16} /> Add Location
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//             <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
//               <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors" onClick={() => { setIsAllocationsModalOpen(false); setAllocationState({}); }}>Cancel</button>
//               <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors" onClick={confirmAllocationsAndChangeStatus} disabled={isUpdating || locations.length === 0}>
//                 {isUpdating ? <><Loader size={16} className="animate-spin" /> Updating...</> : <><CheckCircle size={16} /> Confirm & Update Status</>}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
//       {isEditModalOpen && editingOrder && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="w-full max-w-3xl rounded-xl bg-white border border-slate-200 overflow-hidden" dir="ltr">
//             <div className="flex items-center justify-between p-4 border-b border-slate-200">
//               <div className="font-semibold text-slate-900">Edit Sales Order (Quote only)</div>
//               <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsEditModalOpen(false)}><X size={18} /></button>
//             </div>
//             <form onSubmit={handleUpdateOrder} className="p-4 space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={editFormData.date} onChange={(e) => setEditFormData((p: any) => ({ ...p, date: e.target.value }))} />
//                 <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Salesperson" value={editFormData.salesperson} onChange={(e) => setEditFormData((p: any) => ({ ...p, salesperson: e.target.value }))} />
//                 <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference" value={editFormData.deal_reference ?? ''} onChange={(e) => setEditFormData((p: any) => ({ ...p, deal_reference: e.target.value || null }))} />
//               </div>
//               <div className="rounded-lg border border-slate-200 p-3 space-y-3">
//                 <div className="text-sm font-semibold text-slate-900">Add Item</div>
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//                   {/* ✅ Edit modal product dropdown — also from API */}
//                   <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={editSelectedProductId} onChange={(e) => handleProductSelectForEdit(e.target.value)} disabled={isLoadingInventory}>
//                     <option value="">{isLoadingInventory ? 'Loading…' : 'Select product'}</option>
//                     {inventory.map((p: any) => (
//                       <option key={String(p.id)} value={String(p.id)}>
//                         {p.name}{(p.price ?? p.unit_price) != null ? ` — $${Number(p.price ?? p.unit_price).toFixed(2)}` : ''}
//                       </option>
//                     ))}
//                   </select>
//                   <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Qty" min={1} value={Number(editNewItem.quantity ?? 1)} onChange={(e) => setEditNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
//                   <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Unit price" min={0} value={Number(editNewItem.unitPrice ?? 0)} onChange={(e) => setEditNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
//                   <button type="button" className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-40" onClick={addEditItemToOrder} disabled={!editSelectedProductId}>Add</button>
//                 </div>
//                 <div className="space-y-2">
//                   {(editFormData.items || []).map((it: any, idx: number) => (
//                     <div key={idx} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
//                       <div className="text-sm text-slate-700">{it.description} • Qty {it.quantity} • ${Number(it.unit_price || 0).toLocaleString()}</div>
//                       <button type="button" className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs" onClick={() => removeEditItem(idx)}>Remove</button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="flex items-center justify-end gap-2 pt-2">
//                 <button type="button" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
//                 <button type="submit" className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" disabled={isUpdating}>
//                   {isUpdating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} Update
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SalesView;


// SalesView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { InvoiceItem, Product, Customer, Subscription } from '../types';

import {
  Plus,
  Search,
  Download,
  Truck,
  CheckCircle,
  X,
  Send,
  Eye,
  AlertCircle,
  Filter,
  XCircle,
  Lock,
  CheckSquare,
  Square,
  Trash2,
  Loader,
  TrendingUp,
  Pencil,
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import StatsCard from './StatsCard';
import { salesService } from '../api/salesService';
import { crmService } from '../api/crmService';
import { inventoryService } from '../api/inventoryService';

interface SalesViewProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
  customers?: Customer[];
  salesOrders?: any[];
  setSalesOrders?: React.Dispatch<React.SetStateAction<any[]>>;
  subscription?: Subscription;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type OrderStatus = 'quote' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

type Location = {
  id: number;
  name: string;
  allocations?: Array<{
    product_id: number;
    location_id: number;
    quantity: number;
  }>;
};

type AllocationRow = {
  location_id: number;
  quantity: number;
};

type AllocationState = Record<number, AllocationRow[]>;

type ItemValidation = {
  requiredQty: number;
  totalAllocated: number;
  available: number;
  valid: boolean;
  error?: string;
};

const normalizeStatus = (s: any): OrderStatus => {
  const v = String(s ?? '').toLowerCase().trim();
  if (v === 'complete') return 'completed';
  if (v === 'completed') return 'completed';
  if (v === 'quote') return 'quote';
  if (v === 'confirmed') return 'confirmed';
  if (v === 'shipped') return 'shipped';
  if (v === 'cancelled' || v === 'canceled') return 'cancelled';
  return 'quote';
};

const eqId = (a: any, b: any) => String(a ?? '') === String(b ?? '');

type UiOrder = {
  id: string;
  dbId: number;
  customerName?: string;
  customer_id?: number;
  date?: string;
  status: OrderStatus;
  salesperson?: string;
  dealReference?: string | null;
  totalAmount: number;
  items: Array<{
    id?: number;
    productId?: string;
    product_id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    unit_price?: number;
    total: number;
  }>;
};

const mapApiOrderToUi = (order: any): UiOrder => {
  const displayId = (order?.order_no ?? order?.id ?? '').toString();
  const dbId = Number(order?.id ?? 0);
  const items = Array.isArray(order?.items) ? order.items : [];
  const mappedItems = items.map((item: any) => {
    const qty = Number(item?.quantity ?? 0);
    const unit = Number(item?.unit_price ?? item?.unitPrice ?? 0);
    const total = Number(item?.total ?? qty * unit);
    return {
      id: item?.id != null ? Number(item.id) : undefined,
      productId: item?.product_id != null ? String(item.product_id) : item?.productId != null ? String(item.productId) : undefined,
      product_id: item?.product_id != null ? Number(item.product_id) : undefined,
      description: String(item?.description ?? ''),
      quantity: qty,
      unitPrice: unit,
      unit_price: item?.unit_price != null ? Number(item.unit_price) : undefined,
      total,
    };
  });
  const totalAmount = Number(order?.total_amount ?? order?.totalAmount ?? 0);
  return {
    id: displayId,
    dbId,
    customerName: order?.customer_name ?? order?.customerName ?? '',
    customer_id: order?.customer_id != null ? Number(order.customer_id) : undefined,
    date: order?.date ?? '',
    status: normalizeStatus(order?.status),
    salesperson: order?.salesperson ?? '',
    dealReference: order?.deal_reference ?? order?.dealReference ?? null,
    totalAmount,
    items: mappedItems,
  };
};

type StatusChangePayload = {
  orders: Array<{
    order_id: number;
    items?: Array<{
      item_id: number;
      allocations: Array<{ location_id: number; quantity: number }>;
    }>;
  }>;
  status: OrderStatus;
};

const getAllowedNextStatuses = (current: OrderStatus): OrderStatus[] => {
  if (current === 'quote') return ['confirmed'];
  if (current === 'confirmed') return ['shipped', 'cancelled'];
  if (current === 'shipped') return ['completed', 'cancelled'];
  return [];
};

const canEditOrder = (order: UiOrder) => order.status === 'quote';

const canBulkDelete = (orders: UiOrder[], selectedDbIds: number[]) => {
  if (selectedDbIds.length === 0) return false;
  const selected = orders.filter(o => selectedDbIds.includes(o.dbId));
  return selected.length > 0 && selected.every(o => o.status === 'quote');
};

const canBulkConfirm = (orders: UiOrder[], selectedDbIds: number[]) => {
  if (selectedDbIds.length === 0) return false;
  const selected = orders.filter(o => selectedDbIds.includes(o.dbId));
  return selected.length > 0 && selected.every(o => o.status === 'quote');
};

const SalesView: React.FC<SalesViewProps> = ({ inventory: propInventory, setInventory, subscription }) => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  const [viewMode, setViewMode] = useState<'orders' | 'analytics'>('orders');
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<UiOrder | null>(null);

  const [isLinkDealModalOpen, setIsLinkDealModalOpen] = useState(false);
  const [newDealRef, setNewDealRef] = useState('');
  const [linkOrderIdsInput, setLinkOrderIdsInput] = useState('');

  const [selectedSO, setSelectedSO] = useState<UiOrder | null>(null);
  const [selectedDbIds, setSelectedDbIds] = useState<number[]>([]);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

  // API State
  const [salesOrders, setSalesOrders] = useState<UiOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ordersError, setOrdersError] = useState<any>(null);

  // ✅ API-driven inventory state
  const [apiInventory, setApiInventory] = useState<Product[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [analyticsFromApi, setAnalyticsFromApi] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const isMutating = isCreating || isUpdating || isDeleting;

  // Allocations modal state
  const [isAllocationsModalOpen, setIsAllocationsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [pendingOrderForStatus, setPendingOrderForStatus] = useState<UiOrder | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationsFetched, setLocationsFetched] = useState(false);
  const [allocationState, setAllocationState] = useState<AllocationState>({});

  // ✅ Effective inventory: API takes priority, falls back to prop
  const inventory = apiInventory.length > 0 ? apiInventory : propInventory;

  // ✅ Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingInventory(true);
      try {
        const data = await inventoryService.getProducts();
        const normalized = (data as any)?.data ?? data;
        const list: Product[] = (Array.isArray(normalized) ? normalized : []).filter(
          (p: any) => Number(p.stock) > 0
        );
        setApiInventory(list);
        setInventory(list);
      } catch (error: any) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoadingInventory(false);
      }
    };
    fetchProducts();
  }, []);

  const fetchLocations = async (): Promise<Location[]> => {
    if (locationsFetched) return locations;
    try {
      setIsLoadingLocations(true);
      setLocationsError(null);
      const result = await inventoryService.getLocations();
      let data: Location[] = [];
      if (result && typeof result === 'object') {
        if ('success' in result && Array.isArray((result as any).data)) {
          data = (result as any).data;
        } else if (Array.isArray(result)) {
          data = result as Location[];
        }
      }
      setLocations(data);
      setLocationsFetched(true);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
      setLocationsError(err?.message || 'Failed to fetch locations');
      setLocations([]);
      return [];
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const buildStockMap = (locations: Location[]): Map<string, number> => {
    const stockMap = new Map<string, number>();
    locations.forEach(loc => {
      if (Array.isArray(loc.allocations)) {
        loc.allocations.forEach(alloc => {
          stockMap.set(`${loc.id}-${alloc.product_id}`, alloc.quantity || 0);
        });
      }
    });
    return stockMap;
  };

  const suggestAllocations = (items: UiOrder['items'], locations: Location[]): AllocationState => {
    const stockMap = buildStockMap(locations);
    const suggested: AllocationState = {};
    items.forEach(item => {
      if (!item.id || !item.product_id) return;
      let remaining = item.quantity;
      const allocations: AllocationRow[] = [];
      const candidates = locations
        .map(loc => ({ location_id: loc.id, available: stockMap.get(`${loc.id}-${item.product_id}`) || 0 }))
        .filter(c => c.available > 0)
        .sort((a, b) => b.available - a.available);
      for (const candidate of candidates) {
        if (remaining <= 0) break;
        const qty = Math.min(remaining, candidate.available);
        allocations.push({ location_id: candidate.location_id, quantity: qty });
        remaining -= qty;
      }
      suggested[item.id] = allocations;
    });
    return suggested;
  };

  const validateAllocations = (
    items: UiOrder['items'],
    allocationState: AllocationState,
    locations: Location[],
    isShipped: boolean
  ): Map<number, ItemValidation> => {
    const stockMap = buildStockMap(locations);
    const validations = new Map<number, ItemValidation>();
    items.forEach(item => {
      if (!item.id) return;
      const requiredQty = item.quantity;
      const allocations = allocationState[item.id] || [];
      let totalAllocated = 0;
      let hasError = false;
      let error: string | undefined;
      allocations.forEach(alloc => { totalAllocated += alloc.quantity; });
      if (allocations.length === 0) { hasError = true; error = 'No allocations provided'; }
      else if (allocations.some(a => a.quantity <= 0)) { hasError = true; error = 'All quantities must be > 0'; }
      else if (totalAllocated !== requiredQty) { hasError = true; error = `Allocated ${totalAllocated}, required ${requiredQty}`; }
      if (isShipped && !hasError && item.product_id) {
        for (const alloc of allocations) {
          const available = stockMap.get(`${alloc.location_id}-${item.product_id}`) || 0;
          if (alloc.quantity > available) {
            hasError = true;
            error = `Location ${alloc.location_id}: allocated ${alloc.quantity}, available ${available}`;
            break;
          }
        }
      }
      let totalAvailable = 0;
      if (item.product_id) {
        locations.forEach(loc => { totalAvailable += stockMap.get(`${loc.id}-${item.product_id}`) || 0; });
      }
      validations.set(item.id, { requiredQty, totalAllocated, available: totalAvailable, valid: !hasError, error });
    });
    return validations;
  };

  const buildAllocationsPayload = (order: UiOrder, allocationState: AllocationState, status: OrderStatus): StatusChangePayload => {
    const items = order.items
      .filter(item => item.id != null)
      .map(item => ({
        item_id: Number(item.id),
        allocations: (allocationState[item.id!] || []).map(alloc => ({
          location_id: Number(alloc.location_id),
          quantity: Number(alloc.quantity),
        })),
      }));
    return { orders: [{ order_id: order.dbId, items }], status };
  };

  const updateAllocation = (itemId: number, rowIndex: number, field: 'location_id' | 'quantity', value: number) => {
    setAllocationState(prev => {
      const current = prev[itemId] || [];
      const updated = [...current];
      if (rowIndex >= updated.length) return prev;
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return { ...prev, [itemId]: updated };
    });
  };

  const addAllocationRow = (itemId: number) => {
    setAllocationState(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), { location_id: locations[0]?.id || 1, quantity: 0 }],
    }));
  };

  const removeAllocationRow = (itemId: number, rowIndex: number) => {
    setAllocationState(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter((_, i) => i !== rowIndex),
    }));
  };

  const isAccessDenied = subscription && subscription.tier === 'Free';

  const fetchAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError(null);
      const data = await salesService.getAnalytics();
      setAnalyticsFromApi(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setAnalyticsError(err?.message || 'Failed to fetch analytics');
      setAnalyticsFromApi(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setOrdersError(null);
      const data = await salesService.getOrders();
      const mapped = Array.isArray(data) ? data.map(mapApiOrderToUi) : [];
      setSalesOrders(mapped);
    } catch (err: any) {
      console.error('Failed to fetch sales orders:', err);
      setOrdersError(err);
      setSalesOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await crmService.getCustomers();
      const maybe = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      setCustomers(maybe);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode === 'analytics') fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    if (lastUpdatedId) {
      const timer = setTimeout(() => setLastUpdatedId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdatedId]);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [formData, setFormData] = useState<any>({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'quote' as OrderStatus,
    items: [] as any[],
    salesperson: '',
    dealReference: '',
  });

  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({ description: '', quantity: 1, unitPrice: 0 });
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [editFormData, setEditFormData] = useState<any>({
    customer_id: undefined as number | undefined,
    date: '',
    salesperson: '',
    deal_reference: null as string | null,
    items: [] as Array<{ id?: number; product_id: number; description: string; quantity: number; unit_price: number }>,
  });

  const [editNewItem, setEditNewItem] = useState<Partial<InvoiceItem>>({ description: '', quantity: 1, unitPrice: 0 });
  const [editSelectedProductId, setEditSelectedProductId] = useState<string>('');

  const analyticsData = useMemo(() => {
    const totalRevenueLocal = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrdersLocal = salesOrders.length;
    const salesByPerson = salesOrders.reduce((acc, order) => {
      const person = order.salesperson || 'Unassigned';
      if (!acc[person]) acc[person] = { name: person, total: 0, count: 0 };
      acc[person].total += order.totalAmount;
      acc[person].count += 1;
      return acc;
    }, {} as Record<string, { name: string; total: number; count: number }>);
    const salesPersonList = Object.values(salesByPerson)
      .map(p => ({ ...p, percentage: totalRevenueLocal > 0 ? (p.total / totalRevenueLocal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
    const monthlyData = salesOrders.reduce((acc, order) => {
      const d = new Date(order.date || new Date().toISOString());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += order.totalAmount;
      return acc;
    }, {} as Record<string, number>);
    const chartData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, sales: value }));
    return {
      totalRevenue: analyticsFromApi?.summary ? Number(analyticsFromApi.summary.total_revenue) : totalRevenueLocal,
      totalOrders: analyticsFromApi?.summary?.total_orders ?? totalOrdersLocal,
      averageOrderValue: analyticsFromApi?.summary?.average_order_value ?? (totalOrdersLocal > 0 ? totalRevenueLocal / totalOrdersLocal : 0),
      byStatus: analyticsFromApi?.by_status ?? [],
      topCustomers: analyticsFromApi?.top_customers ?? [],
      salesPersonList,
      chartData,
    };
  }, [salesOrders, analyticsFromApi]);

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const getMonthRevenue = (m: number, y: number) =>
      salesOrders
        .filter(o => { const d = new Date(o.date || new Date().toISOString()); return d.getMonth() === m && d.getFullYear() === y && o.status !== 'cancelled' && o.status !== 'quote'; })
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const monthlyRevenue = getMonthRevenue(currentMonth, currentYear);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevRevenue = getMonthRevenue(lastMonth, lastMonthYear);
    const revenueTrend = prevRevenue > 0 ? (((monthlyRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) + '%' : '0%';
    const revenueUp = monthlyRevenue >= prevRevenue;
    const activeQuotes = salesOrders.filter(o => o.status === 'quote').length;
    const pendingShipments = salesOrders.filter(o => o.status === 'confirmed').length;
    const avgOrderValue = salesOrders.length > 0 ? monthlyRevenue / salesOrders.length : 0;
    return { monthlyRevenue, revenueTrend, revenueUp, activeQuotes, pendingShipments, avgOrderValue };
  }, [salesOrders]);

  const uniqueSalespeople = useMemo(() => {
    const people = new Set<string>();
    salesOrders.forEach(order => { if (order.salesperson) people.add(order.salesperson); });
    return Array.from(people).sort();
  }, [salesOrders]);

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    inventory.forEach(p => products.add(p.name));
    return Array.from(products).sort();
  }, [inventory]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    inventory.forEach(p => { if ((p as any).brand) brands.add((p as any).brand); });
    return Array.from(brands).sort();
  }, [inventory]);

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchesSearch =
        (so.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.salesperson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.dealReference || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || so.status === normalizeStatus(statusFilter);
      const matchesSalesperson = salespersonFilter === 'All' || so.salesperson === salespersonFilter;
      const matchesProduct = productFilter === 'All' || so.items.some(item => item.description === productFilter || String(item.productId) === String(productFilter));
      const matchesBrand = brandFilter === 'All' || so.items.some(item => {
        const product = inventory.find(p => eqId(p.id, item.productId) || p.name === item.description);
        return ((product as any)?.brand || '') === brandFilter;
      });
      const orderDate = new Date(so.date || new Date().toISOString());
      const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
      const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
      const matchesDate = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
      return matchesSearch && matchesStatus && matchesSalesperson && matchesDate && matchesProduct && matchesBrand;
    });
  }, [salesOrders, searchTerm, statusFilter, salespersonFilter, productFilter, brandFilter, dateFilter, inventory]);

  const clearFilters = () => {
    setSearchTerm(''); setStatusFilter('All'); setSalespersonFilter('All');
    setProductFilter('All'); setBrandFilter('All'); setDateFilter({ start: '', end: '' });
  };

  const handleSelectAll = () => {
    if (selectedDbIds.length === filteredOrders.length) setSelectedDbIds([]);
    else setSelectedDbIds(filteredOrders.map(o => o.dbId));
  };

  const handleSelectOne = (dbId: number) => {
    if (selectedDbIds.includes(dbId)) setSelectedDbIds(selectedDbIds.filter(x => x !== dbId));
    else setSelectedDbIds([...selectedDbIds, dbId]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedDbIds.length === 0) return;
    if (action === 'confirmed' && !canBulkConfirm(salesOrders, selectedDbIds)) {
      addNotification('warning', 'Bulk confirm is allowed for QUOTE orders only.'); return;
    }
    if (action === 'Delete') {
      if (!canBulkDelete(salesOrders, selectedDbIds)) { addNotification('warning', 'Delete is allowed for QUOTE orders only.'); return; }
      if (!window.confirm(`Are you sure you want to delete ${selectedDbIds.length} orders?`)) return;
      try {
        setIsDeleting(true);
        await salesService.deleteOrders(selectedDbIds);
        setSalesOrders(prev => prev.filter(o => !selectedDbIds.includes(o.dbId)));
        addNotification('success', `Deleted ${selectedDbIds.length} sales orders.`);
        setSelectedDbIds([]);
      } catch (err: any) {
        addNotification('error', err?.message || 'Failed to delete some orders.');
      } finally { setIsDeleting(false); }
      return;
    }
    if (action === 'Link') { setLinkOrderIdsInput(''); setIsLinkDealModalOpen(true); return; }
    const newStatus = normalizeStatus(action);
    if (newStatus === 'shipped' || newStatus === 'cancelled') {
      addNotification('warning', 'Bulk shipped/cancelled requires allocations. Use per-order actions.'); return;
    }
    try {
      setIsUpdating(true);
      const payload: StatusChangePayload = { orders: selectedDbIds.map(id => ({ order_id: id })), status: newStatus };
      await salesService.changeStatus(payload as any);
      setSalesOrders(prev => prev.map(o => (selectedDbIds.includes(o.dbId) ? { ...o, status: newStatus } : o)));
      addNotification('success', `Updated status to ${newStatus} for ${selectedDbIds.length} orders.`);
      setLastUpdatedId('BULK'); setSelectedDbIds([]);
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to update some orders.');
    } finally { setIsUpdating(false); }
  };

  const handleConfirmLinkToDeal = async () => {
    if (!newDealRef.trim()) { addNotification('warning', 'Please enter a Deal Reference.'); return; }
    try {
      setIsUpdating(true);
      let orderIds: number[] = [];
      if (linkOrderIdsInput.trim()) {
        orderIds = linkOrderIdsInput.split(/[,\s]+/).map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0);
        if (orderIds.length === 0) { addNotification('warning', 'Please enter valid DB Order IDs.'); return; }
      } else {
        orderIds = selectedDbIds;
        if (orderIds.length === 0) { addNotification('warning', 'Please select at least one order.'); return; }
      }
      await salesService.linkToDeal(orderIds, newDealRef.trim());
      setSalesOrders(prev => prev.map(order => (orderIds.includes(order.dbId) ? { ...order, dealReference: newDealRef.trim() } : order)));
      addNotification('success', `Linked ${orderIds.length} orders to deal "${newDealRef.trim()}"`);
      setIsLinkDealModalOpen(false); setSelectedDbIds([]); setNewDealRef(''); setLinkOrderIdsInput('');
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to link orders.');
    } finally { setIsUpdating(false); }
  };

  const openEditModal = (order: UiOrder) => {
    if (!canEditOrder(order)) { addNotification('warning', 'Edit is allowed for QUOTE orders only.'); return; }
    setEditingOrder(order);
    setEditFormData({
      customer_id: order.customer_id != null ? Number(order.customer_id) : undefined,
      date: order.date || '',
      salesperson: order.salesperson || '',
      deal_reference: order.dealReference ?? null,
      items: (order.items || []).map(item => ({
        id: item.id,
        product_id: item.product_id ?? Number(item.productId ?? 0),
        description: item.description || '',
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price ?? item.unitPrice ?? 0),
      })),
    });
    setEditNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setEditSelectedProductId('');
    setIsEditModalOpen(true);
  };

  // ✅ Edit modal uses `inventory` (which comes from API)
  const handleProductSelectForEdit = (productId: string) => {
    setEditSelectedProductId(productId);
    const product = inventory.find(p => eqId(p.id, productId));
    if (product) setEditNewItem(prev => ({ ...prev, description: product.name, unitPrice: (product as any).price ?? 0 }));
    else setEditNewItem(prev => ({ ...prev, description: '', unitPrice: 0 }));
  };

  const addEditItemToOrder = () => {
    if (!editNewItem.description || !editNewItem.quantity || editNewItem.unitPrice === undefined) return;
    const product = inventory.find(p => p.name === editNewItem.description || eqId(p.id, editSelectedProductId));
    const item = {
      product_id: product ? Number((product as any).id) : 0,
      description: String(editNewItem.description),
      quantity: Number(editNewItem.quantity),
      unit_price: Number(editNewItem.unitPrice),
    };
    setEditFormData((prev: any) => ({ ...prev, items: [...(prev.items || []), item] }));
    setEditNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setEditSelectedProductId('');
  };

  const removeEditItem = (idx: number) => {
    setEditFormData((prev: any) => ({ ...prev, items: (prev.items || []).filter((_: any, i: number) => i !== idx) }));
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (editingOrder.status !== 'quote') { addNotification('warning', 'Update is allowed for QUOTE orders only.'); return; }
    try {
      setIsUpdating(true);
      const payload: any = {};
      if (editFormData.customer_id != null) payload.customer_id = editFormData.customer_id;
      if (editFormData.date) payload.date = editFormData.date;
      if (editFormData.salesperson !== undefined) payload.salesperson = editFormData.salesperson;
      if (editFormData.deal_reference !== undefined) payload.deal_reference = editFormData.deal_reference;
      if (Array.isArray(editFormData.items)) {
        payload.items = editFormData.items.map((item: any) => ({
          ...(item.id != null && { id: item.id }),
          product_id: item.product_id, description: item.description,
          quantity: item.quantity, unit_price: item.unit_price,
        }));
      }
      const updated = await salesService.updateOrder(String(editingOrder.dbId), payload);
      const mapped = mapApiOrderToUi(updated);
      setSalesOrders(prev => prev.map(o => (o.dbId === editingOrder.dbId ? mapped : o)));
      if (selectedSO?.dbId === editingOrder.dbId) setSelectedSO(mapped);
      setIsEditModalOpen(false); setEditingOrder(null);
      addNotification('success', 'Sales order updated.');
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to update sales order.');
    } finally { setIsUpdating(false); }
  };

  // ✅ Create modal uses `inventory` (which comes from API)
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = inventory.find(p => eqId(p.id, productId));
    if (product) setNewItem(prev => ({ ...prev, description: product.name, unitPrice: (product as any).price ?? 0 }));
    else setNewItem(prev => ({ ...prev, description: '', unitPrice: 0 }));
  };

  const addItemToOrder = () => {
    if (!newItem.description || !newItem.quantity || newItem.unitPrice === undefined) return;
    const qty = Number(newItem.quantity);
    const unit = Number(newItem.unitPrice);
    const item: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProductId || undefined,
      description: String(newItem.description),
      quantity: qty, unitPrice: unit, total: qty * unit,
    };
    setFormData((prev: any) => ({ ...prev, items: [...(prev.items || []), item] }));
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setSelectedProductId('');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(formData.customerId || '').trim()) { addNotification('warning', 'Please select a customer.'); return; }
    try {
      setIsCreating(true);
      const payload: any = {
        customer_id: Number(formData.customerId),
        date: formData.date || new Date().toISOString().split('T')[0],
        status: normalizeStatus(formData.status || 'quote'),
        salesperson: formData.salesperson || 'Unassigned',
        deal_reference: formData.dealReference || null,
        items: (formData.items || []).map((item: any) => {
          const base: any = { description: item.description, quantity: Number(item.quantity), unit_price: Number(item.unitPrice) };
          if (item.productId) base.product_id = Number(item.productId);
          return base;
        }),
      };
      const created = await salesService.createOrder(payload);
      const mapped = mapApiOrderToUi(created);
      setSalesOrders(prev => [mapped, ...prev]);
      setIsCreateModalOpen(false);
      setFormData({ customerId: '', date: new Date().toISOString().split('T')[0], status: 'quote', items: [], salesperson: '', dealReference: '' });
      addNotification('success', 'Sales Order created successfully.');
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to create sales order.');
    } finally { setIsCreating(false); }
  };

  const requestStatusChange = async (order: UiOrder, status: OrderStatus) => {
    const next = normalizeStatus(status);
    const allowed = getAllowedNextStatuses(order.status);
    if (!allowed.includes(next)) { addNotification('warning', `Not allowed: ${order.status} → ${next}`); return; }
    const needsAllocations = next === 'shipped' || (next === 'cancelled' && order.status === 'shipped');
    if (needsAllocations) {
      const freshLocations = await fetchLocations();
      const suggested = suggestAllocations(order.items, freshLocations);
      setAllocationState(suggested);
      setPendingOrderForStatus(order); setPendingStatus(next); setIsAllocationsModalOpen(true);
      return;
    }
    try {
      setIsUpdating(true);
      const payload: StatusChangePayload = { orders: [{ order_id: order.dbId }], status: next };
      await salesService.changeStatus(payload as any);
      setSalesOrders(prev => prev.map(o => (o.dbId === order.dbId ? { ...o, status: next } : o)));
      setLastUpdatedId(order.id);
      addNotification('success', `Order ${order.id} status updated to ${next}.`);
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to update order status.');
    } finally { setIsUpdating(false); }
  };

  const confirmAllocationsAndChangeStatus = async () => {
    if (!pendingOrderForStatus || !pendingStatus) return;
    const isShipped = pendingStatus === 'shipped';
    const validations = validateAllocations(pendingOrderForStatus.items, allocationState, locations, isShipped);
    let hasErrors = false;
    validations.forEach(v => { if (!v.valid) hasErrors = true; });
    if (hasErrors) { addNotification('error', 'Please fix validation errors before confirming.'); return; }
    try {
      setIsUpdating(true);
      const payload = buildAllocationsPayload(pendingOrderForStatus, allocationState, pendingStatus);
      await salesService.changeStatus(payload as any);
      setSalesOrders(prev => prev.map(o => (o.dbId === pendingOrderForStatus.dbId ? { ...o, status: pendingStatus } : o)));
      setLastUpdatedId(pendingOrderForStatus.id);
      addNotification('success', `Order ${pendingOrderForStatus.id} status updated to ${pendingStatus}.`);
      setIsAllocationsModalOpen(false); setPendingOrderForStatus(null); setPendingStatus(null); setAllocationState({});
    } catch (err: any) {
      addNotification('error', err?.message || 'Failed to update order status.');
    } finally { setIsUpdating(false); }
  };

  const generatePDF = (order: UiOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(79, 70, 229); doc.text('Nexus ERP', 14, 22);
    doc.setFontSize(16); doc.setTextColor(0);
    doc.text(order.status === 'quote' ? 'SALES QUOTE' : 'SALES ORDER', 196, 22, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Order #: ${order.id}`, 196, 30, { align: 'right' });
    doc.text(`Date: ${order.date || ''}`, 196, 34, { align: 'right' });
    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Quantity', 'Unit Price', 'Total']],
      body: (order.items || []).map(item => [item.description, item.quantity, `$${Number(item.unitPrice).toFixed(2)}`, `$${Number(item.total).toFixed(2)}`]),
      theme: 'striped', headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });
    doc.save(`${order.id}.pdf`);
  };

  const generateFilteredReport = () => {
    if (filteredOrders.length === 0) { addNotification('warning', 'No data matches your current filters to generate a report.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(79, 70, 229); doc.text('Sales Performance Report', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    addNotification('success', 'Comprehensive Sales Report generated.');
  };

  const generateAnalyticsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(79, 70, 229); doc.text('Nexus ERP - Sales Analytics Report', 14, 22);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.save('Sales_Analytics_Report.pdf');
  };

  const linkedOrdersForSelected = useMemo(() => {
    if (!selectedSO || !selectedSO.dealReference) return [];
    return salesOrders.filter(o => o.dealReference === selectedSO.dealReference && o.dbId !== selectedSO.dbId);
  }, [selectedSO, salesOrders]);

  const bulkDeleteAllowed = canBulkDelete(salesOrders, selectedDbIds);
  const bulkConfirmAllowed = canBulkConfirm(salesOrders, selectedDbIds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sales</h2>
          <p className="text-sm text-slate-500">Orders, quotes, analytics, and reporting</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${viewMode === 'orders' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`} onClick={() => setViewMode('orders')}>
            <Truck size={16} /> Orders
          </button>
          <button className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`} onClick={() => setViewMode('analytics')}>
            <TrendingUp size={16} /> Analytics
          </button>
          <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" onClick={() => setIsCreateModalOpen(true)} disabled={isAccessDenied} title={isAccessDenied ? 'Upgrade to create orders' : 'Create'}>
            <Plus size={16} /> Create
          </button>
          <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={generateFilteredReport} disabled={filteredOrders.length === 0}>
            <Download size={16} /> Report
          </button>
        </div>
      </div>

      {isAccessDenied && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 flex items-center gap-2">
          <Lock size={18} /> Your plan is Free. Some actions are disabled.
        </div>
      )}

      {/* Orders */}
      {viewMode === 'orders' && (
        <>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="shrink-0">
              <div className="inline-flex h-10 items-center gap-2 px-3 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500">
                <Search className="text-slate-400 shrink-0" size={18} />
                <input type="text" placeholder={t?.('common.search') || 'Search...'} className="w-full bg-transparent outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="quote">quote</option>
                  <option value="confirmed">confirmed</option>
                  <option value="shipped">shipped</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))} />
                <span className="text-slate-400 text-sm">to</span>
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))} />
              </div>
              <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={clearFilters}>
                <XCircle size={16} /> Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-500">
              Showing <span className="text-slate-900 font-medium">{filteredOrders.length}</span> orders
              {selectedDbIds.length > 0 && <> | Selected <span className="text-slate-900 font-medium">{selectedDbIds.length}</span></>}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={selectedDbIds.length === 0 || isMutating} onClick={() => handleBulkAction('Link')}>
                <Send size={16} /> Link Deal
              </button>
              <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={!bulkConfirmAllowed || isMutating} onClick={() => handleBulkAction('confirmed')} title={!bulkConfirmAllowed ? 'Confirm is only for QUOTE orders' : 'Confirm'}>
                <CheckCircle size={16} /> Mark confirmed
              </button>
              {bulkDeleteAllowed ? (
                <button className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2 disabled:opacity-60" disabled={selectedDbIds.length === 0 || isMutating} onClick={() => handleBulkAction('Delete')}>
                  {isDeleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                </button>
              ) : (
                <button className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-300 text-sm flex items-center gap-2 cursor-not-allowed" disabled title="Delete is only for QUOTE orders">
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 w-10">
                      <button onClick={handleSelectAll} className="inline-flex items-center justify-center">
                        {selectedDbIds.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                    </th>
                    <th className="p-3 text-left">Order</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Salesperson</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingOrders ? (
                    <tr><td colSpan={8} className="p-6 text-center text-slate-500"><div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Loading orders...</div></td></tr>
                  ) : ordersError ? (
                    <tr><td colSpan={8} className="p-6 text-center text-red-600">Failed to load orders.</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={8} className="p-6 text-center text-slate-500">No orders found.</td></tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.dbId} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <button onClick={() => handleSelectOne(order.dbId)} className="inline-flex items-center justify-center">
                            {selectedDbIds.includes(order.dbId) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-400" />}
                          </button>
                        </td>
                        <td className="p-3 font-medium text-slate-900">{order.id}</td>
                        <td className="p-3 text-slate-700">{order.customerName || '-'}</td>
                        <td className="p-3 text-slate-700">{order.date || '-'}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs border border-slate-200 bg-white text-slate-700">{order.status}</span>
                          {lastUpdatedId === order.id && <span className="ml-2 text-xs text-green-600">Updated</span>}
                        </td>
                        <td className="p-3 text-slate-700">{order.salesperson || '-'}</td>
                        <td className="p-3 text-right text-slate-900 font-medium">${Number(order.totalAmount || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => setSelectedSO(order)} title="View"><Eye size={16} /></button>
                            {canEditOrder(order) && (
                              <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => openEditModal(order)} title="Edit (Quote only)" disabled={isMutating}><Pencil size={16} /></button>
                            )}
                            <button className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700" onClick={() => generatePDF(order)} title="PDF"><Download size={16} /></button>
                            {order.status === 'quote' && (
                              <button className="px-2 py-1 rounded-lg bg-slate-900 text-white" onClick={() => requestStatusChange(order, 'confirmed')} disabled={isMutating} title="Confirm">Confirm</button>
                            )}
                            {order.status === 'confirmed' && (
                              <>
                                <button className="px-2 py-1 rounded-lg bg-indigo-600 text-white" onClick={() => requestStatusChange(order, 'shipped')} disabled={isMutating} title="Ship">Ship</button>
                                <button className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700" onClick={() => requestStatusChange(order, 'cancelled')} disabled={isMutating} title="Cancel">Cancel</button>
                              </>
                            )}
                            {order.status === 'shipped' && (
                              <>
                                <button className="px-2 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => requestStatusChange(order, 'completed')} disabled={isMutating} title="Complete">Complete</button>
                                <button className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700" onClick={() => requestStatusChange(order, 'cancelled')} disabled={isMutating} title="Cancel">Cancel</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedSO && (
              <div className="border-t border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-slate-900 font-semibold">Order {selectedSO.id}</div>
                    <div className="text-sm text-slate-500">{selectedSO.customerName} • {selectedSO.status} • ${Number(selectedSO.totalAmount || 0).toLocaleString()}</div>
                    {selectedSO.dealReference && <div className="text-sm text-slate-600 mt-1">Deal: <span className="font-medium">{selectedSO.dealReference}</span></div>}
                  </div>
                  <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={() => setSelectedSO(null)}>
                    <X size={16} /> Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Analytics */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Revenue" value={`$${Number(analyticsData.totalRevenue || 0).toLocaleString()}`} trend={dashboardMetrics.revenueTrend} trendUp={dashboardMetrics.revenueUp} icon={<TrendingUp size={20} />} color="bg-indigo-500" />
            <StatsCard title="Orders" value={String(analyticsData.totalOrders || 0)} trend="Total" trendUp={true} icon={<CheckCircle size={20} />} color="bg-emerald-500" />
            <StatsCard title="Avg Order" value={`$${Number(analyticsData.averageOrderValue || 0).toLocaleString()}`} trend="Average" trendUp={true} icon={<CheckCircle size={20} />} color="bg-amber-500" />
            <StatsCard title="Pending Shipments" value={String(dashboardMetrics.pendingShipments || 0)} trend="confirmed" trendUp={false} icon={<Truck size={20} />} color="bg-blue-500" />
          </div>
          {isLoadingAnalytics ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500"><div className="inline-flex items-center gap-2"><Loader className="animate-spin" size={18} /> Loading analytics...</div></div>
          ) : analyticsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2"><AlertCircle size={18} />{analyticsError}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900 mb-3">Monthly Revenue</div>
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analyticsData.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="sales" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900 mb-3">Sales by Person</div>
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analyticsData.salesPersonList}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" /></BarChart></ResponsiveContainer></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-semibold text-slate-900">By Status</div>
                  <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm flex items-center gap-2" onClick={generateAnalyticsPDF}><Download size={16} /> PDF</button>
                </div>
                <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Array.isArray(analyticsData.byStatus) ? analyticsData.byStatus : []} dataKey="count" nameKey="status" outerRadius={110} label>{(Array.isArray(analyticsData.byStatus) ? analyticsData.byStatus : []).map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col" dir="ltr">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <div className="font-semibold text-slate-900">Create Sales Order</div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Customer *</label>
                  <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.customerId} onChange={(e) => setFormData((p: any) => ({ ...p, customerId: e.target.value }))} required>
                    <option value="">Select customer</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name || `Customer ${c.id}`}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Date</label>
                  <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.date} onChange={(e) => setFormData((p: any) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Salesperson</label>
                  <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="e.g. John Smith" value={formData.salesperson} onChange={(e) => setFormData((p: any) => ({ ...p, salesperson: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Deal Reference</label>
                  <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference (optional)" value={formData.dealReference} onChange={(e) => setFormData((p: any) => ({ ...p, dealReference: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">Status</label>
                  <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={formData.status} onChange={(e) => setFormData((p: any) => ({ ...p, status: normalizeStatus(e.target.value) }))}>
                    <option value="quote">Quote</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              {/* ── ADD ITEM ── */}
              <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                  Add Item
                  {isLoadingInventory && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader size={12} className="animate-spin" /> Loading products…</span>}
                </div>

                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* ✅ Product dropdown — populated from API */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Product</label>
                    <select
                      className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      disabled={isLoadingInventory}
                    >
                      <option value="">{isLoadingInventory ? 'Loading…' : 'Select product'}</option>
                      {inventory.map((p: any) => (
                        <option key={String(p.id)} value={String(p.id)}>
                          {p.name}{(p.price ?? p.unit_price) != null ? ` — $${Number(p.price ?? p.unit_price).toFixed(2)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Qty</label>
                    <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="1" min={1} value={Number(newItem.quantity ?? 1)} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
                  </div>

                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Unit Price</label>
                    <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="0.00" min={0} value={Number(newItem.unitPrice ?? 0)} onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
                  </div>

                  <div className="col-span-2">
                    <button type="button" className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-40" onClick={addItemToOrder} disabled={!selectedProductId}>
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>

                {/* Added items list */}
                {(formData.items || []).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items ({formData.items.length})</div>
                    <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium px-1">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-1" />
                    </div>
                    {(formData.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <div className="col-span-5 text-sm font-medium text-slate-800 truncate">{it.description}</div>
                        <div className="col-span-2 text-center"><span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">{it.quantity}</span></div>
                        <div className="col-span-2 text-right text-sm text-slate-600">${Number(it.unitPrice || 0).toFixed(2)}</div>
                        <div className="col-span-2 text-right text-sm font-semibold text-slate-900">${(Number(it.quantity) * Number(it.unitPrice || 0)).toFixed(2)}</div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" className="p-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors" onClick={() => setFormData((p: any) => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) }))} title="Remove item"><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1 border-t border-slate-200">
                      <div className="text-sm font-semibold text-slate-900">
                        Order Total: <span className="text-indigo-600">${(formData.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60 hover:bg-indigo-700 transition-colors" disabled={isCreating}>
                  {isCreating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LINK DEAL MODAL ───────────────────────────────────────────────────── */}
      {isLinkDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="font-semibold text-slate-900">Link Orders to Deal</div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsLinkDealModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference" value={newDealRef} onChange={(e) => setNewDealRef(e.target.value)} />
              <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" rows={3} placeholder="Optional: paste DB order ids (e.g. 6, 7, 8). If empty, we'll use your current selection." value={linkOrderIdsInput} onChange={(e) => setLinkOrderIdsInput(e.target.value)} />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm" onClick={() => setIsLinkDealModalOpen(false)}>Cancel</button>
                <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" onClick={handleConfirmLinkToDeal} disabled={isUpdating}>
                  {isUpdating ? <Loader size={16} className="animate-spin" /> : <Send size={16} />} Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ALLOCATIONS MODAL ─────────────────────────────────────────────────── */}
      {isAllocationsModalOpen && pendingOrderForStatus && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl bg-white border border-slate-200 my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Allocate Inventory • Order {pendingOrderForStatus.id}</div>
                <div className="text-sm text-slate-500 mt-1">Status: {pendingOrderForStatus.status} → {pendingStatus}</div>
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => { setIsAllocationsModalOpen(false); setAllocationState({}); }}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {isLoadingLocations ? (
                <div className="text-center py-6 text-slate-500"><Loader className="animate-spin inline-block" size={24} /><div className="mt-2">Loading locations...</div></div>
              ) : locationsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2"><AlertCircle size={18} />{locationsError}</div>
              ) : locations.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 flex items-center gap-2"><AlertCircle size={18} />No locations found. Please add locations first.</div>
              ) : (
                pendingOrderForStatus.items.map((item) => {
                  if (!item.id) return null;
                  const allocations = allocationState[item.id] || [];
                  const stockMap = buildStockMap(locations);
                  const validations = validateAllocations([item], allocationState, locations, pendingStatus === 'shipped');
                  const validation = validations.get(item.id);
                  const selectedLocationIds = allocations.map(a => a.location_id);
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{item.description}</div>
                          <div className="text-sm text-slate-500">Required: <span className="font-semibold">{item.quantity}</span> units{validation && <span className="ml-2">• Available: <span className="font-semibold">{validation.available}</span> units</span>}</div>
                        </div>
                        {validation && !validation.valid && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} /><span className="font-medium">{validation.error}</span></div>}
                        {validation && validation.valid && <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle size={16} /><span className="font-medium">Valid</span></div>}
                      </div>
                      {validation && validation.available < validation.requiredQty && pendingStatus === 'shipped' && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <div><strong>Insufficient stock:</strong> Required {validation.requiredQty}, available {validation.available}.</div>
                        </div>
                      )}
                      <div className="space-y-2">
                        {allocations.length === 0 && <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">No allocations yet. Click "Add Location" below to start.</div>}
                        {allocations.map((alloc, rowIndex) => {
                          const available = item.product_id ? (stockMap.get(`${alloc.location_id}-${item.product_id}`) || 0) : 0;
                          return (
                            <div key={rowIndex} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500" value={alloc.location_id} onChange={(e) => updateAllocation(item.id!, rowIndex, 'location_id', Number(e.target.value))}>
                                  {locations.map(loc => <option key={loc.id} value={loc.id} disabled={selectedLocationIds.includes(loc.id) && loc.id !== alloc.location_id}>{loc.name}{selectedLocationIds.includes(loc.id) && loc.id !== alloc.location_id && ' (already selected)'}</option>)}
                                </select>
                              </div>
                              <div className="col-span-3"><input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Quantity" min={0} value={alloc.quantity} onChange={(e) => updateAllocation(item.id!, rowIndex, 'quantity', Number(e.target.value))} /></div>
                              <div className="col-span-3 text-sm text-slate-600"><span className="font-medium">Available:</span> {available}</div>
                              <div className="col-span-1 flex justify-end"><button type="button" className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors" onClick={() => removeAllocationRow(item.id!, rowIndex)}><Trash2 size={16} /></button></div>
                            </div>
                          );
                        })}
                        <button type="button" className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors" onClick={() => addAllocationRow(item.id!)}>
                          <Plus size={16} /> Add Location
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
              <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors" onClick={() => { setIsAllocationsModalOpen(false); setAllocationState({}); }}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors" onClick={confirmAllocationsAndChangeStatus} disabled={isUpdating || locations.length === 0}>
                {isUpdating ? <><Loader size={16} className="animate-spin" /> Updating...</> : <><CheckCircle size={16} /> Confirm & Update Status</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white border border-slate-200 overflow-hidden" dir="ltr">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="font-semibold text-slate-900">Edit Sales Order (Quote only)</div>
              <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsEditModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateOrder} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={editFormData.date} onChange={(e) => setEditFormData((p: any) => ({ ...p, date: e.target.value }))} />
                <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Salesperson" value={editFormData.salesperson} onChange={(e) => setEditFormData((p: any) => ({ ...p, salesperson: e.target.value }))} />
                <input type="text" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Deal Reference" value={editFormData.deal_reference ?? ''} onChange={(e) => setEditFormData((p: any) => ({ ...p, deal_reference: e.target.value || null }))} />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Add Item</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* ✅ Edit modal product dropdown — also from API */}
                  <select className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" value={editSelectedProductId} onChange={(e) => handleProductSelectForEdit(e.target.value)} disabled={isLoadingInventory}>
                    <option value="">{isLoadingInventory ? 'Loading…' : 'Select product'}</option>
                    {inventory.map((p: any) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.name}{(p.price ?? p.unit_price) != null ? ` — $${Number(p.price ?? p.unit_price).toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                  <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Qty" min={1} value={Number(editNewItem.quantity ?? 1)} onChange={(e) => setEditNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
                  <input type="number" className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm" placeholder="Unit price" min={0} value={Number(editNewItem.unitPrice ?? 0)} onChange={(e) => setEditNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
                  <button type="button" className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-40" onClick={addEditItemToOrder} disabled={!editSelectedProductId}>Add</button>
                </div>
                <div className="space-y-2">
                  {(editFormData.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <div className="text-sm text-slate-700">{it.description} • Qty {it.quantity} • ${Number(it.unit_price || 0).toLocaleString()}</div>
                      <button type="button" className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs" onClick={() => removeEditItem(idx)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-60" disabled={isUpdating}>
                  {isUpdating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesView;