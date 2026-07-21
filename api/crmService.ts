
import apiClient from './apiClient';
import { Customer } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

const handleResponse = <T>(response: any): T => {
  const apiResponse: ApiResponse<T> = response.data;
  if (apiResponse.success && apiResponse.data) {
    return apiResponse.data;
  }
  throw new Error(apiResponse.message || 'API request failed');
};

export const crmService = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/customers');
    return handleResponse<Customer[]>(response);
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return handleResponse<Customer>(response);
  },

  createCustomer: async (customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', customer);
    return handleResponse<Customer>(response);
  },

  updateCustomer: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, customer);
    return handleResponse<Customer>(response);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
  },

  bulkUpdateStatus: async (ids: string[], status: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/customers/bulk-status', { ids, status });
  },
};
