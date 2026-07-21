
// import apiClient from './apiClient';
// import { SalesOrder } from '../types';

// interface ApiResponse<T> {
//   success: boolean;
//   message?: string;
//   data: T;
//   meta?: any;
// }

// const handleResponse = <T>(response: any): T => {
//   const apiResponse: ApiResponse<T> = response.data;
//   if (apiResponse.success && apiResponse.data) {
//     return apiResponse.data;
//   }
//   throw new Error(apiResponse.message || 'API request failed');
// };

// export const salesService = {
//   getOrders: async (): Promise<SalesOrder[]> => {
//     const response = await apiClient.get<ApiResponse<SalesOrder[]>>('/sales-orders');
//     return handleResponse<SalesOrder[]>(response);
//   },

//   getOrderById: async (id: string): Promise<SalesOrder> => {
//     const response = await apiClient.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
//     return handleResponse<SalesOrder>(response);
//   },

//   createOrder: async (order: Partial<SalesOrder>): Promise<SalesOrder> => {
//     const response = await apiClient.post<ApiResponse<SalesOrder>>('/sales-orders', order);
//     return handleResponse<SalesOrder>(response);
//   },

//   updateOrder: async (id: string, order: Partial<SalesOrder>): Promise<SalesOrder> => {
//     const response = await apiClient.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, order);
//     return handleResponse<SalesOrder>(response);
//   },

//   updateOrderStatus: async (id: string, status: string): Promise<SalesOrder> => {
//     const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/sales-orders/${id}/status`, { status });
//     return handleResponse<SalesOrder>(response);
//   },

//   deleteOrder: async (id: string): Promise<void> => {
//     await apiClient.delete<ApiResponse<void>>(`/sales-orders/${id}`);
//   },

//   /** Bulk delete: sends ids in request body, not in URL */
//   deleteOrders: async (ids: number[]): Promise<void> => {
//     const response = await apiClient.request<ApiResponse<void>>({
//       method: 'delete',
//       url: '/sales-orders',
//       data: { ids },
//     });
//     if (response.data?.success === false) {
//       throw new Error(response.data?.message || 'Delete failed');
//     }
//   },

//   getAnalytics: async (): Promise<{
//     summary: { total_orders: number; total_revenue: string; average_order_value: number };
//     by_status: Array<{ status: string; count: number; total: string }>;
//     top_customers: Array<{ customer_name: string; count: number; total: string }>;
//   }> => {
//     const response = await apiClient.get<ApiResponse<any>>('/sales-orders/analytics');
//     return handleResponse<any>(response);
//   },

//   linkToDeal: async (orderIds: number[], dealReference: string): Promise<void> => {
//     await apiClient.post<ApiResponse<void>>('/sales-orders/link-deal', {
//       order_ids: orderIds,
//       deal_reference: dealReference,
//     });
//   },
// };


import apiClient from './apiClient';
import { SalesOrder } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

// For endpoints that return { success: true, data: ... }
const handleResponse = <T>(response: any): T => {
  const apiResponse: ApiResponse<T> = response.data;
  if (apiResponse.success && apiResponse.data !== undefined) {
    return apiResponse.data;
  }
  throw new Error(apiResponse.message || 'API request failed');
};

// For endpoints that may return { success: true } without useful data
const handleVoidResponse = (response: any): void => {
  const apiResponse = response.data as { success?: boolean; message?: string };
  if (apiResponse?.success === false) {
    throw new Error(apiResponse.message || 'API request failed');
  }
};

export type OrderStatus = 'quote' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export type StatusChangePayload = {
  orders: Array<{
    order_id: number;
    items?: Array<{
      item_id: number;
      allocations: Array<{ location_id: number; quantity: number }>;
    }>;
  }>;
  status: OrderStatus;
};

export const salesService = {
  getOrders: async (): Promise<SalesOrder[]> => {
    const response = await apiClient.get<ApiResponse<SalesOrder[]>>('/sales-orders');
    return handleResponse<SalesOrder[]>(response);
  },

  getOrderById: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
    return handleResponse<SalesOrder>(response);
  },

  createOrder: async (order: Partial<SalesOrder>): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>('/sales-orders', order);
    return handleResponse<SalesOrder>(response);
  },

  updateOrder: async (id: string, order: Partial<SalesOrder>): Promise<SalesOrder> => {
    const response = await apiClient.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, order);
    return handleResponse<SalesOrder>(response);
  },

  /**
   * ✅ NEW (Backend changed):
   * PATCH /sales-orders/status
   * Body:
   * {
   *   orders: [{ order_id, items?: [{ item_id, allocations: [{location_id, quantity}]}] }],
   *   status: "confirmed" | "shipped" | "completed" | "cancelled"
   * }
   */
  changeStatus: async (payload: StatusChangePayload): Promise<void> => {
    const response = await apiClient.patch('/sales-orders/status', payload);
    handleVoidResponse(response);
  },

  /**
   * ⚠️ OLD endpoint (keep only if backend still supports it):
   * PATCH /sales-orders/{id}/status  { status }
   * Prefer using changeStatus() now.
   */
  updateOrderStatus: async (id: string, status: string): Promise<SalesOrder> => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/sales-orders/${id}/status`, { status });
    return handleResponse<SalesOrder>(response);
  },

  deleteOrder: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/sales-orders/${id}`);
    handleVoidResponse(response);
  },

  /** Bulk delete: sends ids in request body, not in URL */
  deleteOrders: async (ids: number[]): Promise<void> => {
    const response = await apiClient.request<ApiResponse<void>>({
      method: 'delete',
      url: '/sales-orders',
      data: { ids },
    });
    handleVoidResponse(response);
  },

  getAnalytics: async (): Promise<{
    summary: { total_orders: number; total_revenue: string; average_order_value: number };
    by_status: Array<{ status: string; count: number; total: string }>;
    top_customers: Array<{ customer_name: string; count: number; total: string }>;
  }> => {
    const response = await apiClient.get<ApiResponse<any>>('/sales-orders/analytics');
    return handleResponse<any>(response);
  },

  linkToDeal: async (orderIds: number[], dealReference: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<void>>('/sales-orders/link-deal', {
      order_ids: orderIds,
      deal_reference: dealReference,
    });
    handleVoidResponse(response);
  },
};
