import React, { useState, useMemo, useEffect } from 'react';
import { Employee, LeaveRequest, PayrollRecord, Subscription, AttendanceRecord, User } from '../types';
import {
  Users,
  Calendar,
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Briefcase,
  Mail,
  Download,
  Clock,
  FileText,
  Lock,
  Timer,
  LogIn,
  ArrowRight,
  LogOut,
  RotateCcw,
  Loader2,
  Navigation,
  ExternalLink,
  UserCog,
  Clock2,
  Pencil,
  ToggleLeft,
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from './LanguageContext';
import StatsCard from './StatsCard';
import { useNotification } from './NotificationContext';
import { hrService } from '../api/hrService';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Sales', 'Marketing',
  'Finance', 'HR', 'Customer Support', 'Operations',
];

const ROLES = [
  'Senior Developer', 'Junior Developer', 'Tech Lead', 'Product Manager',
  'UX Designer', 'UI Designer', 'Sales Director', 'Account Executive',
  'Marketing Manager', 'Content Writer', 'Financial Controller',
  'HR Manager', 'Talent Acquisition', 'Support Specialist', 'Operations Lead',
];

// ---------- helpers ----------
const safeStr = (v: any, fallback = '') => (v == null ? fallback : String(v));
const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toISODate = (v: any) => {
  const s = safeStr(v, '');
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes(' ')) return s.split(' ')[0];
  return s;
};

const toMonthLabel = (v: any) => {
  const d = toISODate(v);
  return d ? d.slice(0, 7) : '';
};

const unwrapList = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

// Normalize times to HH:mm (UI friendly)
const toHHmm = (v?: string) => {
  const s = safeStr(v, '');
  if (!s) return '';
  if (s.includes('T')) return s.split('T')[1].slice(0, 5);
  // HH:mm:ss or HH:mm
  return s.slice(0, 5);
};

// ---------- normalize employees ----------
const normalizeClockAttendance = (api: any, todayStr: string): AttendanceRecord => {
  const date = api?.date ? String(api.date).split('T')[0] : todayStr;

  return {
    id: String(api?.id ?? ''),
    employeeId: String(api?.employee_id ?? api?.employeeId ?? ''),
    employeeName: safeStr(api?.employee_name ?? api?.employeeName ?? ''),
    date,
    clockIn: toHHmm(api?.clock_in ?? api?.clockIn),
    clockOut: api?.clock_out || api?.clockOut ? toHHmm(api?.clock_out ?? api?.clockOut) : undefined,
    status: (safeStr(api?.status, 'Present') as AttendanceRecord['status']),
    totalHours: api?.total_hours != null ? Number(api.total_hours) : (api?.totalHours != null ? Number(api.totalHours) : undefined),
    location: api?.lat && api?.lng
      ? {
          lat: Number(api.lat),
          lng: Number(api.lng),
          address: safeStr(api?.address, 'Geo-Verified'),
        }
      : undefined,
  };
};

const normalizeEmployee = (apiEmp: any): Employee => {
  const id = safeStr(apiEmp?.id);
  return {
    id,
    employeeId: safeStr(apiEmp?.employee_code ?? apiEmp?.employeeId ?? apiEmp?.code, id),
    name: safeStr(apiEmp?.name),
    role: safeStr(apiEmp?.role_department ?? apiEmp?.role?.name ?? apiEmp?.role, '—'),
    department: safeStr(apiEmp?.department, '—'),
    email: safeStr(apiEmp?.email, ''),
    phone: safeStr(apiEmp?.phone, 'N/A'),
    address: safeStr(apiEmp?.address ?? '', ''),
    certificate: safeStr(apiEmp?.certificate ?? '', ''),
    contractNumber: safeStr(apiEmp?.contract_number ?? apiEmp?.contractNumber ?? '', ''),
    status: safeStr(apiEmp?.status, 'Active') as any,
    joinDate: toISODate(apiEmp?.join_date ?? apiEmp?.joinDate ?? apiEmp?.created_at) || '',
    salary: safeNum(apiEmp?.salary, 0),
    managerId: safeStr(apiEmp?.manager_id ?? apiEmp?.managerId ?? ''),
    managerName: safeStr(apiEmp?.manager?.name ?? apiEmp?.managerName ?? ''),
  };
};

// ---------- normalize payroll ----------
const normalizePayroll = (apiRun: any): PayrollRecord => ({
  id: safeStr(apiRun?.id),
  month: toMonthLabel(apiRun?.month) || safeStr(apiRun?.month, ''),
  totalEmployees: safeNum(apiRun?.total_employees ?? apiRun?.totalEmployees, 0),
  totalAmount: safeNum(apiRun?.total_amount ?? apiRun?.totalAmount, 0),
  status: safeStr(apiRun?.status, 'Pending') as any,
  dateProcessed: toISODate(apiRun?.date_processed ?? apiRun?.dateProcessed) || '',
});

// ---------- normalize attendance ----------
const normalizeAttendance = (a: any): AttendanceRecord => ({
  id: safeStr(a?.id),
  employeeId: safeStr(a?.employee_id ?? a?.employeeId),
  employeeName: safeStr(a?.employee?.name ?? a?.employeeName ?? ''),
  date: toISODate(a?.date) || '',
  clockIn: toHHmm(a?.clock_in ?? a?.clockIn),
  clockOut: (a?.clock_out ?? a?.clockOut) ? toHHmm(a?.clock_out ?? a?.clockOut) : undefined,
  status: safeStr(a?.status, 'Present') as any,
  totalHours: (a?.total_hours ?? a?.totalHours) != null ? safeNum(a?.total_hours ?? a?.totalHours, 0) : undefined,
  location: (a?.lat && a?.lng)
    ? { lat: safeNum(a.lat), lng: safeNum(a.lng), address: safeStr(a?.address ?? '') }
    : undefined,
});

// ---------- normalize leave request ----------
const normalizeLeaveRequest = (l: any): LeaveRequest => ({
  id: safeStr(l?.id),
  employeeId: safeStr(l?.employee_id ?? l?.employeeId),
  employeeName: safeStr(l?.employee_name ?? l?.employee?.name ?? l?.employeeName ?? ''),
  type: safeStr(l?.type, 'Vacation') as any,
  startDate: toISODate(l?.start_date ?? l?.startDate) || '',
  endDate: toISODate(l?.end_date ?? l?.endDate) || '',
  reason: safeStr(l?.reason, ''),
  status: safeStr(l?.status, 'Pending') as any,
});

// ---------- blank employee form ----------
const blankEmployee = (): Partial<Employee> & {
  password: string;
  password_confirmation: string;
  role_id: number;
  company_id: string;
} => ({
  employeeId: '',
  name: '',
  role: ROLES[0],
  department: DEPARTMENTS[0],
  email: '',
  phone: '',
  address: '',
  certificate: '',
  contractNumber: '',
  status: 'Active',
  salary: 0,
  managerId: '',
  password: '123456789',
  password_confirmation: '123456789',
  role_id: 1,
  company_id: '',
});

interface HRViewProps {
  user: User;
  subscription?: Subscription;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const HRView: React.FC<HRViewProps> = ({ user, subscription, attendanceRecords, setAttendanceRecords }) => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  const [activeSubTab, setActiveSubTab] =
    useState<'employees' | 'leave' | 'payroll' | 'attendance' | 'archive'>('employees');

  // Loading states
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingLeave, setIsLoadingLeave] = useState(false);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);

  // Modal state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Edit mode for employee modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Edit mode for leave modal
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [isEditLeaveModalOpen, setIsEditLeaveModalOpen] = useState(false);
  const [editLeaveForm, setEditLeaveForm] = useState({ startDate: '', endDate: '' });

  // Status update target
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; current: string } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'On Leave' | 'Terminated'>('Active');

  const todayStr = new Date().toISOString().split('T')[0];

  const [newEmployee, setNewEmployee] = useState(blankEmployee());

  const [newLeaveRequest, setNewLeaveRequest] = useState<Partial<LeaveRequest>>({
    employeeId: '', type: 'Vacation', startDate: '', endDate: '', reason: '',
  });

  const [newAttendance, setNewAttendance] = useState<Partial<AttendanceRecord>>({
    employeeId: '', date: todayStr, clockIn: '09:00', clockOut: '17:00',
  });

  const [archivedEmployees, setArchivedEmployees] = useState<Employee[]>([]);
  const [isLoadingArchivedEmployees, setIsLoadingArchivedEmployees] = useState(false);

  // ─── Fetch employees ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        const res = await hrService.getEmployees();
        const list = unwrapList(res).map(normalizeEmployee);
        setEmployees(list);
      } catch (error: any) {
        console.error('Failed to fetch employees:', error);
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchArchivedEmployees = async () => {
      try {
        setIsLoadingArchivedEmployees(true);
        const res = await hrService.getEmployeesArchived();
        const list = unwrapList(res).map(normalizeEmployee);
        setArchivedEmployees(list);
      } catch (error) {
        console.error('Failed to fetch archived employees:', error);
        setArchivedEmployees([]);
      } finally {
        setIsLoadingArchivedEmployees(false);
      }
    };
    fetchArchivedEmployees();
  }, []);

  // ─── Fetch attendance ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoadingAttendance(true);
        const res = await hrService.getAttendance();
        const raw = Array.isArray(res) ? res
          : Array.isArray((res as any)?.data) ? (res as any).data
          : Array.isArray((res as any)?.data?.data) ? (res as any).data.data
          : [];
        setAttendanceList(raw.map(normalizeAttendance));
      } catch (error: any) {
        console.error('Failed to fetch attendance:', error);
        setAttendanceList([]);
      } finally {
        setIsLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, []);

  // ─── Fetch leave requests ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setIsLoadingLeave(true);
        const res = await hrService.getLeaveRequests();
        const raw = Array.isArray(res) ? res
          : Array.isArray((res as any)?.data) ? (res as any).data
          : Array.isArray((res as any)?.data?.data) ? (res as any).data.data
          : [];
        setLeaveRequests(raw.map(normalizeLeaveRequest));
      } catch (error: any) {
        console.error('Failed to fetch leave requests:', error);
        setLeaveRequests([]);
      } finally {
        setIsLoadingLeave(false);
      }
    };
    fetchLeaveRequests();
  }, []);

  // ─── Fetch payroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setIsLoadingPayroll(true);
        const res = await hrService.getPayrollHistory();
        const list = unwrapList(res).map(normalizePayroll);
        setPayrolls(list);
      } catch (error: any) {
        console.error('Failed to fetch payroll:', error);
        setPayrolls([]);
      } finally {
        setIsLoadingPayroll(false);
      }
    };
    fetchPayroll();
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  // Prefer employeeId if available on user (fix mismatch bug)
  const myEmployeeId = useMemo(() => {
    const u: any = user as any;
    return String(u?.employeeId ?? u?.employee_id ?? user.id);
  }, [user]);

  const myAttendanceToday = useMemo(
    () => attendanceRecords.find(
      r => String(r.employeeId) === myEmployeeId && r.date === todayStr
    ),
    [attendanceRecords, myEmployeeId, todayStr]
  );

  const attendanceStats = useMemo(() => {
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
    const presentCount = todayRecords.length;
    const onTimeCount = todayRecords.filter(r => r.status === 'Present').length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    const onTimeRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;
    const avgHours =
      todayRecords.length > 0
        ? (todayRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0) / todayRecords.length).toFixed(1)
        : '0';
    return { presentCount, onTimeRate, lateCount, avgHours };
  }, [attendanceRecords, todayStr]);

  const filteredEmployees = employees
    .filter(e => e.status !== 'Terminated')
    .filter(e => {
      const term = searchTerm.toLowerCase();
      return (
        safeStr(e.name).toLowerCase().includes(term) ||
        safeStr(e.role).toLowerCase().includes(term) ||
        safeStr(e.department).toLowerCase().includes(term) ||
        safeStr(e.employeeId).toLowerCase().includes(term)
      );
    });

  const filteredArchivedEmployees = archivedEmployees.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      safeStr(e.name).toLowerCase().includes(term) ||
      safeStr(e.role).toLowerCase().includes(term) ||
      safeStr(e.department).toLowerCase().includes(term) ||
      safeStr(e.employeeId).toLowerCase().includes(term)
    );
  });

  const filteredLeave = leaveRequests.filter(l => {
    const term = searchTerm.toLowerCase();
    return safeStr(l.employeeName).toLowerCase().includes(term) || safeStr(l.type).toLowerCase().includes(term);
  });

  const filteredAttendance = attendanceList.filter(r => {
    const term = searchTerm.toLowerCase();
    return safeStr(r.employeeName).toLowerCase().includes(term) || safeStr(r.date).includes(searchTerm);
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRestoreEmployee = async (emp: Employee) => {
    if (!window.confirm(`Restore ${emp.name}?`)) return;

    try {
      await hrService.restoreEmployee(emp.id);

      // remove from archived
      setArchivedEmployees(prev => prev.filter(e => e.id !== emp.id));

      // add back to active list
      setEmployees(prev => [{ ...emp, status: 'Active' as any }, ...prev]);

      addNotification('success', 'Employee restored successfully.');
    } catch (err: any) {
      console.error('Failed to restore employee:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to restore employee');
    }
  };

  const handlePayrollClick = () => {
    if (subscription && subscription.tier !== 'Enterprise') {
      addNotification('warning', 'Payroll Management is available on the Enterprise plan.');
      return;
    }
    setActiveSubTab('payroll');
  };

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setNewEmployee({ ...blankEmployee(), company_id: String((user as any).companyId ?? '') });
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewEmployee({
      ...emp,
      password: '',
      password_confirmation: '',
      role_id: (emp as any).role_id ?? 1,
      company_id: String((emp as any).company_id ?? (user as any).companyId ?? ''),
    } as any);
    setIsEmployeeModalOpen(true);
  };

  // CREATE or UPDATE employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const res = await hrService.updateEmployee(editingEmployee.id, newEmployee);
        const updated = normalizeEmployee((res as any)?.data ?? res ?? newEmployee);
        setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? updated : emp));
        addNotification('success', 'Employee updated successfully.');
      } else {
        const res = await hrService.createEmployee(newEmployee);
        const emp = normalizeEmployee((res as any)?.data ?? res);
        setEmployees(prev => [...prev, emp]);
        addNotification('success', 'Employee added to directory.');
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      setNewEmployee(blankEmployee());
    } catch (err: any) {
      console.error('Failed to save employee:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save employee';
      addNotification('error', msg);
    }
  };

  // Open status change modal
  const openStatusModal = (emp: Employee) => {
    setStatusTarget({ id: emp.id, name: emp.name, current: emp.status });
    setSelectedStatus(emp.status as any);
    setIsStatusModalOpen(true);
  };

  // PATCH status
  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    try {
      const res = await hrService.updateEmployeeStatus(statusTarget.id, selectedStatus);
      const updated = normalizeEmployee((res as any)?.data ?? res ?? { ...statusTarget, status: selectedStatus });
      setEmployees(prev => prev.map(emp => emp.id === statusTarget.id ? { ...emp, status: updated.status } : emp));
      addNotification('success', `Status updated to "${selectedStatus}".`);
      setIsStatusModalOpen(false);
      setStatusTarget(null);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update employee status');
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newLeaveRequest.employeeId);
    if (!emp) return;

    try {
      const res = await hrService.submitLeaveRequest({
        employeeId: emp.id,
        employeeName: emp.name,
        type: (newLeaveRequest.type as any) || 'Vacation',
        startDate: newLeaveRequest.startDate || '',
        endDate: newLeaveRequest.endDate || '',
        reason: newLeaveRequest.reason || '',
        status: 'Pending',
      });

      const raw = (res as any)?.data ?? res;
      const normalized = normalizeLeaveRequest({
        ...raw,
        employee_name: raw?.employee_name ?? emp.name,
        employeeName: raw?.employeeName ?? emp.name,
      });

      setLeaveRequests(prev => [normalized, ...prev]);
      setIsLeaveModalOpen(false);
      setNewLeaveRequest({ employeeId: '', type: 'Vacation', startDate: '', endDate: '', reason: '' });
      addNotification('success', 'Leave request submitted.');
    } catch (err: any) {
      console.error('Failed to submit leave request:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const getPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
    );

  // ✅ FIX: normalize clock-in response + update BOTH lists
  const handleSelfCheckIn = async () => {
    setIsClockingIn(true);
    try {
      const pos = await getPosition();

      const apiRec = await hrService.clockIn({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      const rec = normalizeClockAttendance((apiRec as any)?.data ?? apiRec, todayStr);

      setAttendanceRecords(prev => [rec, ...prev]);      // Clock Widget
      setAttendanceList(prev => [rec, ...prev]);         // Attendance Table

      addNotification('success', 'Clock in recorded successfully');
    } catch (err: any) {
      addNotification('error', err?.response?.data?.message || err?.message || 'Clock in failed');
    } finally {
      setIsClockingIn(false);
    }
  };

  // ✅ FIX: normalize clock-out response + update BOTH lists
  const handleSelfCheckOut = async () => {
    if (!myAttendanceToday) return;

    setIsClockingOut(true);
    try {
      const apiUpdated = await hrService.clockOut();
      const updated = normalizeClockAttendance((apiUpdated as any)?.data ?? apiUpdated, todayStr);

      setAttendanceRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setAttendanceList(prev => prev.map(r => (r.id === updated.id ? updated : r)));

      addNotification('success', 'Clock out recorded successfully');
    } catch (err: any) {
      addNotification('error', err?.response?.data?.message || err?.message || 'Clock out failed');
    } finally {
      setIsClockingOut(false);
    }
  };

  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === newAttendance.employeeId);
    if (!emp) return;

    const [hours, mins] = (newAttendance.clockIn || '09:00').split(':').map(Number);
    const isLate = hours > 9 || (hours === 9 && mins > 0);

    let totalHours = 0;
    if (newAttendance.clockOut) {
      const [outH, outM] = newAttendance.clockOut.split(':').map(Number);
      totalHours = Number(((outH + outM / 60) - (hours + mins / 60)).toFixed(2));
    }

    try {
      const res = await hrService.createAttendance({
        employeeId: emp.id,
        employeeName: emp.name,
        date: newAttendance.date || todayStr,
        clockIn: newAttendance.clockIn || '09:00',
        clockOut: newAttendance.clockOut,
        status: isLate ? 'Late' : 'Present',
        totalHours,
      });

      const rec = normalizeAttendance((res as any)?.data ?? res);

      setAttendanceList(prev => [rec, ...prev]);
      setIsAttendanceModalOpen(false);
      setNewAttendance({ employeeId: '', date: todayStr, clockIn: '09:00', clockOut: '17:00' });

      addNotification('success', 'Attendance record added manually.');
    } catch (err: any) {
      console.error('Failed to create attendance record:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to add attendance record');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await hrService.deleteAttendance(id);
      setAttendanceList(prev => prev.filter(r => r.id !== id));
      addNotification('success', 'Attendance record deleted.');
    } catch (err: any) {
      console.error('Failed to delete attendance:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to delete attendance record');
    }
  };

  const handleLeaveAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await hrService.updateLeaveStatus(id, action);
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: action } : l));
      addNotification('info', `Leave request ${action.toLowerCase()}.`);
    } catch (err: any) {
      console.error('Failed to update leave request:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update leave request');
    }
  };

  const openEditLeave = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setEditLeaveForm({ startDate: leave.startDate, endDate: leave.endDate });
    setIsEditLeaveModalOpen(true);
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeave) return;

    try {
      await hrService.updateLeaveRequest(editingLeave.id, {
        startDate: editLeaveForm.startDate,
        endDate: editLeaveForm.endDate,
      });

      setLeaveRequests(prev => prev.map(l =>
        l.id === editingLeave.id
          ? { ...l, startDate: editLeaveForm.startDate, endDate: editLeaveForm.endDate }
          : l
      ));

      setIsEditLeaveModalOpen(false);
      setEditingLeave(null);
      addNotification('success', 'Leave request updated.');
    } catch (err: any) {
      console.error('Failed to update leave request:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to update leave request');
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      await hrService.deleteLeaveRequest(id);
      setLeaveRequests(prev => prev.filter(l => l.id !== id));
      addNotification('success', 'Leave request deleted.');
    } catch (err: any) {
      console.error('Failed to delete leave request:', err);
      addNotification('error', err?.response?.data?.message || 'Failed to delete leave request');
    }
  };

  const runPayroll = async () => {
    if (!window.confirm('Run payroll for the current month?')) return;
    try {
      const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const res = await hrService.processPayroll(currentMonthLabel);
      const newRun = normalizePayroll((res as any)?.data ?? res);
      setPayrolls(prev => [newRun, ...prev]);
      addNotification('success', `Payroll for ${currentMonthLabel} processed.`);
    } catch (err: any) {
      console.error('Failed to process payroll:', err);
      addNotification('error', 'Failed to process payroll');
    }
  };

  const downloadPayrollPDF = (record: PayrollRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('Payroll Summary', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Period: ${record.month}`, 14, 30);
    doc.text(`Status: ${record.status}`, 14, 36);
    doc.text(`Date Processed: ${record.dateProcessed || '-'}`, 14, 42);

    const rows = employees.filter(e => e.status !== 'Terminated').map(e => [
      e.employeeId, e.name, e.role, e.department, `$${((e.salary || 0) / 12).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['ID', 'Employee', 'Role', 'Department', 'Net Pay']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.text(`Total Payout: $${(record.totalAmount || 0).toFixed(2)}`, 14, finalY + 15);
    doc.save(`Payroll_${record.month}.pdf`);
  };

  const isAdmin =
    ['admin', 'manager', 'Admin', 'Manager', 'ADMIN', 'MANAGER'].includes(user.role ?? '') ||
    String(user.role ?? '').toLowerCase() === 'admin' ||
    String(user.role ?? '').toLowerCase() === 'manager';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── STATS + CLOCK WIDGET ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
          <StatsCard title="Present Today" value={attendanceStats.presentCount.toString()} trend="In Office" trendUp={true} icon={<Users size={20} />} color="bg-indigo-500" />
          <StatsCard title="On-Time Rate" value={`${attendanceStats.onTimeRate}%`} trend="Target 95%" trendUp={attendanceStats.onTimeRate >= 95} icon={<Timer size={20} />} color="bg-emerald-500" />
          <StatsCard title="Late Arrivals" value={attendanceStats.lateCount.toString()} trend="Requires Review" trendUp={false} icon={<Clock2 size={20} />} color="bg-amber-500" />
          <StatsCard title="Avg. Work Day" value={`${attendanceStats.avgHours} hrs`} trend="Target 8.0" trendUp={true} icon={<ArrowRight size={20} />} color="bg-blue-500" />
        </div>

        {/* Personal Clock Widget */}
        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 opacity-50" />

          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Clock className="text-indigo-600" size={20} /> Attendance Register
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Record your daily attendance with location verification.
                </p>
              </div>
            </div>

            {/* ✅ Case 1: not clocked in today */}
            {!myAttendanceToday && (
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <Navigation size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Not clocked in yet for {todayStr}</p>
                </div>

                <button
                  onClick={handleSelfCheckIn}
                  disabled={isClockingIn || isClockingOut}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isClockingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                  Register Clock In
                </button>
              </div>
            )}

            {/* ✅ Case 2/3: has attendance today */}
            {myAttendanceToday && (
              <div className="space-y-4">
                {/* Info */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Clock In Time</p>
                    <p className="text-xl font-black text-slate-800">{myAttendanceToday.clockIn || '-'}</p>
                  </div>

                  <div className="ml-auto text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        myAttendanceToday.status === 'Late'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {myAttendanceToday.status}
                    </span>
                  </div>
                </div>

                {/* ✅ Case 2: clocked in but not out */}
                {!myAttendanceToday.clockOut && (
                  <button
                    onClick={handleSelfCheckOut}
                    disabled={isClockingOut || isClockingIn}
                    className="w-full py-3 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isClockingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                    Register Clock Out
                  </button>
                )}

                {/* ✅ Case 3: completed */}
                {myAttendanceToday.clockOut && (
                  <div className="flex items-center gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase">Shift Completed</p>
                      <p className="text-xl font-black text-slate-800">{safeNum(myAttendanceToday.totalHours)} Hours Logged</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 overflow-x-hidden rounded-lg w-full sm:w-auto overflow-x-auto custom-scrollbar">
          {(['employees', 'archive', 'attendance', 'leave'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                activeSubTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'employees' && <><Users size={16} />{t('hr.tabs.directory')}</>}
              {tab === 'archive' && <><RotateCcw size={16} />Archived</>}
              {tab === 'attendance' && <><Timer size={16} />{t('hr.tabs.attendance')}</>}
              {tab === 'leave' && <><Calendar size={16} />{t('hr.tabs.leave')}</>}
            </button>
          ))}

          <button
            onClick={handlePayrollClick}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'payroll' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign size={16} />
            {subscription?.tier !== 'Enterprise' && <Lock size={12} className="text-amber-500 mr-1" />}
            {t('hr.tabs.payroll')}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('common.search')}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {activeSubTab === 'employees' && (
            <button
              onClick={openAddEmployee}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
            >
              <UserPlus size={18} />{t('hr.buttons.add_employee')}
            </button>
          )}
          {activeSubTab === 'attendance' && (
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
            >
              <LogIn size={18} />Log Attendance
            </button>
          )}
          {activeSubTab === 'leave' && (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
            >
              <Plus size={18} />{t('hr.buttons.new_request')}
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">

        {/* EMPLOYEES TAB */}
        {activeSubTab === 'employees' && (
          <div className="overflow-x-auto custom-scrollbar">
            {isLoadingEmployees ? (
              <div className="flex items-center justify-center p-16 text-slate-400">
                <Loader2 size={32} className="animate-spin mr-3" /> Loading employees…
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.employee')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.role_dept')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.details')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.status')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.salary')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.joined')}</th>
                    {isAdmin && (
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('common.actions')}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {(emp.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{emp.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Briefcase size={12} className="text-slate-400" />{emp.role}
                          </span>
                          <span className="text-xs text-slate-500">{emp.department}</span>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5" title={emp.email}>
                            <Mail size={12} className="text-slate-400" />
                            <span className="truncate max-w-[120px]">{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5" title={emp.contractNumber}>
                            <FileText size={12} className="text-slate-400" />
                            <span className="truncate max-w-[120px]">{emp.contractNumber || 'No Contract'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                          emp.status === 'Active'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : emp.status === 'On Leave'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      <td className="p-4 text-sm font-medium text-slate-700">
                        ${(emp.salary || 0).toLocaleString()}/yr
                      </td>

                      <td className="p-4 text-sm text-slate-500">
                        {emp.joinDate || '-'}
                      </td>

                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditEmployee(emp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => openStatusModal(emp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-colors"
                            >
                              <ToggleLeft size={12} /> Status
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-slate-400 italic">
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ARCHIVED / TERMINATED EMPLOYEES TABLE ── */}
        {activeSubTab === 'archive' && (
          <div className="border-t border-slate-100">
            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">Archived / Terminated Employees</h4>
                <p className="text-xs text-slate-500">Soft-deleted employees (deleted_at exists). You can restore them.</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">
                {archivedEmployees.length} total
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              {isLoadingArchivedEmployees ? (
                <div className="flex items-center justify-center p-10 text-slate-400">
                  <Loader2 size={22} className="animate-spin mr-2" /> Loading archived employees…
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Role / Dept</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Details</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Archived At</th>
                      {isAdmin && (
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredArchivedEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm">
                              {(emp.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{emp.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                              <Briefcase size={12} className="text-slate-400" />{emp.role}
                            </span>
                            <span className="text-xs text-slate-500">{emp.department}</span>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5" title={emp.email}>
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate max-w-[160px]">{emp.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5" title={emp.contractNumber}>
                              <FileText size={12} className="text-slate-400" />
                              <span className="truncate max-w-[160px]">{emp.contractNumber || 'No Contract'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium inline-block bg-rose-50 text-rose-700 border border-rose-100">
                            {emp.status || 'Terminated'}
                          </span>
                        </td>

                        <td className="p-4 text-sm text-slate-500">
                          {(emp as any).deletedAt || '-'}
                        </td>

                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreEmployee(emp)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                                title="Restore employee"
                              >
                                <RotateCcw size={12} /> Restore
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}

                    {filteredArchivedEmployees.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="p-10 text-center text-slate-400 italic">
                          No archived employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeSubTab === 'attendance' && (
          <div className="overflow-x-auto custom-scrollbar">
            {isLoadingAttendance ? (
              <div className="flex items-center justify-center p-16 text-slate-400">
                <Loader2 size={32} className="animate-spin mr-3" /> Loading attendance…
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Date</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Clock In/Out</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Duration</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    {isAdmin && <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map(record => {
                    const empName = record.employeeName
                      || employees.find(e => e.id === record.employeeId)?.name
                      || `Employee #${record.employeeId}`;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-slate-800">{empName}</p>
                          <p className="text-xs text-slate-400 font-mono">#{record.employeeId}</p>
                          {String(record.employeeId) === myEmployeeId && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded border border-indigo-100">YOU</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-center text-slate-600 font-medium">{record.date}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-700">{record.clockIn || '-'}</span>
                            {record.clockOut && <span className="text-[10px] text-slate-400">to</span>}
                            {record.clockOut && <span className="font-mono font-bold text-slate-700">{record.clockOut}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm font-medium text-indigo-600">
                          {record.totalHours != null ? `${record.totalHours} hrs` : '-'}
                        </td>
                        <td className="p-4">
                          {record.location ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                <Navigation size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700">{record.location.address || 'Geo-Verified'}</p>
                                {/* ✅ FIXED broken <a> */}
                                <a
                                  href={`https://www.google.com/maps?q=${record.location.lat},${record.location.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5"
                                >
                                  View Map <ExternalLink size={8} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No GPS Data</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            record.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : record.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : record.status === 'On Leave'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteAttendance(record.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
                              title="Delete record"
                            >
                              <XCircle size={12} /> Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-slate-400 italic">No attendance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* LEAVE TAB */}
        {activeSubTab === 'leave' && (
          <div className="overflow-x-auto custom-scrollbar">
            {isLoadingLeave ? (
              <div className="flex items-center justify-center p-16 text-slate-400">
                <Loader2 size={32} className="animate-spin mr-3" /> Loading leave requests…
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.employee')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.type')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.dates')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.reason')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('common.status')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeave.map(leave => {
                    const empName = leave.employeeName
                      || employees.find(e => e.id === String(leave.employeeId))?.name
                      || `Employee #${leave.employeeId}`;

                    return (
                      <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-slate-800">{empName}</p>
                          <p className="text-xs text-slate-400 font-mono">#{leave.employeeId}</p>
                        </td>

                        <td className="p-4 text-sm text-slate-600">{leave.type}</td>

                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <span className="font-medium">{leave.startDate || '—'}</span>
                            <ArrowRight size={12} className="text-slate-300" />
                            <span className="font-medium">{leave.endDate || '—'}</span>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-slate-600 italic max-w-[180px] truncate" title={leave.reason}>
                          "{leave.reason}"
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : leave.status === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {leave.status}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isAdmin && leave.status === 'Pending' && (
                              <button
                                onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}

                            {isAdmin && leave.status === 'Pending' && (
                              <button
                                onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={13} />
                              </button>
                            )}

                            {isAdmin && leave.status === 'Pending' && (
                              <button
                                onClick={() => openEditLeave(leave)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Edit dates"
                              >
                                <Pencil size={13} />
                              </button>
                            )}

                            {isAdmin && leave.status === 'Pending' && (
                              <button
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                                title="Delete"
                              >
                                <XCircle size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeave.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-sm italic">No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeSubTab === 'payroll' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('hr.payroll.title')}</h3>
                <p className="text-sm text-slate-500">{t('hr.payroll.subtitle')}</p>
              </div>
              <button
                onClick={runPayroll}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm text-sm font-medium"
              >
                <DollarSign size={16} />{t('hr.buttons.run_payroll')}
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.pay_period')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.processed_on')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.total_employees')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('hr.table.total_payout')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">{t('common.status')}</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingPayroll && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!isLoadingPayroll && payrolls.map(run => (
                    <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{run.month || '-'}</td>
                      <td className="p-4 text-sm text-slate-600">{run.dateProcessed || '-'}</td>
                      <td className="p-4 text-sm text-slate-600">{run.totalEmployees}</td>
                      <td className="p-4 font-medium text-slate-800">
                        ${safeNum(run.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {run.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => downloadPayrollPDF(run)}
                          className="flex items-center gap-2 ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <Download size={14} />{t('hr.buttons.summary')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingPayroll && payrolls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">No payroll runs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* Add / Edit Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {editingEmployee ? 'Edit Employee' : t('hr.modal.add_employee')}
              </h3>
              <button onClick={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}>
                <XCircle size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <input type="hidden" name="company_id" value={(newEmployee as any).company_id ?? ''} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.full_name')} *</label>
                  <input
                    required type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.name}
                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.employee_id')} *</label>
                  <input
                    required type="text" placeholder="e.g. EMP-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.employeeId}
                    onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.department')} *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.department}
                    onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.role')} *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.role}
                    onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.email')} *</label>
                  <input
                    required type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.phone')} *</label>
                  <input
                    required type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.phone}
                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <input
                      required type="password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={(newEmployee as any).password}
                      onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value } as any)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      required type="password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={(newEmployee as any).password_confirmation}
                      onChange={e => setNewEmployee({ ...newEmployee, password_confirmation: e.target.value } as any)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Manager</label>
                <div className="relative">
                  <UserCog size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.managerId}
                    onChange={e => setNewEmployee({ ...newEmployee, managerId: e.target.value })}
                  >
                    <option value="">No Manager / Self-Managed</option>
                    {employees
                      .filter(e => !editingEmployee || e.id !== editingEmployee.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.address')}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newEmployee.address}
                  onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.contract')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.contractNumber}
                    onChange={e => setNewEmployee({ ...newEmployee, contractNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.certificate')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.certificate}
                    onChange={e => setNewEmployee({ ...newEmployee, certificate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.salary')} *</label>
                <input
                  required type="number" min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newEmployee.salary}
                  onChange={e => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                {editingEmployee ? 'Save Changes' : t('hr.modal.add')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && statusTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ToggleLeft size={18} className="text-amber-500" /> Update Employee Status
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)}>
                <XCircle size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Change status for <span className="font-bold text-slate-800">{statusTarget.name}</span>
              </p>
              <div className="space-y-2">
                {(['Active', 'On Leave', 'Terminated'] as const).map(s => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStatus === s ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio" name="status" value={s}
                      checked={selectedStatus === s}
                      onChange={() => setSelectedStatus(s)}
                      className="accent-indigo-600"
                    />
                    <span className={`text-sm font-semibold ${
                      s === 'Active' ? 'text-emerald-700' : s === 'On Leave' ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleUpdateStatus}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Timer size={20} className="text-indigo-600" /> Log Attendance
              </h3>
              <button onClick={() => setIsAttendanceModalOpen(false)}>
                <XCircle size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleLogAttendance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newAttendance.employeeId}
                  onChange={e => setNewAttendance({ ...newAttendance, employeeId: e.target.value })}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.filter(e => e.status === 'Active').map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  required type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={newAttendance.date}
                  onChange={e => setNewAttendance({ ...newAttendance, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clock In</label>
                  <input
                    required type="time"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={newAttendance.clockIn}
                    onChange={e => setNewAttendance({ ...newAttendance, clockIn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clock Out</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={newAttendance.clockOut}
                    onChange={e => setNewAttendance({ ...newAttendance, clockOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                  <span className="font-bold">Note:</span> Standard clock-in is <span className="font-bold">09:00 AM</span>. Logs after this time will be flagged as <span className="font-bold">Late</span>.
                </p>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <ArrowRight size={18} /> Record Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{t('hr.modal.submit_leave')}</h3>
              <button onClick={() => setIsLeaveModalOpen(false)}>
                <XCircle size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.table.employee')}</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  value={newLeaveRequest.employeeId}
                  onChange={e => setNewLeaveRequest({ ...newLeaveRequest, employeeId: e.target.value })}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.filter(e => e.status === 'Active').map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.leave_type')}</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  value={newLeaveRequest.type}
                  onChange={e => setNewLeaveRequest({ ...newLeaveRequest, type: e.target.value as any })}
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.start_date')}</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={newLeaveRequest.startDate}
                    onChange={e => setNewLeaveRequest({ ...newLeaveRequest, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.end_date')}</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={newLeaveRequest.endDate}
                    onChange={e => setNewLeaveRequest({ ...newLeaveRequest, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('hr.modal.reason')}</label>
                <textarea
                  required rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Please describe the reason for leave…"
                  value={newLeaveRequest.reason}
                  onChange={e => setNewLeaveRequest({ ...newLeaveRequest, reason: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                {t('hr.modal.submit')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Request Modal */}
      {isEditLeaveModalOpen && editingLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Pencil size={18} className="text-indigo-600" /> Edit Leave Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingLeave.employeeName} · <span className="font-medium">{editingLeave.type}</span>
                </p>
              </div>
              <button onClick={() => { setIsEditLeaveModalOpen(false); setEditingLeave(null); }}>
                <XCircle size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editLeaveForm.startDate}
                    onChange={e => setEditLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editLeaveForm.endDate}
                    onChange={e => setEditLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  Only the start and end dates can be updated via this form.
                </p>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <Pencil size={16} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRView;