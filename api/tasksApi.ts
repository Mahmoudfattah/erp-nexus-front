import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date: string | null;
    assigned_to: number | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    assignee?: User | null;
    creator?: User | null;
}

export interface TasksResponse {
    data: Task[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
}

export interface TaskFilters {
    page?: number;
    status?: string;
    priority?: string;
    assigned_to?: number;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assigned_to?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
    id: number;
}

export const tasksApi = createApi({
    reducerPath: 'tasksApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Task'],
    endpoints: (builder) => ({
        getTasks: builder.query<TasksResponse, TaskFilters | void>({
            query: (params) => ({
                url: 'tasks',
                params: params || undefined,
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.data.map(({ id }) => ({ type: 'Task' as const, id })),
                          { type: 'Task', id: 'LIST' },
                      ]
                    : [{ type: 'Task', id: 'LIST' }],
        }),
        getTask: builder.query<Task, number>({
            query: (id) => `tasks/${id}`,
            providesTags: (result, error, id) => [{ type: 'Task', id }],
        }),
        createTask: builder.mutation<Task, CreateTaskRequest>({
            query: (body) => ({
                url: 'tasks',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Task', id: 'LIST' }],
        }),
        updateTask: builder.mutation<Task, UpdateTaskRequest>({
            query: ({ id, ...body }) => ({
                url: `tasks/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Task', id },
                { type: 'Task', id: 'LIST' },
            ],
        }),
        deleteTask: builder.mutation<void, number>({
            query: (id) => ({
                url: `tasks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Task', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useGetTaskQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = tasksApi;
