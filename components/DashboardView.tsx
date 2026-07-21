// import React, { useMemo } from 'react';
// import { DollarSign, Users, Package, Activity, TrendingUp, Loader } from 'lucide-react';
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   Legend,
//   Cell,
//   PieChart,
//   Pie,
// } from 'recharts';

// import StatsCard from './StatsCard';
// import { Product, Customer, SalesOrder } from '../types';
// import { useLanguage } from './LanguageContext';
// import { useGetProductsQuery } from '../services/salesApi';
// import { useGetCustomersQuery, useGetSalesOrdersQuery } from '../services/salesApi';

// interface DashboardViewProps {
//   inventory?: Product[];
//   customers?: Customer[];
//   salesOrders?: SalesOrder[];
// }

// const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

// const DashboardView: React.FC<DashboardViewProps> = ({
//   inventory: propInventory = [],
//   customers: propCustomers = [],
//   salesOrders: propSalesOrders = [],
// }) => {
//   const { t, language } = useLanguage();

//   // ✅ robust RTL detection
//   const isRTL = (language || '').toLowerCase().startsWith('ar');

//   // Fetch data from API
//   const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery();
//   const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();
//   const { data: salesOrdersData, isLoading: isLoadingSalesOrders } = useGetSalesOrdersQuery();



//   // Use API data if available, otherwise fall back to props, ensure always array
//   const inventory = Array.isArray(productsData?.data)
//     ? productsData.data
//     : Array.isArray(propInventory)
//       ? propInventory
//       : [];

//       console.log(inventory )

//   const customers = Array.isArray(customersData?.data)
//     ? customersData.data
//     : Array.isArray(propCustomers)
//       ? propCustomers
//       : [];

//   const salesOrders = Array.isArray(salesOrdersData?.data)
//     ? salesOrdersData.data
//     : Array.isArray(propSalesOrders)
//       ? propSalesOrders
//       : [];

//   const isLoading = isLoadingProducts || isLoadingCustomers || isLoadingSalesOrders;

//   // ========= Currency by Language =========
//   const getCurrencyByLanguage = (lang: string) => {
//     const l = (lang || '').toLowerCase();
//     if (l.startsWith('es')) return { locale: 'es-ES', currency: 'EUR' };
//     if (l.startsWith('ar')) return { locale: 'ar-EG', currency: 'EGP' };
//     return { locale: 'en-US', currency: 'USD' };
//   };

//   const formatCurrency = (amount: number) => {
//     const { locale, currency } = getCurrencyByLanguage(language);
//     return new Intl.NumberFormat(locale, {
//       style: 'currency',
//       currency,
//       maximumFractionDigits: 0,
//     }).format(Number.isFinite(amount) ? amount : 0);
//   };
//   // =======================================

//   // --- Dynamic Calculations ---
//   const metrics = useMemo(() => {
//     const totalRevenue = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
//     const activeCustomers = customers.filter((c) => c.status === 'Active').length;
//     const inventoryValue = inventory.reduce((sum, item) => sum + item.price * item.stock, 0);

//     const completedOrders = salesOrders.filter(
//       (o) => o.status === 'Shipped' || o.status === 'Completed'
//     ).length;

//     const efficiencyRate =
//       salesOrders.length > 0 ? Math.round((completedOrders / salesOrders.length) * 100) : 100;

//     return { totalRevenue, activeCustomers, inventoryValue, efficiencyRate };
//   }, [inventory, customers, salesOrders]);

//   // --- Chart Data ---
//   const revenueChartData = useMemo(() => {
//     const monthlySales: Record<string, number> = {};

//     salesOrders.forEach((order) => {
//       const date = new Date(order.date);
//       const month = date.toLocaleString('default', { month: 'short' }); // e.g. "Jan"
//       if (!monthlySales[month]) monthlySales[month] = 0;
//       monthlySales[month] += order.totalAmount;
//     });

//     if (Object.keys(monthlySales).length === 0) {
//       return [
//         { name: 'Jan', revenue: metrics.totalRevenue * 0.1, expenses: metrics.totalRevenue * 0.06 },
//         { name: 'Feb', revenue: metrics.totalRevenue * 0.15, expenses: metrics.totalRevenue * 0.08 },
//         { name: 'Mar', revenue: metrics.totalRevenue * 0.12, expenses: metrics.totalRevenue * 0.07 },
//         { name: 'Apr', revenue: metrics.totalRevenue * 0.18, expenses: metrics.totalRevenue * 0.1 },
//         { name: 'May', revenue: metrics.totalRevenue * 0.2, expenses: metrics.totalRevenue * 0.12 },
//         { name: 'Jun', revenue: metrics.totalRevenue * 0.25, expenses: metrics.totalRevenue * 0.15 },
//       ];
//     }

//     const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     return monthsOrder
//       .map((m) => ({
//         name: m,
//         revenue: monthlySales[m] || 0,
//         expenses: (monthlySales[m] || 0) * 0.6,
//       }))
//       .filter((d) => d.revenue > 0 || d.name === 'Nov');
//   }, [salesOrders, metrics.totalRevenue]);

//   // ✅ RTL: reverse data array for proper display
//   const revenueChartDataRTL = useMemo(
//     () => (isRTL ? [...revenueChartData].reverse() : revenueChartData),
//     [isRTL, revenueChartData]
//   );

//   // --- Top Inventory Assets Data ---
//   const topInventoryData = useMemo(() => {
//     return [...inventory]
//       .map((item) => ({
//         name: item.name,
//         totalValue: item.price * item.stock,
//         stock: item.stock,
//         price: item.price,
//         sku: item.sku,
//       }))
//       .sort((a, b) => b.totalValue - a.totalValue)
//       .slice(0, 5);
//   }, [inventory]);

//   // Custom Tooltip for Inventory Chart
//   const CustomInventoryTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;

//       return (
//         <div
//           className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg"
//           style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
//         >
//           <p className="font-bold text-slate-800 text-sm mb-1">{data.name}</p>
//           <div className="space-y-1 text-xs text-slate-600">
//             <p>
//               <span className="font-medium text-slate-500">SKU:</span> {data.sku}
//             </p>
//             <p>
//               <span className="font-medium text-slate-500">
//                 {isRTL ? 'مستوى المخزون' : 'Stock Level'}:
//               </span>{' '}
//               <span className="font-bold text-indigo-600">{data.stock} {isRTL ? 'وحدة' : 'units'}</span>
//             </p>
//             <p>
//               <span className="font-medium text-slate-500">
//                 {isRTL ? 'سعر الوحدة' : 'Unit Price'}:
//               </span> {formatCurrency(data.price)}
//             </p>
//             <p className="border-t border-slate-100 pt-1 mt-1">
//               <span className="font-medium text-slate-500">
//                 {isRTL ? 'إجمالي قيمة الأصول' : 'Total Asset Value'}:
//               </span>{' '}
//               <span className="font-bold text-emerald-600">{formatCurrency(data.totalValue)}</span>
//             </p>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   if (isLoading) {
//     return (
//       <div className="h-[60vh] flex items-center justify-center text-slate-600">
//         <Loader className="animate-spin me-2" size={18} />
//         <span>{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
//       </div>
//     );
//   }

//   return (
//     <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-500">
//       {/* Stats Cards Row */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatsCard
//           title={t('dashboard.total_revenue')}
//           value={formatCurrency(metrics.totalRevenue)}
//           trend="12%"
//           trendUp={true}
//           icon={<DollarSign size={20} />}
//           color="bg-indigo-500"
//         />
//         <StatsCard
//           title={t('dashboard.active_customers')}
//           value={metrics.activeCustomers.toString()}
//           trend="3.2%"
//           trendUp={true}
//           icon={<Users size={20} />}
//           color="bg-blue-500"
//         />
//         <StatsCard
//           title={t('dashboard.inventory_value')}
//           value={formatCurrency(metrics.inventoryValue)}
//           trend="0.8%"
//           trendUp={false}
//           icon={<Package size={20} />}
//           color="bg-emerald-500"
//         />
//         <StatsCard
//           title={t('dashboard.order_efficiency')}
//           value={`${metrics.efficiencyRate}%`}
//           trend="2%"
//           trendUp={true}
//           icon={<Activity size={20} />}
//           color="bg-orange-500"
//         />
//       </div>

//       {/* Charts Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Revenue Analytics - Main Chart */}
//         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
//           <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
//             <h3 className="text-lg font-semibold text-slate-800">{t('dashboard.revenue_analytics')}</h3>
//             <button className={`text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
//               <TrendingUp size={14} /> {t('dashboard.full_report')}
//             </button>
//           </div>

//           <div className="h-72  ">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart
//                 data={revenueChartDataRTL}
//                 margin={{ left: isRTL ? 10 : 0, right: isRTL ? 0 : 10, top: 10, bottom: 0 }}
//               >
//                 <defs>
//                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
//                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>

//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

//                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />

//                 <YAxis
//                   axisLine={false}
//                   tickLine={false}
//                   tickMargin={isRTL?60:0}
//                   tick={{ fill: '#94a3b8' }}
//                   tickFormatter={(val) => formatCurrency(Number(val))}
//                   orientation={isRTL ? 'right' : 'left'}
//                   width={80}
//                 />

//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: '#fff',
//                     borderRadius: '8px',
//                     border: '1px solid #e2e8f0',
//                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
//                     direction: isRTL ? 'rtl' : 'ltr',
//                     textAlign: isRTL ? 'right' : 'left',
//                   }}
//                   formatter={(val: number) => formatCurrency(val)}
//                 />

//                 <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Profit vs Expenses */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
//           <h3 className={`text-lg font-semibold text-slate-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
//             {t('dashboard.profit_vs_expenses')}
//           </h3>

//           <div className="h-72">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={revenueChartDataRTL}
//                 margin={{ left: isRTL ? 10 : 0, right: isRTL ? 0 : 10, top: 10, bottom: 0 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

//                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />

//                 <YAxis
//                   axisLine={false}
//                   tickLine={false}
//                     tickMargin={isRTL?60:0}
//                   tick={{ fill: '#94a3b8' }}
//                   tickFormatter={(val) => formatCurrency(Number(val))}
//                   orientation={isRTL ? 'right' : 'left'}
//                   width={80}
//                 />

//                 <Tooltip
//                   cursor={{ fill: '#f8fafc' }}
//                   contentStyle={{
//                     backgroundColor: '#fff',
//                     borderRadius: '8px',
//                     border: '1px solid #e2e8f0',
//                     direction: isRTL ? 'rtl' : 'ltr',
//                     textAlign: isRTL ? 'right' : 'left',
//                   }}
//                   formatter={(val: number) => formatCurrency(val)}
//                 />

//                 <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t('dashboard.expenses')} />
//                 <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name={t('dashboard.revenue')} />

//                 <Legend 
//                   wrapperStyle={{ 
//                     direction: isRTL ? 'rtl' : 'ltr',
//                     textAlign: isRTL ? 'right' : 'left',
//                     paddingTop: '10px',
//                   }} 
//                   verticalAlign="bottom" 
//                   height={36}
//                   align="center"
//                   iconType="circle"
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Second Row: Inventory Insights */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Top Inventory Assets Widget */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
//           <div className="mb-4">
//             <h3 className={`text-lg font-semibold text-slate-800 ${isRTL ? 'text-right' : 'text-left'}`}>
//               {t('dashboard.top_inventory_assets')}
//             </h3>
//             <p className={`text-sm text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
//               {t('dashboard.top_inventory_subtitle')}
//             </p>
//           </div>

//           <div className="flex-1 min-h-[300px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 layout="vertical"
//                 data={topInventoryData}
//                 margin={{ left: isRTL ? 20 : 10, right: isRTL ? 10 : 20, top: 10, bottom: 10 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />

//                 <XAxis type="number" hide reversed={isRTL} />

//                 <YAxis
//                   dataKey="name"
//                   type="category"
//                     tickMargin={isRTL?110:0}
//                   width={isRTL ? 160 : 140}
//                   tick={{ fill: '#64748b', fontSize: 12 }}
//                   tickLine={false}
//                   axisLine={false}
//                   orientation={isRTL ? 'right' : 'left'}
//                 />

//                 <Tooltip content={<CustomInventoryTooltip />} cursor={{ fill: '#f8fafc' }} />

//                 <Bar
//                   dataKey="totalValue"
//                   barSize={24}
//                   radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]}
//                 >
//                   {topInventoryData.map((_, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Stock Distribution */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
//           <h3 className={`text-lg font-semibold text-slate-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
//             {t('dashboard.stock_distribution')}
//           </h3>

//           <div className="flex-1 min-h-[300px] flex items-center justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//   <PieChart>
//     <Pie
//       data={topInventoryData}
//       cx="50%"
//       cy="50%"
//       innerRadius={60}
//       outerRadius={80}
//       paddingAngle={5}
//       dataKey="stock"
//       nameKey="name"
//       labelLine={false}
//     >
//       {topInventoryData.map((_, index) => (
//         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//       ))}
//     </Pie>

//     <Tooltip
//       contentStyle={{
//         direction: isRTL ? 'rtl' : 'ltr',
//         textAlign: isRTL ? 'right' : 'left',
//         backgroundColor: '#fff',
//         borderRadius: '8px',
//         border: '1px solid #e2e8f0',
//       }}
//     />

//     <Legend
//       verticalAlign="bottom"
//       align="center"
//       layout="horizontal"
//       wrapperStyle={{ paddingTop: 20 }}
//       iconType="circle"
//     />
//   </PieChart>
// </ResponsiveContainer>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardView;

import React, { useMemo } from 'react';
import { DollarSign, Users, Package, Activity, TrendingUp, Loader } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

import StatsCard from './StatsCard';
import { Product, Customer, SalesOrder } from '../types';
import { useLanguage } from './LanguageContext';
import { useGetProductsQuery, useGetCustomersQuery, useGetSalesOrdersQuery } from '../services/salesApi';

interface DashboardViewProps {
  inventory?: Product[];
  customers?: Customer[];
  salesOrders?: SalesOrder[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

const DashboardView: React.FC<DashboardViewProps> = ({
  inventory: propInventory = [],
  customers: propCustomers = [],
  salesOrders: propSalesOrders = [],
}) => {
  const { t, language } = useLanguage();
  const isRTL = (language || '').toLowerCase().startsWith('ar');

  // Fetch data from API
  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const { data: salesOrdersData, isLoading: isLoadingSalesOrders } = useGetSalesOrdersQuery();

  // ========= Currency by Language =========
  const getCurrencyByLanguage = (lang: string) => {
    const l = (lang || '').toLowerCase();
    if (l.startsWith('es')) return { locale: 'es-ES', currency: 'EUR' };
    if (l.startsWith('ar')) return { locale: 'ar-EG', currency: 'EGP' };
    return { locale: 'en-US', currency: 'USD' };
  };

  const formatCurrency = (amount: number) => {
    const { locale, currency } = getCurrencyByLanguage(language);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  };
  // =======================================

  // ✅ Normalize API -> UI types
  const inventory: Product[] = useMemo(() => {
    const list = Array.isArray(productsData?.data) ? productsData.data : Array.isArray(propInventory) ? propInventory : [];
    return list.map((p: any) => ({
      ...p,
      price: Number(p.price ?? 0),
      stock: Number(p.stock ?? 0),
    }));
  }, [productsData?.data, propInventory]);

  const customers: Customer[] = useMemo(() => {
    const list = Array.isArray(customersData?.data) ? customersData.data : Array.isArray(propCustomers) ? propCustomers : [];
    return list.map((c: any) => ({
      ...c,
      // API عندك بيرجع lead/customer... بدل Active
      status: c.status === 'lead' ? 'Active' : c.status,
      revenue: Number(c.revenue ?? 0),
    }));
  }, [customersData?.data, propCustomers]);

  const salesOrders: SalesOrder[] = useMemo(() => {
    const list = Array.isArray(salesOrdersData?.data)
      ? salesOrdersData.data
      : Array.isArray(propSalesOrders)
        ? propSalesOrders
        : [];

    return list.map((o: any) => ({
      ...o,
      // API: total_amount string -> totalAmount number
      totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
      // date موجود بالفعل، سيبه
      date: o.date,
      status: o.status,
    }));
  }, [salesOrdersData?.data, propSalesOrders]);

  const isLoading = isLoadingProducts || isLoadingCustomers || isLoadingSalesOrders;

  // --- Dynamic Calculations ---
  const metrics = useMemo(() => {
    const totalRevenue = salesOrders.reduce((sum, order: any) => sum + Number(order.totalAmount || 0), 0);

    const activeCustomers = customers.filter((c: any) => (c.status || '').toLowerCase() === 'active').length;

    const inventoryValue = inventory.reduce((sum, item: any) => {
      const price = Number(item.price || 0);
      const stock = Number(item.stock || 0);
      return sum + price * stock;
    }, 0);

    const completedOrders = salesOrders.filter((o: any) => {
      const s = (o.status || '').toLowerCase();
      return s === 'shipped' || s === 'completed';
    }).length;

    const efficiencyRate =
      salesOrders.length > 0 ? Math.round((completedOrders / salesOrders.length) * 100) : 100;

    return { totalRevenue, activeCustomers, inventoryValue, efficiencyRate };
  }, [inventory, customers, salesOrders]);

  // --- Chart Data ---
  const revenueChartData = useMemo(() => {
    const monthlySales: Record<string, number> = {};

    salesOrders.forEach((order: any) => {
      const date = new Date(order.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!monthlySales[month]) monthlySales[month] = 0;
      monthlySales[month] += Number(order.totalAmount || 0);
    });

    if (Object.keys(monthlySales).length === 0) {
      return [
        { name: 'Jan', revenue: metrics.totalRevenue * 0.1, expenses: metrics.totalRevenue * 0.06 },
        { name: 'Feb', revenue: metrics.totalRevenue * 0.15, expenses: metrics.totalRevenue * 0.08 },
        { name: 'Mar', revenue: metrics.totalRevenue * 0.12, expenses: metrics.totalRevenue * 0.07 },
        { name: 'Apr', revenue: metrics.totalRevenue * 0.18, expenses: metrics.totalRevenue * 0.1 },
        { name: 'May', revenue: metrics.totalRevenue * 0.2, expenses: metrics.totalRevenue * 0.12 },
        { name: 'Jun', revenue: metrics.totalRevenue * 0.25, expenses: metrics.totalRevenue * 0.15 },
      ];
    }

    const monthsOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return monthsOrder.map((m) => ({
      name: m,
      revenue: monthlySales[m] || 0,
      expenses: (monthlySales[m] || 0) * 0.6,
    }));
  }, [salesOrders, metrics.totalRevenue]);

  const revenueChartDataRTL = useMemo(
    () => (isRTL ? [...revenueChartData].reverse() : revenueChartData),
    [isRTL, revenueChartData]
  );

  // --- Top Inventory Assets Data ---
  const topInventoryData = useMemo(() => {
    return [...inventory]
      .map((item: any) => ({
        name: item.name,
        totalValue: Number(item.price || 0) * Number(item.stock || 0),
        stock: Number(item.stock || 0),
        price: Number(item.price || 0),
        sku: item.sku,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [inventory]);

  const CustomInventoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div
          className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg"
          style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
        >
          <p className="font-bold text-slate-800 text-sm mb-1">{data.name}</p>
          <div className="space-y-1 text-xs text-slate-600">
            <p>
              <span className="font-medium text-slate-500">SKU:</span> {data.sku}
            </p>
            <p>
              <span className="font-medium text-slate-500">{isRTL ? 'مستوى المخزون' : 'Stock Level'}:</span>{' '}
              <span className="font-bold text-indigo-600">{data.stock} {isRTL ? 'وحدة' : 'units'}</span>
            </p>
            <p>
              <span className="font-medium text-slate-500">{isRTL ? 'سعر الوحدة' : 'Unit Price'}:</span>{' '}
              {formatCurrency(data.price)}
            </p>
            <p className="border-t border-slate-100 pt-1 mt-1">
              <span className="font-medium text-slate-500">{isRTL ? 'إجمالي قيمة الأصول' : 'Total Asset Value'}:</span>{' '}
              <span className="font-bold text-emerald-600">{formatCurrency(data.totalValue)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-600">
        <Loader className="animate-spin me-2" size={18} />
        <span>{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.total_revenue')}
          value={formatCurrency(metrics.totalRevenue)}
          trend="12%"
          trendUp={true}
          icon={<DollarSign size={20} />}
          color="bg-indigo-500"
        />
        <StatsCard
          title={t('dashboard.active_customers')}
          value={metrics.activeCustomers.toString()}
          trend="3.2%"
          trendUp={true}
          icon={<Users size={20} />}
          color="bg-blue-500"
        />
        <StatsCard
          title={t('dashboard.inventory_value')}
          value={formatCurrency(metrics.inventoryValue)}
          trend="0.8%"
          trendUp={false}
          icon={<Package size={20} />}
          color="bg-emerald-500"
        />
        <StatsCard
          title={t('dashboard.order_efficiency')}
          value={`${metrics.efficiencyRate}%`}
          trend="2%"
          trendUp={true}
          icon={<Activity size={20} />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics - Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
            <h3 className="text-lg font-semibold text-slate-800">{t('dashboard.revenue_analytics')}</h3>
            <button className={`text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp size={14} /> {t('dashboard.full_report')}
            </button>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueChartDataRTL}
                margin={{ left: isRTL ? 10 : 0, right: isRTL ? 0 : 10, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={isRTL ? 60 : 0}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(val) => formatCurrency(Number(val))}
                  orientation={isRTL ? 'right' : 'left'}
                  width={80}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    direction: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  formatter={(val: number) => formatCurrency(Number(val))}
                />

                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit vs Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className={`text-lg font-semibold text-slate-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('dashboard.profit_vs_expenses')}
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartDataRTL}
                margin={{ left: isRTL ? 10 : 0, right: isRTL ? 0 : 10, top: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={isRTL ? 60 : 0}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(val) => formatCurrency(Number(val))}
                  orientation={isRTL ? 'right' : 'left'}
                  width={80}
                />

                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    direction: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  formatter={(val: number) => formatCurrency(Number(val))}
                />

                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t('dashboard.expenses')} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name={t('dashboard.revenue')} />

                <Legend
                  wrapperStyle={{
                    direction: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left',
                    paddingTop: '10px',
                  }}
                  verticalAlign="bottom"
                  height={36}
                  align="center"
                  iconType="circle"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Inventory Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Inventory Assets Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className={`text-lg font-semibold text-slate-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('dashboard.top_inventory_assets')}
            </h3>
            <p className={`text-sm text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('dashboard.top_inventory_subtitle')}
            </p>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topInventoryData}
                margin={{ left: isRTL ? 20 : 10, right: isRTL ? 10 : 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide reversed={isRTL} />

                <YAxis
                  dataKey="name"
                  type="category"
                  tickMargin={isRTL ? 110 : 0}
                  width={isRTL ? 160 : 140}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  orientation={isRTL ? 'right' : 'left'}
                />

                <Tooltip content={<CustomInventoryTooltip />} cursor={{ fill: '#f8fafc' }} />

                <Bar dataKey="totalValue" barSize={24} radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]}>
                  {topInventoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className={`text-lg font-semibold text-slate-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('dashboard.stock_distribution')}
          </h3>

          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topInventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="stock"
                  nameKey="name"
                  labelLine={false}
                >
                  {topInventoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    direction: isRTL ? 'rtl' : 'ltr',
                    textAlign: isRTL ? 'right' : 'left',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />

                <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
