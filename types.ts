
import React from 'react';

export interface User {
  id: number;
  employee_code?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role_department?: string;
  salary?: string;
  status?: string;
  company_id?: number;
  role_id?: number;
  manager_id?: number | null;
  
  // ✅ Role can be either string (legacy) or object (from API)
  role: string | {
    id: number;
    name: string;
  };
  
  // Optional fields for compatibility
  companyId?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  email_verified_at?: string | null;
}

export type SubscriptionTier = 'Free' | 'Pro' | 'Enterprise';

export interface Subscription {
  tier: SubscriptionTier;
  status: 'Active' | 'Past Due' | 'Cancelled';
  renewalDate: string;
  paymentMethod?: string;
}

export interface Company {
  id: string;
  name: string;
  adminName: string;
  adminEmail: string;
  subscription: Subscription;
  joinedDate: string;
  usersCount: number;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  notes?: string;
  status: 'Active' | 'Inactive' | 'Lead';
  revenue: number;
  lastContact: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  budget: number;
  status: 'Active' | 'Inactive';
}

export interface StockMovement {
  id: string;
  date: string;
  quantity: number;
  type: 'Initial' | 'Purchase' | 'Sale' | 'Adjustment';
  reference?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  address?: string;
  description?: string;
  code?: string;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'Active' | 'Inactive';
}

export interface ProductAllocation {
  locationId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  color?: string;
  price: number;
  stock: number;
  allocations?: ProductAllocation[];
  lowStockThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  history?: StockMovement[];
  monthlySales?: Record<string, number>;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StatusHistory {
  id: string;
  status: string;
  changedBy: string;
  date: string;
  notes?: string;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  paymentDate?: string;
  paymentType?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check' | 'Other';
}

export interface Invoice {
  id: string;
  customerId?: string;
  customerName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Pending' | 'Paid' | 'Overdue';
  items: InvoiceItem[];
  salesNumber?: string;
  lastReminderSent?: string;
  paymentTerms?: 'Net 30' | 'Net 15' | 'Net 60' | 'Due on Receipt';
  history?: StatusHistory[];
  salesperson?: string;
  installments?: Installment[];
}

export interface RecurringInvoice {
  id: string;
  customerId: string; 
  customerName: string;
  amount: number;
  items: InvoiceItem[]; 
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  nextDueDate: string;
  status: 'Active' | 'Paused';
}

export interface Expense {
  id: string;
  category: 'Office' | 'Travel' | 'Equipment' | 'Marketing' | 'Payroll' | 'Utilities' | 'Cost of Goods';
  amount: number;
  date: string;
  description: string;
  reference?: string;
  linkedPO?: string;
  linkedProject?: string;
  status: 'Pending' | 'Approved' | 'Paid';
  costCenterId?: string;
}

export interface Payable {
  id: string;
  vendorId?: string;
  vendorName: string;
  amount: number;
  date: string; 
  dueDate: string;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Pending' | 'Paid' | 'Overdue';
  description: string;
  invoiceReference?: string; 
  history?: StatusHistory[];
  assignedApprover?: string;
  costCenterId?: string;
}

export interface GeneralLedgerEntry {
  id: string;
  date: string;
  description: string;
  category: string; 
  debit: number;
  credit: number;
  balance?: number;
  referenceId?: string; 
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  status: 'Active' | 'Inactive';
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  expectedDelivery: string;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Ordered' | 'Received' | 'Paid' | 'Rejected' | 'Cancelled';
  totalAmount: number;
  items: InvoiceItem[];
  paymentDate: any;
  invoiceReference: any;

  // ✅ approval object (زي الباك بالظبط)
  approval?: {
    id: string;
    entityId?: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string | null;
    approvedAt?: string | null;
  };
}


export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  status: 'Quote' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled';
  totalAmount: number;
  items: InvoiceItem[];
  salesperson?: string;
  history?: StatusHistory[];
  dealReference?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  category?: 'Call' | 'Email' | 'Meeting' | 'Project' | 'Review' | 'Other';
  relatedTo?: string;
  assignedToId?: string,  
  assignedTo?: string   
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  address?: string;
  certificate?: string;
  contractNumber?: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  joinDate: string;
  salary: number;
  managerId?: string;
  managerName?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  totalHours?: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Vacation' | 'Sick' | 'Personal' | 'Remote Work';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PayrollRecord {
  id: string;
  month: string;
  totalEmployees: number;
  totalAmount: number;
  status: 'Draft' | 'Processed' | 'Paid';
  dateProcessed?: string;
}

export interface MaterialAllocation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityRequired: number;
  quantityAllocated: number;
  status: 'Pending' | 'Partially Allocated' | 'Full';
}

export interface WorkOrder {
  id: string;
  salesOrderId?: string;
  customerName: string;
  dueDate: string;
  status: 'Draft' | 'Allocating' | 'Awaiting Approval' | 'Approved' | 'In Production' | 'Completed';
  items: InvoiceItem[];
  allocations: MaterialAllocation[];
  priority: 'Normal' | 'Urgent';
  assignedTo?: string;
  notes?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  CRM = 'CRM',
  SALES = 'SALES',
  PRODUCTION = 'PRODUCTION',
  TASKS = 'TASKS',
  INVENTORY = 'INVENTORY',
  PURCHASES = 'PURCHASES',
  FINANCE = 'FINANCE',
  REPORTS = 'REPORTS',
  HR = 'HR',
  AI_INSIGHTS = 'AI_INSIGHTS',
  SETTINGS = 'SETTINGS'
}