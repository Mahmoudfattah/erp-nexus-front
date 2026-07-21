// purchaseService.ts
import apiClient from './apiClient';
import { PurchaseOrder, Vendor, InvoiceItem } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

const handleResponse = <T>(response: any): T => {
  const apiResponse: ApiResponse<T> = response.data;
  if (apiResponse.success && apiResponse.data !== undefined) {
    return apiResponse.data;
  }
  throw new Error(apiResponse.message || 'API request failed');
};

// --------- MAPPERS: API (snake_case) -> Frontend (camelCase) ---------

const mapApiVendor = (apiVendor: any): Vendor => ({
  id: String(apiVendor.id),
  name: apiVendor.name ?? '',
  contactPerson: apiVendor.contact_person ?? '',
  email: apiVendor.email ?? '',
  phone: apiVendor.phone ?? '',
  address: apiVendor.address ?? undefined,
  website: apiVendor.website ?? undefined,
  tax_id: apiVendor.tax_id ?? undefined,
  payment_terms: apiVendor.payment_terms ?? undefined,
  notes: apiVendor.notes ?? undefined,
  status: (apiVendor.status as Vendor['status']) ?? 'Active',
});

const mapApiPurchaseItem = (apiItem: any): InvoiceItem => ({
  id: String(apiItem.id),
  productId: apiItem.product_id ? String(apiItem.product_id) : undefined,
  description: apiItem.description ?? '',
  quantity: Number(apiItem.quantity ?? 0),
  unitPrice: Number(apiItem.unit_price ?? 0),
  total: Number(apiItem.total ?? 0),
});

const mapApiPurchaseOrder = (apiPo: any): PurchaseOrder => {
  const approval = apiPo.approval;

  return {
    id: String(apiPo.id),
    vendorId: String(apiPo.vendor_id),
    vendorName: apiPo.vendor?.name ?? '',
    date: apiPo.date,
    expectedDelivery: apiPo.expected_delivery,
    status: apiPo.status as PurchaseOrder['status'],
    totalAmount: Number(apiPo.total_amount ?? 0),
    items: Array.isArray(apiPo.items) ? apiPo.items.map(mapApiPurchaseItem) : [],
    paymentDate: apiPo.payment_date ?? undefined,
    invoiceReference: apiPo.invoice_reference ?? undefined,

    approval: approval
      ? {
          id: String(approval.id),
          entityId: approval.entity_id ? String(approval.entity_id) : undefined,
          status: approval.status,
          approvedBy: approval.approved_by ?? null,
          approvedAt: approval.approved_at ?? null,
        }
      : undefined,
  };
};

export const purchaseService = {
  // ================= Vendors =================
  getVendors: async (): Promise<Vendor[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/vendors');
    const raw = handleResponse<any[]>(res);
    return Array.isArray(raw) ? raw.map(mapApiVendor) : [];
  },

  getVendorById: async (id: string): Promise<Vendor> => {
    const res = await apiClient.get<ApiResponse<any>>(`/vendors/${id}`);
    return mapApiVendor(handleResponse<any>(res));
  },

  createVendor: async (vendor: Partial<Vendor>): Promise<Vendor> => {
    const res = await apiClient.post<ApiResponse<any>>('/vendors', vendor);
    return mapApiVendor(handleResponse<any>(res));
  },

  updateVendor: async (id: string, vendor: Partial<Vendor>): Promise<Vendor> => {
    const res = await apiClient.put<ApiResponse<any>>(`/vendors/${id}`, vendor);
    return mapApiVendor(handleResponse<any>(res));
  },

  deleteVendor: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/vendors/${id}`);
  },

  // ================= Purchase Orders =================
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/purchase-orders');
    const raw = handleResponse<any[]>(res);
    return Array.isArray(raw) ? raw.map(mapApiPurchaseOrder) : [];
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const res = await apiClient.get<ApiResponse<any>>(`/purchase-orders/${id}`);
    const raw = handleResponse<any>(res);
    console.log('[getPurchaseOrderById] raw approval:', raw?.approval);
    return mapApiPurchaseOrder(raw);
  },

  createPurchaseOrder: async (po: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const payload = {
      vendor_id: po.vendorId ? Number(po.vendorId) : undefined,
      expected_delivery: po.expectedDelivery,
      items: (po.items || [])
        .map((i) => ({
          product_id: i.productId ? Number(i.productId) : null,
          description: i.description ?? null,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        }))
        .filter((i) => Number(i.quantity) > 0),
    };

    const res = await apiClient.post<ApiResponse<any>>('/purchase-orders', payload);
    return mapApiPurchaseOrder(handleResponse<any>(res));
  },

  updatePurchaseOrder: async (id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const payload = {
      vendor_id: po.vendorId ? Number(po.vendorId) : undefined,
      expected_delivery: po.expectedDelivery,
      items: (po.items || [])
        .map((i) => ({
          product_id: i.productId ? Number(i.productId) : null,
          description: i.description ?? null,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        }))
        .filter((i) => Number(i.quantity) > 0),
    };

    const res = await apiClient.put<ApiResponse<any>>(`/purchase-orders/${id}`, payload);
    return mapApiPurchaseOrder(handleResponse<any>(res));
  },

  updatePOStatus: async (
    id: string,
    data: { status: string; invoice_reference?: string; payment_date?: string }
  ): Promise<PurchaseOrder> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/purchase-orders/${id}/status`, data);
    return mapApiPurchaseOrder(handleResponse<any>(res));
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/purchase-orders/${id}`);
  },

  getAnalytics: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/purchase-orders/analytics');
    return handleResponse<any>(res);
  },

  // ================= Approval Flow =================

  /**
   * Fetch the approval record directly by PO id.
   * Used as fallback when the list response doesn't include approval.
   */
  getApprovalIdForPO: async (poId: string): Promise<string | null> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/purchase-orders/${poId}`);
      const raw = handleResponse<any>(res);
      console.log('[getApprovalIdForPO] raw:', raw);
      const approvalId = raw?.approval?.id;
      return approvalId ? String(approvalId) : null;
    } catch (err) {
      console.error('[getApprovalIdForPO] failed:', err);
      return null;
    }
  },

  /**
   * ✅ FIXED: Changed from application/x-www-form-urlencoded to JSON.
   * Backend error message is extracted and rethrown for display in UI.
   */
  changeApprovalStatus: async (
    approvalId: string,
    data: { status: 'approved' | 'rejected'; comments?: string }
  ): Promise<any> => {
    console.log('[changeApprovalStatus] approvalId:', approvalId, 'data:', data);

    try {
      // ✅ Send as JSON (not form-urlencoded)
      const res = await apiClient.patch<ApiResponse<any>>(`/approvals/${approvalId}`, {
        status: data.status,
        ...(data.comments ? { comments: data.comments } : {}),
      });

      return handleResponse<any>(res);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Approval status change failed';

      console.error('[changeApprovalStatus] failed:', err?.response?.data || err);
      throw new Error(backendMessage);
    }
  },

  approvePurchaseOrder: async (approvalId: string, comments?: string) => {
    return purchaseService.changeApprovalStatus(approvalId, {
      status: 'approved',
      comments,
    });
  },

  rejectPurchaseOrder: async (approvalId: string, comments?: string) => {
    return purchaseService.changeApprovalStatus(approvalId, {
      status: 'rejected',
      comments,
    });
  },
};