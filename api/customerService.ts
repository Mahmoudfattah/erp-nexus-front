import apiClient from './apiClient';
import { Customer } from '../types';

export const customerService = {
  getCustomers: () => apiClient.get<{ data: Customer[] }>('/customers'),
  getCustomerById: (id: string) => apiClient.get<Customer>(`/customers/${id}`),
  createCustomer: (customer: Partial<Customer>) => apiClient.post<Customer>('/customers', customer),
  updateCustomer: (id: string, customer: Partial<Customer>) => apiClient.put<Customer>(`/customers/${id}`, customer),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),
  getCustomerOrders: (id: string) => apiClient.get(`/customers/${id}/orders`),
};
