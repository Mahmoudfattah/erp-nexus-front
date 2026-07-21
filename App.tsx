import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CRMView from './components/CRMView';
import SalesView from './components/SalesView';
import ProductionView from './components/ProductionView';
import TasksView from './components/TasksView';
import InventoryView from './components/InventoryView';
import PurchaseView from './components/PurchaseView';
import FinanceView from './components/FinanceView';
import HRView from './components/HRView';
import ReportsView from './components/ReportsView';
import AIInsightsView from './components/AIInsightsView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import OwnerAdminView from './components/OwnerAdminView';
import { Tab, User, Company, Product, Customer, SalesOrder, Invoice, RecurringInvoice, Expense, PurchaseOrder, Payable, Vendor, InventoryLocation, CostCenter, AttendanceRecord, WorkOrder } from './types';
import { LanguageProvider } from './components/LanguageContext';

// Mock Data
const mockCompanies: Company[] = [
  {
    id: 'COMP-DEMO',
    name: 'TechFlow Solutions',
    adminName: 'Alex Johnson',
    adminEmail: 'alex@techflow.com',
    joinedDate: '2023-01-15',
    usersCount: 12,
    subscription: {
      tier: 'Pro',
      status: 'Active',
      renewalDate: '2023-12-15',
      paymentMethod: 'Visa ending 4242'
    }
  }
];

const mockInventory: Product[] = [
  { id: '1', name: 'Ergonomic Office Chair', sku: 'FUR-001', category: 'Furniture', price: 250.00, stock: 45, lowStockThreshold: 10, status: 'In Stock', history: [{ id: 'h-init', date: '2023-01-01', quantity: 45, type: 'Initial', reference: 'System' }], allocations: [] },
  { id: '2', name: 'Wireless Mechanical Keyboard', sku: 'TEC-002', category: 'Electronics', price: 120.00, stock: 8, lowStockThreshold: 15, status: 'Low Stock', allocations: [] },
  { id: '3', name: '27-inch 4K Monitor', sku: 'TEC-003', category: 'Electronics', price: 450.00, stock: 20, lowStockThreshold: 5, status: 'In Stock', allocations: [] },
  { id: '4', name: 'Noise Cancelling Headphones', sku: 'TEC-004', category: 'Electronics', price: 299.00, stock: 0, lowStockThreshold: 10, status: 'Out of Stock', allocations: [] },
];

const mockLocations: InventoryLocation[] = [
    { id: 'LOC-1', name: 'Main Warehouse', address: '123 Industrial Pkwy', description: 'Primary storage' },
    { id: 'LOC-2', name: 'Office Supply Closet', address: 'HQ Building, Floor 2', description: 'Quick access items' }
];

const mockCustomers: Customer[] = [
  { id: '1', name: 'Alice Freeman', company: 'DesignCo', email: 'alice@designco.com', status: 'Active', revenue: 15400, lastContact: '2023-10-20' },
  { id: '2', name: 'Bob Smith', company: 'BuildIt Inc.', email: 'bob@buildit.com', status: 'Active', revenue: 8200, lastContact: '2023-10-25' },
  { id: '3', name: 'Charlie Davis', company: 'GreenEnergy', email: 'charlie@greenenergy.com', status: 'Lead', revenue: 0, lastContact: '2023-11-01' },
];

const mockSalesOrders: SalesOrder[] = [
    { 
        id: 'SO-1001', 
        customerId: '1', 
        customerName: 'Alice Freeman', 
        date: '2023-10-15', 
        status: 'Confirmed', 
        totalAmount: 5000, 
        items: [
            { id: 'item-1', description: 'Web Development Service', quantity: 1, unitPrice: 5000, total: 5000 }
        ] 
    },
    { 
        id: 'SO-1002', 
        customerId: '2', 
        customerName: 'Bob Smith', 
        date: '2023-10-20', 
        status: 'Confirmed', 
        totalAmount: 3200, 
        items: [
            { id: 'item-2', description: 'Ergonomic Chairs', quantity: 10, unitPrice: 250, total: 2500 },
            { id: 'item-3', description: 'Installation', quantity: 1, unitPrice: 700, total: 700 }
        ] 
    },
];

const mockInvoices: Invoice[] = [
  { 
    id: 'INV-1024', 
    customerId: '1', 
    salesNumber: 'SO-1001',
    customerName: 'Alice Freeman', 
    amount: 12500.00, 
    date: '2023-10-25', 
    dueDate: '2023-11-24',
    status: 'Paid', 
    paymentTerms: 'Net 30',
    items: [
      { id: '1', description: 'Enterprise Software License', quantity: 1, unitPrice: 10000, total: 10000 },
      { id: '2', description: 'Implementation Support', quantity: 25, unitPrice: 100, total: 2500 }
    ],
    salesperson: 'John Doe',
    history: [{ id: '1', status: 'Paid', changedBy: 'System', date: '2023-10-26' }]
  },
  { 
    id: 'INV-1025', 
    customerId: '2', 
    customerName: 'Bob Smith', 
    amount: 3200.00, 
    date: '2023-11-01', 
    dueDate: '2023-12-01',
    status: 'Awaiting Approval', 
    paymentTerms: 'Due on Receipt',
    items: [
      { id: '1', description: 'Office Equipment Bulk Order', quantity: 1, unitPrice: 3200, total: 3200 }
    ],
    salesperson: 'Sarah Smith',
    history: [{ id: '1', status: 'Awaiting Approval', changedBy: 'Sarah Smith', date: '2023-11-01' }]
  },
];

const mockCostCenters: CostCenter[] = [
  { id: 'CC-001', code: 'IT-001', name: 'IT Infrastructure', budget: 50000, status: 'Active' },
  { id: 'CC-002', code: 'MKT-001', name: 'Marketing & Sales', budget: 30000, status: 'Active' },
];

const mockExpenses: Expense[] = [
  { id: 'EXP-1', category: 'Office', amount: 1200, date: '2023-10-05', description: 'Office Rent', status: 'Paid', costCenterId: 'CC-003' },
];

const mockVendors: Vendor[] = [
    { id: 'V-001', name: 'Global Office Supplies', contactPerson: 'Sarah Connor', email: 'orders@globaloffice.com', phone: '+1 (555) 012-3456', status: 'Active' },
    { id: 'V-002', name: 'Tech Distributors Inc.', contactPerson: 'John Smith', email: 'sales@techdist.com', phone: '+1 (555) 987-6543', status: 'Active' }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-2023-001',
    vendorId: 'V-001',
    vendorName: 'Global Office Supplies',
    date: '2023-10-10',
    expectedDelivery: '2023-10-15',
    status: 'Received',
    totalAmount: 2500,
    items: [
      { id: 'pi-1', productId: '1', description: 'Ergonomic Office Chair', quantity: 10, unitPrice: 200, total: 2000 },
      { id: 'pi-2', productId: '2', description: 'Wireless Mechanical Keyboard', quantity: 5, unitPrice: 100, total: 500 }
    ],
    history: [{ id: 'h-1', status: 'Received', changedBy: 'System', date: '2023-10-15' }]
  },
  {
    id: 'PO-2023-002',
    vendorId: 'V-002',
    vendorName: 'Tech Distributors Inc.',
    date: '2023-11-01',
    expectedDelivery: '2023-11-05',
    status: 'Paid',
    totalAmount: 9000,
    items: [
      { id: 'pi-3', productId: '3', description: '27-inch 4K Monitor', quantity: 20, unitPrice: 450, total: 9000 }
    ],
    history: [{ id: 'h-2', status: 'Paid', changedBy: 'Finance', date: '2023-11-06' }]
  }
];

const mockPayables: Payable[] = [
  {
    id: 'PAY-8821',
    vendorId: 'V-001',
    vendorName: 'Global Office Supplies',
    amount: 850.50,
    date: '2023-11-01',
    dueDate: '2023-11-15',
    status: 'Awaiting Approval',
    description: 'Bulk printer toner cartridges',
    invoiceReference: 'SUP-4412',
    history: [{ id: '1', status: 'Draft', changedBy: 'John Admin', date: '2023-11-01 10:00' }]
  },
  {
    id: 'PAY-8822',
    vendorId: 'V-002',
    vendorName: 'Tech Distributors Inc.',
    amount: 2400.00,
    date: '2023-10-28',
    dueDate: '2023-11-10',
    status: 'Paid',
    description: 'Annual cloud server renewal',
    invoiceReference: 'TDI-HOST-99',
    history: [
        { id: '1', status: 'Approved', changedBy: 'Sarah Manager', date: '2023-10-29' },
        { id: '2', status: 'Paid', changedBy: 'Finance Dept', date: '2023-11-02' }
    ]
  }
];

const mockAttendance: AttendanceRecord[] = [
  { id: 'ATT-1', employeeId: '1', employeeName: 'Sarah Jenkins', date: new Date().toISOString().split('T')[0], clockIn: '08:45', clockOut: '17:15', status: 'Present', totalHours: 8.5, location: { lat: 41.8781, lng: -87.6298, address: "Chicago Office" } },
  { id: 'ATT-2', employeeId: '2', employeeName: 'Michael Chen', date: new Date().toISOString().split('T')[0], clockIn: '09:15', clockOut: '18:00', status: 'Late', totalHours: 8.75, location: { lat: 37.3382, lng: -121.8863, address: "San Jose Site" } },
];

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  // Data State
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [inventory, setInventory] = useState<Product[]>(mockInventory);
  const [locations, setLocations] = useState<InventoryLocation[]>(mockLocations);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(mockSalesOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(mockCostCenters);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [payables, setPayables] = useState<Payable[]>(mockPayables);
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    setUser(null);
    setActiveTab(Tab.DASHBOARD);
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  // ✅ FIXED: Check if user has role and role.name property
  if (user.role && user.role.name === 'Admin') {
    return <OwnerAdminView companies={companies} setCompanies={setCompanies} onLogout={handleLogout} currentUser={user} />;
  }

  const currentCompany = companies.find(c => c.id === user.companyId) || mockCompanies[0];
  const subscription = currentCompany.subscription;

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <DashboardView inventory={inventory} customers={customers} salesOrders={salesOrders} />;
      case Tab.CRM:
        return <CRMView customers={customers} setCustomers={setCustomers} invoices={invoices} user={user} />;
      case Tab.SALES:
        return <SalesView inventory={inventory} setInventory={setInventory} customers={customers} salesOrders={salesOrders} setSalesOrders={setSalesOrders} subscription={subscription} />;
      case Tab.PRODUCTION:
        return <ProductionView workOrders={workOrders} setWorkOrders={setWorkOrders} inventory={inventory} salesOrders={salesOrders} setSalesOrders={setSalesOrders} user={user} />;
      case Tab.TASKS:
        return <TasksView />;
      case Tab.INVENTORY:
        return <InventoryView user={user} inventory={inventory} setInventory={setInventory} locations={locations} setLocations={setLocations} purchaseOrders={purchaseOrders} />;
      case Tab.PURCHASES:
        return <PurchaseView user={user} inventory={inventory} setInventory={setInventory} />;
      case Tab.FINANCE:
        return (
            <FinanceView 
                user={user}
                customers={customers} 
                salesOrders={salesOrders} 
                subscription={subscription}
                invoices={invoices} 
                setInvoices={setInvoices}
                recurringInvoices={recurringInvoices}
                setRecurringInvoices={setRecurringInvoices}
                expenses={expenses}
                setExpenses={setExpenses}
                costCenters={costCenters}
                setCostCenters={setCostCenters}
                purchaseOrders={purchaseOrders}
                payables={payables}
                setPayables={setPayables}
                vendors={vendors}
                inventory={inventory}
            />
        );
      case Tab.HR:
        return <HRView user={user} subscription={subscription} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} />;
      case Tab.REPORTS:
        return <ReportsView 
                  inventory={inventory} 
                  customers={customers} 
                  salesOrders={salesOrders} 
                  purchaseOrders={purchaseOrders} 
                  vendors={vendors} 
                  invoices={invoices} 
                  payables={payables} 
                  expenses={expenses}
                  costCenters={costCenters}
                />;
      case Tab.AI_INSIGHTS:
        return <AIInsightsView subscription={subscription} />;
      case Tab.SETTINGS:
        return <SettingsView subscription={subscription} />;
      default:
        return <DashboardView inventory={inventory} customers={customers} salesOrders={salesOrders} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} user={user} />
      <div className="flex-1 ms-16 md:ms-64 flex flex-col h-screen transition-all duration-300">
        <Header user={user} activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;