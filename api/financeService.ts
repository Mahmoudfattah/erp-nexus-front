import apiClient from './apiClient';
import { Invoice, Expense, Payable, GeneralLedgerEntry, CostCenter } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
  pagination?: any;
}

const handleResponse = <T>(response: any): T => {
  const apiResponse: ApiResponse<T> = response.data;

  // allow data to be null in some success responses
  if (apiResponse?.success) {
    return apiResponse.data as T;
  }

  throw new Error(apiResponse?.message || 'API request failed');
};

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateInvoicePayload {
  sales_order_id: number;
  payment: {
    type: 'installments' | 'full';
    months?: number;
    payment_down?: number;
  };
}

export interface UpdateInvoicePayload {
  payment: {
    type: 'installments' | 'full';
    months?: number;
    payment_down?: number;
  };
}

export interface PayInstallmentPayload {
  installment_id: number;
  payment_type: 'cash' | 'credit_card' | 'bank_transfer';
  bankAccountId: number;
}

export interface CreateCostCenterPayload {
  name: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean | number;
}

export interface UpdateCostCenterPayload {
  name?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean | number;
}

export type BackendInvoiceStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'overdue';

export const toBackendStatus = (
  status: Invoice['status']
): BackendInvoiceStatus => {
  const map: Record<string, BackendInvoiceStatus> = {
    Draft: 'draft',
    'Awaiting Approval': 'awaiting_approval',
    Approved: 'approved',
    Paid: 'paid',
    Rejected: 'rejected',
    Overdue: 'overdue',
  };

  const s = String(status);
  return (map[s] ?? s.toLowerCase().replace(/\s+/g, '_')) as BackendInvoiceStatus;
};

export const toFrontendStatus = (status: string): Invoice['status'] => {
  const map: Record<string, Invoice['status']> = {
    draft: 'Draft',
    awaiting_approval: 'Awaiting Approval',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected',
    overdue: 'Overdue',
  };

  const s = String(status || '');
  return (map[s] ?? (s as Invoice['status']));
};

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeInvoice = (inv: any): Invoice => {
  if (!inv) return inv;

  if (typeof inv.status === 'string') {
    const s = inv.status;
    const isBackendStyle = s === s.toLowerCase() || s.includes('_');
    inv.status = isBackendStyle ? toFrontendStatus(s) : s;
  }

  return inv as Invoice;
};

const normalizeInvoices = (list: any[]): Invoice[] => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeInvoice);
};

const normalizeExpenseStatusToBackend = (status: string) => {
  return String(status).trim().toLowerCase().replace(/\s+/g, '_');
};

// ─── Helper: normalize CostCenter response (snake_case → camelCase) ───────────
//
// The backend returns snake_case fields (is_active, parent_id) but your
// frontend CostCenter type uses camelCase (isActive, parentId).
// This normalizer bridges the two so the UI always has consistent data.
//
const normalizeCostCenter = (cc: any): CostCenter => {
  if (!cc) return cc;
  return {
    ...cc,
    // map snake_case → camelCase
    isActive: cc.isActive !== undefined
      ? Boolean(cc.isActive)
      : cc.is_active !== undefined
        ? Boolean(cc.is_active)
        : true,
    parentId: cc.parentId !== undefined
      ? cc.parentId
      : cc.parent_id !== undefined
        ? cc.parent_id
        : undefined,
  } as CostCenter;
};

const normalizeCostCenters = (list: any[]): CostCenter[] => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeCostCenter);
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const financeService = {
  // ── Invoices ────────────────────────────────────────────────────────────────

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/invoices');
    const data = handleResponse<Invoice[]>(response);
    return normalizeInvoices(data as any[]);
  },

  getInvoice: async (id: string | number): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    const data = handleResponse<Invoice>(response);
    return normalizeInvoice(data);
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/invoices', payload);
    const data = handleResponse<Invoice>(response);
    return normalizeInvoice(data);
  },

  updateInvoice: async (
    id: string | number,
    payload: UpdateInvoicePayload
  ): Promise<Invoice> => {
    const response = await apiClient.put<ApiResponse<Invoice>>(
      `/invoices/${id}`,
      payload
    );
    const data = handleResponse<Invoice>(response);
    return normalizeInvoice(data);
  },

  updateInvoiceStatus: async (
    id: string | number,
    status: Invoice['status'] | BackendInvoiceStatus
  ): Promise<Invoice> => {
    const statusStr = String(status);

    const backendStatus =
      statusStr.includes(' ') || statusStr[0] === statusStr[0]?.toUpperCase()
        ? toBackendStatus(status as Invoice['status'])
        : (status as BackendInvoiceStatus);

    const body = new URLSearchParams({ status: backendStatus });

    const response = await apiClient.patch<ApiResponse<Invoice>>(
      `/invoices/${id}/status`,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const data = handleResponse<Invoice>(response);
    return normalizeInvoice(data);
  },

  deleteInvoice: async (id: string | number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/invoices/${id}`);
  },

  payInstallment: async (payload: PayInstallmentPayload): Promise<void> => {
    const formData = new FormData();
    formData.append('installment_id', String(payload.installment_id));
    formData.append('payment_type', payload.payment_type);
    formData.append('bankAccountId', String(payload.bankAccountId));
    formData.append('bank_account_id', String(payload.bankAccountId));

    await apiClient.post('/invoices/installment/pay', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ── Expenses ────────────────────────────────────────────────────────────────

  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get<ApiResponse<Expense[]>>('/expenses');
    return handleResponse<Expense[]>(response);
  },

  createExpense: async (expense: Partial<Expense>): Promise<Expense> => {
    const formData = new FormData();

    if (expense.category) formData.append('category', expense.category);
    if (expense.amount !== undefined) formData.append('amount', String(expense.amount));
    if (expense.description) formData.append('description', expense.description);
    if (expense.date) formData.append('date', expense.date);

    if ((expense as any).linkedPO) formData.append('linked_po', String((expense as any).linkedPO));
    if ((expense as any).linkedProject) formData.append('linked_project', String((expense as any).linkedProject));
    if ((expense as any).costCenterId) formData.append('cost_center_id', String((expense as any).costCenterId));

    formData.append('account_id', (expense as any).accountId ? String((expense as any).accountId) : '1');
    formData.append('company_id', (expense as any).companyId ? String((expense as any).companyId) : '1');

    if ((expense as any).status) {
      formData.append('status', normalizeExpenseStatusToBackend(String((expense as any).status)));
    }

    const response = await apiClient.post<ApiResponse<Expense>>('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return handleResponse<Expense>(response);
  },

  updateExpense: async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    const formData = new FormData();

    if (expense.category) formData.append('category', expense.category);
    if (expense.amount !== undefined) formData.append('amount', String(expense.amount));
    if (expense.description) formData.append('description', expense.description);
    if (expense.date) formData.append('date', expense.date);

    if ((expense as any).linkedPO) formData.append('linked_po', String((expense as any).linkedPO));
    if ((expense as any).linkedProject) formData.append('linked_project', String((expense as any).linkedProject));
    if ((expense as any).costCenterId) formData.append('cost_center_id', String((expense as any).costCenterId));

    if ((expense as any).status) {
      const backendStatus = normalizeExpenseStatusToBackend(String((expense as any).status));
      formData.append('status', backendStatus);

      if (backendStatus === 'approved') {
        formData.append('approve_by', '1');
        formData.append('approve_date', new Date().toISOString().split('T')[0]);
      }
    }

    if ((expense as any).companyId) {
      formData.append('company_id', String((expense as any).companyId));
    }

    const response = await apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return handleResponse<Expense>(response);
  },

  submitExpenseForPayment: async (
    expenseId: string | number,
    bankAccountId: number
  ): Promise<Expense> => {
    const formData = new FormData();
    formData.append('expenseId', String(expenseId));
    formData.append('expense_id', String(expenseId));
    formData.append('bankAccountId', String(bankAccountId));
    formData.append('bank_account_id', String(bankAccountId));

    const response = await apiClient.post<ApiResponse<Expense>>(
      `/expense/submit-for-paid`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return handleResponse<Expense>(response);
  },

  deleteExpense: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/expenses/${id}`);
  },

  // ── Payables ────────────────────────────────────────────────────────────────

  getPayables: async (): Promise<Payable[]> => {
    const response = await apiClient.get<ApiResponse<Payable[]>>('/payables');
    return handleResponse<Payable[]>(response);
  },

  updatePayable: async (id: string, payable: Partial<Payable>): Promise<Payable> => {
    const response = await apiClient.put<ApiResponse<Payable>>(`/payables/${id}`, payable);
    return handleResponse<Payable>(response);
  },

  deletePayable: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/payables/${id}`);
  },

  // ── General Ledger ─────────────────────────────────────────────────────────

  getLedger: async (): Promise<GeneralLedgerEntry[]> => {
    const response = await apiClient.get<ApiResponse<GeneralLedgerEntry[]>>('/ledger');
    return handleResponse<GeneralLedgerEntry[]>(response);
  },

  postToLedger: async (
    entry: Partial<GeneralLedgerEntry>
  ): Promise<GeneralLedgerEntry> => {
    const response = await apiClient.post<ApiResponse<GeneralLedgerEntry>>('/ledger', entry);
    return handleResponse<GeneralLedgerEntry>(response);
  },

  // ── Cost Centers ───────────────────────────────────────────────────────────

  getCostCenters: async (): Promise<CostCenter[]> => {
    const response = await apiClient.get<ApiResponse<CostCenter[]>>('/cost_centers');
    const data = handleResponse<CostCenter[]>(response);
    return normalizeCostCenters(data as any[]);
  },

  createCostCenter: async (payload: CreateCostCenterPayload): Promise<CostCenter> => {
    const formData = new FormData();

    formData.append('name', payload.name);

    if (payload.description && payload.description.trim()) {
      formData.append('description', payload.description.trim());
    }

    if (payload.parent_id !== undefined && payload.parent_id !== null) {
      formData.append('parent_id', String(payload.parent_id));
    }

    const activeValue = payload.is_active !== undefined
      ? (typeof payload.is_active === 'boolean' ? (payload.is_active ? '1' : '0') : String(payload.is_active))
      : '1';
    formData.append('is_active', activeValue);

    const response = await apiClient.post<ApiResponse<CostCenter>>(
      '/cost_centers',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const data = handleResponse<CostCenter>(response);
    return normalizeCostCenter(data);
  },

  /**
   * ✅ FIX: Laravel ignores FormData on PUT requests entirely.
   * Solution: POST to /cost_centers/:id with _method=PUT (Laravel method spoofing).
   * This is the standard Laravel pattern for file/form-data updates.
   */
  updateCostCenter: async (
    id: string | number,
    payload: UpdateCostCenterPayload
  ): Promise<CostCenter> => {
    const formData = new FormData();

    // ✅ Laravel method spoofing — tells Laravel to treat this POST as PUT
    formData.append('_method', 'PUT');

    if (payload.name) {
      formData.append('name', payload.name);
    }

    // Only send description if it has actual content (avoids backend min-length errors)
    if (payload.description !== undefined && payload.description.trim().length > 0) {
      formData.append('description', payload.description.trim());
    }

    if (payload.parent_id !== undefined) {
      // Send empty string to clear parent (set to root), or the numeric id
      formData.append('parent_id', payload.parent_id === null ? '' : String(payload.parent_id));
    }

    if (payload.is_active !== undefined) {
      const activeValue = typeof payload.is_active === 'boolean'
        ? (payload.is_active ? '1' : '0')
        : String(payload.is_active);
      formData.append('is_active', activeValue);
    }

    // ✅ POST instead of PUT — required for FormData to work in Laravel
    const response = await apiClient.post<ApiResponse<CostCenter>>(
      `/cost_centers/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const data = handleResponse<CostCenter>(response);
    return normalizeCostCenter(data);
  },

  deleteCostCenter: async (id: string | number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/cost_centers/${id}`);
  },
};