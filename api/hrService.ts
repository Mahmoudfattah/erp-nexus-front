import apiClient from './apiClient';
import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '../types';

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

// Maps our internal Employee shape → API create payload
const toCreatePayload = (employee: Partial<Employee>) => ({
  name: employee.name,
  employee_code: employee.employeeId,
  role_department: employee.role,
  department: employee.department,
  email: employee.email,
  salary: employee.salary,
  phone: employee.phone,
  ...(employee.managerId ? { manager_id: employee.managerId } : {}),
  ...((employee as any).company_id ? { company_id: (employee as any).company_id } : {}),
  password: (employee as any).password ?? '123456789',
  password_confirmation: (employee as any).password_confirmation ?? '123456789',
  role_id: (employee as any).role_id ?? 1,
  ...(employee.address ? { address: employee.address } : {}),
  ...(employee.certificate ? { certificate: employee.certificate } : {}),
  ...(employee.contractNumber ? { contract_number: employee.contractNumber } : {}),
});

// Maps our internal Employee shape → API update payload
const toUpdatePayload = (employee: Partial<Employee>) => ({
  ...(employee.name !== undefined ? { name: employee.name } : {}),
  ...(employee.employeeId !== undefined ? { employee_code: employee.employeeId } : {}),
  ...(employee.role !== undefined ? { role_department: employee.role } : {}),
  ...(employee.email !== undefined ? { email: employee.email } : {}),
  ...(employee.department !== undefined ? { department: employee.department } : {}),
  ...(employee.salary !== undefined ? { salary: employee.salary } : {}),
  ...(employee.managerId !== undefined ? { manager_id: employee.managerId } : {}),
  ...(employee.phone !== undefined ? { phone: employee.phone } : {}),
  ...(employee.address !== undefined ? { address: employee.address } : {}),
  ...(employee.certificate !== undefined ? { certificate: employee.certificate } : {}),
  ...(employee.contractNumber !== undefined ? { contract_number: employee.contractNumber } : {}),
  ...((employee as any).role_id !== undefined ? { role_id: (employee as any).role_id } : {}),
  ...((employee as any).company_id !== undefined ? { company_id: (employee as any).company_id } : {}),
});

// ─────────────────────────────────────────────────────────────
// Attendance mapping: API (snake_case/ISO) -> Front (camelCase)
// ─────────────────────────────────────────────────────────────

const toDateOnly = (v: any) => {
  const s = v == null ? '' : String(v);
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes(' ')) return s.split(' ')[0];
  return s;
};

const toTimeOnly = (v: any) => {
  const s = v == null ? '' : String(v);
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[1]?.slice(0, 8) || '';
  return s.slice(0, 8);
};

const normalizeAttendanceApi = (api: any): AttendanceRecord => ({
  id: String(api?.id ?? ''),
  employeeId: String(api?.employee_id ?? ''),
  employeeName: String(api?.employee?.name ?? api?.employee_name ?? api?.employeeName ?? ''),
  date: toDateOnly(api?.date) || '',
  clockIn: toTimeOnly(api?.clock_in) || '',
  clockOut: api?.clock_out ? toTimeOnly(api.clock_out) : undefined,
  status: (api?.status || 'Present') as AttendanceRecord['status'],
  totalHours: api?.total_hours != null ? Number(api.total_hours) : undefined,
  location:
    api?.lat != null && api?.lng != null
      ? {
          lat: Number(api.lat),
          lng: Number(api.lng),
          address: api?.address ? String(api.address) : undefined,
        }
      : undefined,
});

export const hrService = {
  // ─── Employees ────────────────────────────────────────────────────────────

  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<ApiResponse<Employee[]>>('/employees');
    return handleResponse<Employee[]>(response);
  },

  getEmployeesArchived: async (): Promise<Employee[]> => {
    // your archive response contains pagination; handleResponse will return "data" array
    const response = await apiClient.get<ApiResponse<Employee[]>>('/employees/archive');
    return handleResponse<Employee[]>(response);
  },

  createEmployee: async (employee: Partial<Employee>): Promise<Employee> => {
    const payload = toCreatePayload(employee);
    const response = await apiClient.post<ApiResponse<Employee>>('/employees', payload);
    return handleResponse<Employee>(response);
  },

  updateEmployee: async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    const payload = toUpdatePayload(employee);
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, payload);
    return handleResponse<Employee>(response);
  },

  restoreEmployee: async (id: string): Promise<Employee> => {
    // you said restore is PATCH
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}/restore`);
    return handleResponse<Employee>(response);
  },

  updateEmployeeStatus: async (
    id: string,
    status: 'Active' | 'On Leave' | 'Terminated'
  ): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}/status`, { status });
    return handleResponse<Employee>(response);
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/employees/${id}`);
  },

  // ─── Attendance ───────────────────────────────────────────────────────────

  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/attendance');
    const raw = handleResponse<any[]>(response);
    return (raw || []).map(normalizeAttendanceApi);
  },

  /**
   * CLOCK IN
   * POST /attendance/clock-in
   * Body (form-data): lat, lng
   * Response: { data: { id, employee_id, date, clock_in, ... } }
   */
  clockIn: async (location: { lat: number; lng: number }): Promise<AttendanceRecord> => {
    const form = new FormData();
    form.append('lat', String(location.lat));
    form.append('lng', String(location.lng));

    const response = await apiClient.post<ApiResponse<any>>('/attendance/clock-in', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const apiRec = handleResponse<any>(response);
    return normalizeAttendanceApi(apiRec);
  },

  /**
   * CLOCK OUT
   * POST /attendance/clock-out
   * No body
   * Response: { data: { id, employee_id, clock_out, total_hours, ... } }
   */
  clockOut: async (): Promise<AttendanceRecord> => {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/clock-out');
    const apiRec = handleResponse<any>(response);
    return normalizeAttendanceApi(apiRec);
  },

  createAttendance: async (record: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const payload = {
      employee_id: record.employeeId,
      date: record.date,
      clock_in: record.clockIn,
      ...(record.clockOut ? { clock_out: record.clockOut } : {}),
      ...(record.status ? { status: record.status } : {}),
      ...(record.totalHours !== undefined ? { total_hours: record.totalHours } : {}),
    };
    const response = await apiClient.post<ApiResponse<any>>('/attendance', payload);
    const apiRec = handleResponse<any>(response);
    return normalizeAttendanceApi(apiRec);
  },

  deleteAttendance: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/attendance/${id}`);
  },

  updateAttendance: async (id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const payload = {
      ...(record.clockIn ? { clock_in: record.clockIn } : {}),
      ...(record.clockOut ? { clock_out: record.clockOut } : {}),
      ...(record.status ? { status: record.status } : {}),
      ...(record.totalHours !== undefined ? { total_hours: record.totalHours } : {}),
    };
    const response = await apiClient.put<ApiResponse<any>>(`/attendance/${id}`, payload);
    const apiRec = handleResponse<any>(response);
    return normalizeAttendanceApi(apiRec);
  },

  // ─── Leave Requests ───────────────────────────────────────────────────────

  getLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const response = await apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests');
    return handleResponse<LeaveRequest[]>(response);
  },

  submitLeaveRequest: async (req: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const payload = {
      employee_id: req.employeeId,
      type: req.type,
      start_date: req.startDate,
      end_date: req.endDate,
      reason: req.reason,
    };
    const response = await apiClient.post<ApiResponse<LeaveRequest>>('/leave-requests', payload);
    return handleResponse<LeaveRequest>(response);
  },

  updateLeaveRequest: async (id: string, req: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const payload: Record<string, any> = {};
    if (req.startDate !== undefined) payload.start_date = req.startDate;
    if (req.endDate !== undefined) payload.end_date = req.endDate;
    if (req.type !== undefined) payload.type = req.type;
    if (req.reason !== undefined) payload.reason = req.reason;

    const response = await apiClient.put<ApiResponse<LeaveRequest>>(`/leave-requests/${id}`, payload);
    return handleResponse<LeaveRequest>(response);
  },

  updateLeaveStatus: async (id: string, status: 'Approved' | 'Rejected'): Promise<LeaveRequest> => {
    const response = await apiClient.patch<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/status`, { status });
    return handleResponse<LeaveRequest>(response);
  },

  deleteLeaveRequest: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/leave-requests/${id}`);
  },

  // ─── Payroll ──────────────────────────────────────────────────────────────

  getPayrollHistory: async (): Promise<PayrollRecord[]> => {
    const response = await apiClient.get<ApiResponse<PayrollRecord[]>>('/payroll');
    return handleResponse<PayrollRecord[]>(response);
  },

  processPayroll: async (month: string): Promise<PayrollRecord> => {
    const response = await apiClient.post<ApiResponse<PayrollRecord>>('/payroll/process', { month });
    return handleResponse<PayrollRecord>(response);
  },
};