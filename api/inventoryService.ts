import apiClient from './apiClient';
import { Product, InventoryLocation, ProductAllocation } from '../types';

export interface InventoryMovement {
  id: string;
  product_id: string;
  quantity: number;
  type: 'Initial' | 'Purchase' | 'Sale' | 'Adjustment';
  reference?: string;
  notes?: string;
  created_at: string;
}

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

/** =========================
 *  MAPPERS (Backend -> Frontend)
 *  ========================= */
const mapAllocationFromApi = (a: any): any /* ProductAllocation */ => ({
  // keep id if your type has it
  id: a.id ?? String(a.id ?? ''),
  productId: a.product_id ?? a.productId,
  locationId: a.location_id ?? a.locationId,
  quantity: Number(a.quantity ?? 0),
  notes: a.notes ?? null,
  location: a.location ?? undefined,
});

const mapProductFromApi = (p: any): Product => ({
  id: p.id,
  // IMPORTANT: unify company id
  companyId: p.company_id ?? p.companyId,
  company_id: p.company_id, // لو الـ type بتاعك فيه الاتنين سيبه

  name: p.name ?? '',
  sku: p.sku ?? '',
  category: p.category ?? '',
  brand: p.brand ?? '',
  color: p.color ?? '',

  price: Number(p.price ?? 0),
  stock: Number(p.stock ?? 0),

  // IMPORTANT: unify threshold
  lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 0),
  low_stock_threshold: p.low_stock_threshold,

  status: p.status ?? undefined,

  // allocations coming from backend
  allocations: Array.isArray(p.allocations) ? p.allocations.map(mapAllocationFromApi) : [],

  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,

  // keep other optional fields if they exist in your UI
  history: p.history ?? [],
  monthlySales: p.monthlySales ?? p.monthly_sales ?? {},
});

/** =========================
 *  PAYLOAD (Frontend -> Backend)
 *  ========================= */
const buildProductPayloadForApi = (product: Partial<Product>) => {
  const allocations = (product.allocations || [])
    .map((a: any) => ({
      location_id: a.locationId != null ? Number(a.locationId) : undefined,
      quantity: Number(a.quantity ?? 0), // allow 0
      notes: a.notes ?? null,
    }))
    .filter((a: any) => Number.isFinite(a.location_id)); // only validate location_id

  const payload: any = {
    name: product.name ?? '',
    sku: product.sku ?? '',
    category: product.category ?? '',
    brand: product.brand ?? null,
    color: product.color ?? null,
    price: product.price ?? 0,
    low_stock_threshold: (product as any).lowStockThreshold ?? (product as any).low_stock_threshold ?? null,
    company_id: (product as any).companyId ?? (product as any).company_id,
    allocations, // ✅ دايمًا ابعتها حتى لو quantity=0
  };

  return payload;
};


export const inventoryService = {
  // ================= Products =================
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/products');
    const data = handleResponse<any[]>(response);
    return Array.isArray(data) ? data.map(mapProductFromApi) : [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<any>>(`/products/${id}`);
    const data = handleResponse<any>(response);
    return mapProductFromApi(data);
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const apiPayload = buildProductPayloadForApi(product);
    const response = await apiClient.post<ApiResponse<any>>('/products', apiPayload);
    const data = handleResponse<any>(response);
    return mapProductFromApi(data);
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const apiPayload = buildProductPayloadForApi(product);
    const response = await apiClient.put<ApiResponse<any>>(`/products/${id}`, apiPayload);
    const data = handleResponse<any>(response);
    return mapProductFromApi(data);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
  },

  adjustStock: async (
    id: string,
    data: { quantity: number; type: string; reference?: string; notes?: string }
  ): Promise<Product> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/products/${id}/adjust-stock`, data);
    const product = handleResponse<any>(response);
    return mapProductFromApi(product);
  },

  // ================= Inventory Locations =================
  // getLocations: async (): Promise<InventoryLocation[]> => {
  //   const response = await apiClient.get<ApiResponse<InventoryLocation[]>>('/inventory-locations');
  //   return handleResponse<InventoryLocation[]>(response);
  // },

  getLocations: async (): Promise<InventoryLocation[]> => {
  const response = await apiClient.get<ApiResponse<any>>('/inventory-locations');
  const raw = handleResponse<any>(response);

  // Case A: backend returns { data: Location[], pagination: ... }
  if (raw && Array.isArray(raw.data)) {
    return raw.data as InventoryLocation[];
  }

  // Case B: backend returns Location[] directly
  if (Array.isArray(raw)) {
    return raw as InventoryLocation[];
  }

  // Fallback
  return [];
},


getLocationsWithPagination: async (): Promise<{ data: InventoryLocation[]; pagination?: any }> => {
  const response = await apiClient.get<ApiResponse<any>>('/inventory-locations');
  const raw = handleResponse<any>(response);

  if (raw && Array.isArray(raw.data)) {
    return { data: raw.data, pagination: raw.pagination };
  }

  if (Array.isArray(raw)) {
    return { data: raw };
  }

  return { data: [] };
},


  getLocationById: async (id: string): Promise<InventoryLocation> => {
    const response = await apiClient.get<ApiResponse<InventoryLocation>>(`/inventory-locations/${id}`);
    return handleResponse<InventoryLocation>(response);
  },

  createLocation: async (location: Partial<InventoryLocation>): Promise<InventoryLocation> => {
    const response = await apiClient.post<ApiResponse<InventoryLocation>>('/inventory-locations', location);
    return handleResponse<InventoryLocation>(response);
  },

  updateLocation: async (id: string, location: Partial<InventoryLocation>): Promise<InventoryLocation> => {
    const response = await apiClient.put<ApiResponse<InventoryLocation>>(`/inventory-locations/${id}`, location);
    return handleResponse<InventoryLocation>(response);
  },

  deleteLocation: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/inventory-locations/${id}`);
  },

  getLocationInventory: async (id: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/inventory-locations/${id}/inventory`);
    return handleResponse<any>(response);
  },

  // ================= Product Allocations =================
  getAllocations: async (): Promise<ProductAllocation[]> => {
    const response = await apiClient.get<ApiResponse<ProductAllocation[]>>('/product-allocations');
    return handleResponse<ProductAllocation[]>(response);
  },

  getAllocationById: async (id: string): Promise<ProductAllocation> => {
    const response = await apiClient.get<ApiResponse<ProductAllocation>>(`/product-allocations/${id}`);
    return handleResponse<ProductAllocation>(response);
  },

  createAllocation: async (allocation: Partial<ProductAllocation>): Promise<ProductAllocation> => {
    const response = await apiClient.post<ApiResponse<ProductAllocation>>('/product-allocations', allocation);
    return handleResponse<ProductAllocation>(response);
  },

  updateAllocation: async (id: string, allocation: Partial<ProductAllocation>): Promise<ProductAllocation> => {
    const response = await apiClient.put<ApiResponse<ProductAllocation>>(`/product-allocations/${id}`, allocation);
    return handleResponse<ProductAllocation>(response);
  },

  deleteAllocation: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/product-allocations/${id}`);
  },

  getProductAllocations: async (productId: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/products/${productId}/allocations`);
    return handleResponse<any>(response);
  },

  bulkAllocate: async (data: any): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/product-allocations/bulk', data);
    return handleResponse<any>(response);
  },

  // ================= Inventory Movements =================
  getMovements: async (): Promise<InventoryMovement[]> => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>('/inventory-movements');
    return handleResponse<InventoryMovement[]>(response);
  },

  getMovementById: async (id: string): Promise<InventoryMovement> => {
    const response = await apiClient.get<ApiResponse<InventoryMovement>>(`/inventory-movements/${id}`);
    return handleResponse<InventoryMovement>(response);
  },

  createMovement: async (movement: Partial<InventoryMovement>): Promise<InventoryMovement> => {
    const response = await apiClient.post<ApiResponse<InventoryMovement>>('/inventory-movements', movement);
    return handleResponse<InventoryMovement>(response);
  },

  getProductHistory: async (productId: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/inventory-movements/product/${productId}`);
    return handleResponse<any>(response);
  },

  getTrendAnalysis: async (startDate: string, endDate: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/inventory-movements/trends`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return handleResponse<any>(response);
  },

  getStockHistory: async (productId: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/products/${productId}/history`);
    return handleResponse<any>(response);
  },
};
