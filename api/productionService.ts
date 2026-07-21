// productionService.ts
import apiClient from './apiClient';
import { WorkOrder, InvoiceItem, MaterialAllocation } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

const handleResponse = <T>(response: any): T => {
  const apiResponse: ApiResponse<T> = response.data;
  if (apiResponse?.success && apiResponse.data !== undefined) return apiResponse.data;
  throw new Error(apiResponse?.message || 'API request failed');
};

// --------- MAPPERS: API (snake_case) -> Frontend (camelCase) ---------

const mapApiItem = (apiItem: any): InvoiceItem => {
  const product = apiItem.product || {};
  const qty = Number(apiItem.quantity ?? 0);
  const price = Number(product.price ?? 0);

  return {
    id: String(apiItem.id),
    productId: apiItem.product_id ? String(apiItem.product_id) : '',
    description: product.name ?? '',
    quantity: qty,
    unitPrice: price,
    total: price * qty,
  };
};

const mapApiAllocationsFromItems = (apiItems: any[]): MaterialAllocation[] => {
  return apiItems.map((apiItem: any) => {
    const product = apiItem.product || {};
    return {
      id: String(apiItem.id),
      productId: apiItem.product_id ? String(apiItem.product_id) : '',
      productName: product.name ?? '',
      sku: product.sku ?? 'N/A',
      quantityRequired: Number(apiItem.quantity ?? 0),
      quantityAllocated: 0,
      status: 'Pending',
    };
  });
};

const mapApiWorkOrder = (apiWo: any): WorkOrder => {
  const apiItems = Array.isArray(apiWo.items) ? apiWo.items : [];
  const items = apiItems.map(mapApiItem);
  const allocations = mapApiAllocationsFromItems(apiItems);

  return {
    id: String(apiWo.id),
    salesOrderId: apiWo.sales_order_id ? String(apiWo.sales_order_id) : undefined,
    customerName: apiWo.customer_name ?? '',
    dueDate: apiWo.due_date ?? '',
    status: (apiWo.status ?? 'Draft') as WorkOrder['status'],
    items,
    allocations,
    priority: (apiWo.priority as WorkOrder['priority']) ?? 'Normal',
    assignedTo: undefined,
    notes: undefined,
  };
};

// --------- MAPPER: Frontend -> API (manual create) ---------

type CreateWorkOrderPayload = {
  customer_name: string;
  due_date: string; // YYYY-MM-DD
  priority?: 'Normal' | 'Urgent' | null;
  items: Array<{ product_id: number; quantity: number }>;
};

const toCreateWorkOrderPayload = (wo: Partial<WorkOrder>): CreateWorkOrderPayload => {
  const items = (wo.items ?? []).map((it: any) => ({
    product_id: Number(it.product_id ?? it.productId),
    quantity: Number(it.quantity ?? 0),
  }));

  return {
    customer_name: (wo as any).customer_name ?? wo.customerName ?? '',
    due_date: (wo as any).due_date ?? wo.dueDate ?? '',
    priority: (wo as any).priority ?? wo.priority ?? null,
    items,
  };
};

// --------- MAPPER: Frontend -> API (update work order) ---------
// Items with `id` = update existing item | Items without `id` = insert new item

type UpdateWorkOrderItem = {
  id?: number;        // present → update existing; absent → insert new
  product_id: number;
  quantity: number;
};

type UpdateWorkOrderPayload = {
  customer_name?: string;
  due_date?: string;
  priority?: 'Normal' | 'Urgent' | null;
  items?: UpdateWorkOrderItem[];
};

const toUpdateWorkOrderPayload = (wo: Partial<WorkOrder>): UpdateWorkOrderPayload => {
  const payload: UpdateWorkOrderPayload = {};

  if ((wo as any).customer_name || wo.customerName) {
    payload.customer_name = (wo as any).customer_name ?? wo.customerName;
  }
  if ((wo as any).due_date || wo.dueDate) {
    payload.due_date = (wo as any).due_date ?? wo.dueDate;
  }
  if ((wo as any).priority || wo.priority) {
    payload.priority = (wo as any).priority ?? wo.priority ?? null;
  }

  if (wo.items) {
    payload.items = wo.items.map((it: any) => {
      const item: UpdateWorkOrderItem = {
        product_id: Number(it.product_id ?? it.productId),
        quantity: Number(it.quantity ?? 0),
      };
      // Only include `id` if it's a real numeric DB id
      // Frontend-generated ids (e.g. "AL-abc123") are intentionally excluded
      const rawId = it.id ?? it.itemId;
      const numericId = Number(rawId);
      if (rawId !== undefined && rawId !== '' && !isNaN(numericId) && numericId > 0) {
        item.id = numericId;
      }
      return item;
    });
  }

  return payload;
};

// --------- MAPPER: Frontend -> API (create from Sales Order) ---------

type CreateWorkOrderFromSalesPayload = {
  sales_order_id: number;
  due_date?: string | null;
  priority?: 'Normal' | 'Urgent' | null;
};

const toCreateWOFromSalesPayload = (input: {
  salesOrderId: string | number;
  dueDate?: string;
  priority?: WorkOrder['priority'];
}): CreateWorkOrderFromSalesPayload => ({
  sales_order_id: Number(input.salesOrderId),
  due_date: input.dueDate ?? null,
  priority: (input.priority as any) ?? null,
});

export const productionService = {
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/work_orders');
    const raw = handleResponse<any[]>(response);
    return Array.isArray(raw) ? raw.map(mapApiWorkOrder) : [];
  },

  getWorkOrderById: async (id: string): Promise<WorkOrder> => {
    const response = await apiClient.get<ApiResponse<any>>(`/work_orders/${id}`);
    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  // ✅ Manual Create: JSON body (customer_name + due_date + items — no ids)
  createWorkOrder: async (wo: Partial<WorkOrder>): Promise<WorkOrder> => {
    const payload = toCreateWorkOrderPayload(wo);
    const response = await apiClient.post<ApiResponse<any>>('/work_orders', payload);
    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  // ✅ Create From Sales Order: FormData (sales_order_id + optional due_date + priority)
  createWorkOrderFromSalesOrder: async (input: {
    salesOrderId: string | number;
    dueDate?: string;
    priority?: WorkOrder['priority'];
  }): Promise<WorkOrder> => {
    const payload = toCreateWOFromSalesPayload(input);

    const fd = new FormData();
    fd.append('sales_order_id', String(payload.sales_order_id));
    if (payload.due_date) fd.append('due_date', payload.due_date);
    if (payload.priority) fd.append('priority', String(payload.priority));

    const response = await apiClient.post<ApiResponse<any>>('/work_orders', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  // ✅ Update Work Order: JSON body
  // Items WITH `id`  → backend updates that existing item
  // Items WITHOUT `id` → backend inserts as a new item
  updateWorkOrder: async (id: string, wo: Partial<WorkOrder>): Promise<WorkOrder> => {
    const payload = toUpdateWorkOrderPayload(wo);
    const response = await apiClient.put<ApiResponse<any>>(`/work_orders/${id}`, payload);
    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  // ✅ Update Status: x-www-form-urlencoded  (backend requires this encoding)
  // Valid values: Draft | Allocating | Approved | In Production | Completed
  updateWOStatus: async (id: string, status: string): Promise<WorkOrder> => {
    const params = new URLSearchParams();
    params.append('status', status);

    const response = await apiClient.patch<ApiResponse<any>>(
      `/work_orders/${id}/status`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  allocateMaterials: async (id: string, allocations: any): Promise<WorkOrder> => {
    const response = await apiClient.post<ApiResponse<any>>(`/work_orders/${id}/allocate`, { allocations });
    const raw = handleResponse<any>(response);
    return mapApiWorkOrder(raw);
  },

  deleteWorkOrder: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/work_orders/${id}`);
    handleResponse<void>(response);
  },
};