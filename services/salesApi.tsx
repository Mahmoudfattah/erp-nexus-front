
import apiClient from '../api/apiClient';
import { SalesOrder } from '../types';
import { useState, useCallback, useEffect } from 'react';

// Plain service for direct API calls
export const salesService = {
  getOrders: () => apiClient.get<{ data: SalesOrder[] }>('/sales-orders'),
  getOrderById: (id: string) => apiClient.get<SalesOrder>(`/sales-orders/${id}`),
  createOrder: (order: Partial<SalesOrder>) => apiClient.post<SalesOrder>('/sales-orders', order),
  updateOrder: (id: string, order: Partial<SalesOrder>) => apiClient.put<SalesOrder>(`/sales-orders/${id}`, order),
  updateOrderStatus: (id: string, status: string) => apiClient.patch<SalesOrder>(`/sales-orders/${id}/status`, { status }),
  deleteOrder: (id: string) => apiClient.delete(`/sales-orders/${id}`),
  linkToDeal: (orderIds: string[], dealReference: string) => apiClient.post('/sales-orders/link-deal', { orderIds, dealReference }),
  getByDealReference: (dealReference: string) => apiClient.get(`/sales-orders/deal/${dealReference}`),
  getAnalytics: () => apiClient.get('/sales-orders/analytics'),
};

// React Query-like hooks for SalesView component
export const useGetSalesOrdersQuery = () => {
  const [data, setData] = useState<{ data: SalesOrder[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await salesService.getOrders();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};

export const useGetCustomersQuery = () => {
  const [data, setData] = useState<{ data: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ data: any[] }>('/customers');
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch(); // initial fetch
  }, [refetch]);

  return { data, isLoading, error, refetch };
};


export const useCreateSalesOrderMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(async (order: Partial<SalesOrder>) => {
    setIsLoading(true);
    try {
      const response = await salesService.createOrder(order);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }] as const;
};

export const useUpdateSalesOrderMutation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (id: string, order: Partial<SalesOrder>) => {
    setIsLoading(true);
    try {
      const response = await salesService.updateOrder(id, order);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading }] as const;
};

export const useDeleteSalesOrderMutation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await salesService.deleteOrder(id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading }] as const;
};

export const useLinkToDealMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(async (orderIds: string[], dealReference: string) => {
    setIsLoading(true);
    try {
      await salesService.linkToDeal(orderIds, dealReference);
      setError(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }] as const;
};

export const useGetProductsQuery = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get<{ data: any[] }>('/products');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { data, isLoading };
};


export const useCreateCustomerMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const mutate = useCallback(async (customer: Partial<any>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<any>('/customers', customer);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }] as const;
};

export const useUpdateCustomerMutation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (id: string, customer: Partial<any>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put<any>(`/customers/${id}`, customer);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading }] as const;
};

export const useDeleteCustomerMutation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/customers/${id}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading }] as const;
};

export type { SalesOrder as ApiSalesOrder } from '../types';
