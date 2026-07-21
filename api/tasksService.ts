import apiClient from './apiClient';
import { Task } from '../types';

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

export const tasksService = {
  getTasks: async (filters?: { status?: string; priority?: string; assigned_to?: string }): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', { params: filters });
    return handleResponse<Task[]>(response);
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return handleResponse<Task>(response);
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', task);
    return handleResponse<Task>(response);
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, task);
    return handleResponse<Task>(response);
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: string, status: string): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return handleResponse<Task>(response);
  },
};
