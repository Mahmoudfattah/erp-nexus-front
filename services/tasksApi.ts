import apiClient from '../api/apiClient';
import { Task } from '../types';
import { useState, useCallback, useEffect } from 'react';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: string;
  category?: string;
  relatedTo?: string;
}

export const tasksService = {
  getTasks: (filters?: { status?: string; priority?: string; assigned_to?: string }) =>
    apiClient.get<{ data: Task[] }>('/tasks', { params: filters }),
  getTaskById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  createTask: (task: Partial<Task>) => apiClient.post<Task>('/tasks', task),
  updateTask: (id: string, task: Partial<Task>) => apiClient.put<Task>(`/tasks/${id}`, task),
  deleteTask: (id: string | number) => apiClient.delete(`/tasks/${id}`),
  updateTaskStatus: (id: string, status: string) => apiClient.patch<Task>(`/tasks/${id}`, { status }),
};

// React hooks for task operations
export const useGetTasksQuery = (filters?: { status?: string; priority?: string; assigned_to?: string }) => {
  const [data, setData] = useState<{ data: Task[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await tasksService.getTasks(filters);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsFetching(false);
    }
  }, [filters]);

  useEffect(() => {
    setIsLoading(true);
    refetch().finally(() => setIsLoading(false));
  }, [refetch]);

  return { data, isLoading, error, isFetching, refetch };
};

export const useCreateTaskMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(async (task: CreateTaskRequest) => {
    setIsLoading(true);
    try {
      const response = await tasksService.createTask(task);
      setError(null);
      return { data: response.data };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }] as const;
};

export const useUpdateTaskMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(async (id: string | number, task: Partial<Task>) => {
    setIsLoading(true);
    try {
      const response = await tasksService.updateTask(String(id), task);
      setError(null);
      return { data: response.data };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }] as const;
};

export const useDeleteTaskMutation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (id: string | number) => {
    setIsLoading(true);
    try {
      await tasksService.deleteTask(id);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unwrap = async (promise: any) => promise;

  return [mutate, { isLoading, unwrap }] as const;
};

export type { Task };
