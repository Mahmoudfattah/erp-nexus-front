import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task } from '../types';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  X,
  Search,
  Calendar,
  User,
  BarChart3,
  List,
  PieChart as PieChartIcon,
  CheckSquare,
  Activity,
  Loader,
  Pencil,
} from 'lucide-react';

import { useNotification } from './NotificationContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useLanguage } from './LanguageContext';
import { tasksService } from '../api/tasksService';
import { hrService } from '../api/hrService';

type Employee = { id: string; name: string; employee_code?: string };

// ---- local task type with mapped fields ----
type UiTask = Task & {
  dueDate?: string; // ✅ always "YYYY-MM-DD" in UI
  relatedTo?: string | null;

  // ✅ normalized assignee fields
  assignedEmployeeId?: string; // from assigned_employee_id
  assigneeName?: string;       // from assignee.name (optional)
};

const COLORS = ['#94a3b8', '#3b82f6', '#10b981'];
const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' } as const;

// ---- date helper (Fix: "2026-02-22T00:00:00.000000Z" -> "2026-02-22") ----
const toYmd = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  return d.toISOString().slice(0, 10);
};

const normalizeStatus = (s: any): Task['status'] => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'pending' || v === 'p') return 'Pending';
  if (v === 'in progress' || v === 'in_progress' || v === 'inprogress') return 'In Progress';
  if (v === 'completed' || v === 'done') return 'Completed';
  return 'Pending';
};

const normalizeTask = (task: any): UiTask => {
  const assignedEmployeeId =
    task?.assigned_employee_id != null
      ? String(task.assigned_employee_id)
      : task?.assignee?.id != null
        ? String(task.assignee.id)
        : '';

  const assigneeName = task?.assignee?.name != null ? String(task.assignee.name) : '';

  return {
    ...task,
    id: String(task.id),

    // ✅ snake_case -> camelCase used in UI
    dueDate: toYmd(task.due_date ?? task.dueDate),
    relatedTo: task.related_to ?? task.relatedTo ?? null,

    status: normalizeStatus(task.status),
    priority: task.priority ?? 'Medium',

    assignedEmployeeId,
    assigneeName,
  };
};

const TasksView: React.FC = () => {
  const { t, language } = useLanguage();
  const isRTL = (language || '').toLowerCase().startsWith('ar');
  const { addNotification } = useNotification();

  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const isLoading = loadingTasks || loadingEmployees;

  const [view, setView] = useState<'list' | 'analysis'>('list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // ✅ separate create form (so update doesn't fill create)
  const emptyCreateTask = useMemo(
    () => ({
      title: '',
      description: '',
      dueDate: toYmd(new Date()), // ✅ default today: "YYYY-MM-DD"
      priority: 'Medium' as Task['priority'],
      status: 'Pending' as Task['status'],
      category: 'Other',
      relatedTo: '',
      assignedEmployeeId: '', // ✅ id
    }),
    []
  );

  const [createTask, setCreateTask] = useState(emptyCreateTask);

  // ✅ update form (only allowed fields)
  const emptyUpdateTask = useMemo(
    () => ({
      title: '',
      description: '',
      priority: 'Medium' as Task['priority'],
      assignedEmployeeId: '', // ✅ id
    }),
    []
  );

  const [updateTaskForm, setUpdateTaskForm] = useState(emptyUpdateTask);

  const employeeById = useMemo(() => {
    const map: Record<string, Employee> = {};
    employees.forEach(e => (map[e.id] = e));
    return map;
  }, [employees]);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await tasksService.getTasks();
        // your API returns { success, data: [...] }
        const data = Array.isArray(res) ? res : res?.data;
        const list = Array.isArray(data) ? data.map(normalizeTask) : [];
        setTasks(list);
      } catch (error: any) {
        console.error('Failed to fetch tasks:', error);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await hrService.getEmployees();
        // your API returns { success, data: [...] }
        const data = Array.isArray(res) ? res : res?.data;

        const list: Employee[] = Array.isArray(data)
          ? data.map((e: any) => ({
              id: String(e.id),
              name: String(e.name ?? ''),
              employee_code: e.employee_code ? String(e.employee_code) : undefined,
            }))
          : [];

        setEmployees(list.filter(e => e.name));
      } catch (error: any) {
        console.error('Failed to fetch employees:', error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Deadline Monitoring (skip if dueDate is empty)
  const notifiedTaskIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const todayStr = toYmd(new Date());

    tasks.forEach(task => {
      if (task.status === 'Completed' || notifiedTaskIds.current.has(task.id)) return;
      if (!task.dueDate) return;

      if (task.dueDate < todayStr) {
        addNotification('error', t('notifications.task_overdue').replace('{title}', task.title));
        notifiedTaskIds.current.add(task.id);
      } else if (task.dueDate === todayStr) {
        addNotification('warning', t('notifications.task_due_today').replace('{title}', task.title));
        notifiedTaskIds.current.add(task.id);
      }
    });
  }, [tasks, addNotification, t]);

  // Analytics
  const analyticsData = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusData = [
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: inProgress },
      { name: 'Completed', value: completed },
    ].filter(d => d.value > 0);

    const priorityData = [
      { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
      { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
    ];

    const assigneeDataMap = tasks.reduce((acc: Record<string, number>, task) => {
      const id = task.assignedEmployeeId || '';
      const label = id
        ? (employeeById[id]?.name ?? task.assigneeName ?? `Employee #${id}`)
        : 'Unassigned';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const assigneeData = Object.entries(assigneeDataMap)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);

    return { total, completed, pending, inProgress, highPriority, completionRate, statusData, priorityData, assigneeData };
  }, [tasks, employeeById]);

  const filteredTasks = tasks.filter(task => {
    const assigneeName = task.assignedEmployeeId
      ? (employeeById[task.assignedEmployeeId]?.name ?? task.assigneeName ?? '')
      : '';

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.relatedTo && task.relatedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      assigneeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setCreateTask({ ...emptyCreateTask, dueDate: toYmd(new Date()) }); // ✅ always set today
    setIsModalOpen(true);
  };

  // ✅ CREATE: send assigned_employee_id + due_date (snake_case)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const body: any = {
      title: createTask.title || 'New Task',
      description: createTask.description || '',
      due_date: createTask.dueDate || null,
      priority: createTask.priority || 'Medium',
      status: createTask.status || 'Pending',
      category: createTask.category || 'Other',
      related_to: createTask.relatedTo || null,
      assigned_employee_id: createTask.assignedEmployeeId ? Number(createTask.assignedEmployeeId) : null,
    };

    try {
      const createdRes = await tasksService.createTask(body);
      const created = createdRes?.data ?? createdRes;
      const normalized = normalizeTask(created);

      const assignedEmployeeId = normalized.assignedEmployeeId || createTask.assignedEmployeeId || '';
      const dueDate = normalized.dueDate || createTask.dueDate || '';

      setTasks(prev => [{ ...normalized, assignedEmployeeId, dueDate }, ...prev]);

      setIsModalOpen(false);
      setCreateTask({ ...emptyCreateTask, dueDate: toYmd(new Date()) });
      addNotification('success', 'New task created successfully');
    } catch (err: any) {
      console.error('Failed to create task:', err);
      addNotification('error', 'Failed to create task');
    }
  };

  const openUpdateModal = (task: UiTask) => {
    setSelectedTaskId(task.id);
    setUpdateTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: (task.priority as any) || 'Medium',
      assignedEmployeeId: task.assignedEmployeeId || '',
    });
    setUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setSelectedTaskId(null);
    setUpdateTaskForm(emptyUpdateTask);
  };

  // ✅ UPDATE: send assigned_employee_id
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    const body: any = {
      title: updateTaskForm.title || '',
      description: updateTaskForm.description || '',
      priority: updateTaskForm.priority || 'Medium',
      assigned_employee_id: updateTaskForm.assignedEmployeeId ? Number(updateTaskForm.assignedEmployeeId) : null,
    };

    try {
      const updatedRes = await tasksService.updateTask(selectedTaskId, body);
      const updated = updatedRes?.data ?? updatedRes;

      const normalized = normalizeTask(updated);

      // ✅ merge (keep assigned_employee_id even if server returns null)
      setTasks(prev =>
        prev.map(t => {
          if (t.id !== selectedTaskId) return t;

          const keepAssigned =
            normalized.assignedEmployeeId ||
            updateTaskForm.assignedEmployeeId ||
            t.assignedEmployeeId ||
            '';

          return {
            ...t,
            ...normalized,
            title: normalized.title ?? body.title ?? t.title,
            description: normalized.description ?? body.description ?? t.description,
            priority: (normalized.priority ?? body.priority ?? t.priority) as any,
            assignedEmployeeId: keepAssigned,
          };
        })
      );

      closeUpdateModal();
      addNotification('success', 'Task updated successfully');
    } catch (err: any) {
      console.error('Failed to update task:', err);
      addNotification('error', 'Failed to update task');
    }
  };

  const toggleTaskStatus = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus: Task['status'] = task.status === 'In Progress' ? 'Pending' : 'In Progress';

      if (newStatus === 'In Progress') {
        setAnimatingId(id);
        setTimeout(() => setAnimatingId(null), 600);
      }

      const updatedRes = await tasksService.updateTaskStatus(id, newStatus);
      const updated = updatedRes?.data ?? updatedRes;
      const normalized = normalizeTask(updated);

      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, ...normalized, assignedEmployeeId: normalized.assignedEmployeeId || t.assignedEmployeeId }
            : t
        )
      );
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      addNotification('error', 'Failed to update task status');
    }
  };

  const toggleTaskStatusToComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus: Task['status'] = task.status === 'Completed' ? 'In Progress' : 'Completed';

      if (newStatus === 'Completed') {
        setAnimatingId(id);
        setTimeout(() => setAnimatingId(null), 600);
      }

      const updatedRes = await tasksService.updateTaskStatus(id, newStatus);
      const updated = updatedRes?.data ?? updatedRes;
      const normalized = normalizeTask(updated);

      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, ...normalized, assignedEmployeeId: normalized.assignedEmployeeId || t.assignedEmployeeId }
            : t
        )
      );
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      addNotification('error', 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await tasksService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addNotification('info', 'Task deleted');
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      addNotification('error', 'Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getTranslatedPriority = (priority: string) => {
    if (priority === 'High') return t('tasks.priority.high');
    if (priority === 'Medium') return t('tasks.priority.medium');
    if (priority === 'Low') return t('tasks.priority.low');
    return priority;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">{t('tasks.title')}</h2>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={16} /> {t('tasks.view_list')}
            </button>
            <button
              onClick={() => setView('analysis')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                view === 'analysis' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={16} /> {t('tasks.view_analysis')}
            </button>
          </div>
        </div>

        {view === 'list' && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t('tasks.search_placeholder')}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <select
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
              >
                <option value="All">{t('tasks.status_all')}</option>
                <option value="Pending">{t('tasks.status_pending')}</option>
                <option value="In Progress">{t('tasks.status_in_progress')}</option>
                <option value="Completed">{t('tasks.status_completed')}</option>
              </select>

              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm whitespace-nowrap"
              >
                <Plus size={18} />
                {t('tasks.new_task')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <AlertCircle className="mx-auto mb-2" size={32} />
              <p>{t('tasks.no_tasks')}</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const emp = task.assignedEmployeeId ? employeeById[task.assignedEmployeeId] : undefined;
              const assigneeLabel = task.assignedEmployeeId
                ? emp
                  ? `${emp.name}${emp.employee_code ? ` (${emp.employee_code})` : ''}`
                  : (task.assigneeName || `Employee #${task.assignedEmployeeId}`)
                : '';

              return (
                <div
                  key={task.id}
                  className={`bg-white p-5 rounded-xl border shadow-sm transition-all duration-500 hover:shadow-md group relative overflow-hidden ${
                    task.status === 'Completed' ? 'border-slate-100 opacity-75' : 'border-slate-200'
                  } ${
                    animatingId === task.id
                      ? 'scale-[1.03] border-emerald-400 shadow-emerald-100 ring-1 ring-emerald-400 bg-emerald-50/30'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                        {getTranslatedPriority(task.priority)}
                      </span>
                      {task.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {task.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                     
                     {task.status === 'Pending' &&
                     
                      <button
                        onClick={() => openUpdateModal(task)}
                        className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                     }

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className={`font-bold text-slate-800 mb-1 transition-all duration-300 ${task.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description || 'No description provided.'}</p>

                  <div className="flex flex-col gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      {task.relatedTo ? (
                        <div className="flex items-center gap-1.5 text-slate-600" title={t('tasks.related_to')}>
                          <span className="font-medium">{t('tasks.related_to')}:</span> {task.relatedTo}
                        </div>
                      ) : (
                        <span />
                      )}

                      {assigneeLabel && (
                        <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          <User size={12} />
                          {assigneeLabel}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {task.dueDate || '—'}
                      </div>

                      {task.status === 'Pending' && (
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 bg-slate-100 text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 hover:scale-105 active:scale-95"
                        >
                          <Circle size={14} />
                          Move to In Progress
                        </button>
                      )}

                      {task.status === 'In Progress' && (
                        <button
                          onClick={() => toggleTaskStatusToComplete(task.id)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:scale-105 active:scale-95"
                        >
                          <Circle size={14} />
                          {t('tasks.mark_done')}
                        </button>
                      )}
                    </div>
                  </div>

                  {animatingId === task.id && (
                    <div className="absolute inset-0 bg-emerald-100/10 pointer-events-none animate-pulse rounded-xl" />
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Analysis View (unchanged)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">{t('tasks.kpi.total')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{analyticsData.total}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">{t('tasks.kpi.completion_rate')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{analyticsData.completionRate}%</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">{t('tasks.kpi.pending')}</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{analyticsData.pending}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500">{t('tasks.kpi.high_priority')}</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{analyticsData.highPriority}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <PieChartIcon size={18} className="text-indigo-600" />
                {t('tasks.charts.status')}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {analyticsData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                {t('tasks.charts.priority')}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.priorityData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis tickMargin={isRTL ? 60 : 0} dataKey="name" type="category" width={60} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {analyticsData.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              {t('tasks.charts.workload')}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.assigneeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickMargin={isRTL ? 10 : 0} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {updateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Update Task</h3>
              <button onClick={closeUpdateModal}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={updateTaskForm.title}
                  onChange={e => setUpdateTaskForm({ ...updateTaskForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={updateTaskForm.description}
                  onChange={e => setUpdateTaskForm({ ...updateTaskForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    value={updateTaskForm.priority}
                    onChange={e => setUpdateTaskForm({ ...updateTaskForm, priority: e.target.value as any })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    value={updateTaskForm.assignedEmployeeId}
                    onChange={e => setUpdateTaskForm({ ...updateTaskForm, assignedEmployeeId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}{emp.employee_code ? ` (${emp.employee_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{t('tasks.modal.create_title')}</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.modal.subject')}</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={createTask.title}
                  onChange={e => setCreateTask({ ...createTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.modal.description')}</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  value={createTask.description}
                  onChange={e => setCreateTask({ ...createTask, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.modal.due_date')}</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    value={createTask.dueDate}
                    onChange={e => setCreateTask({ ...createTask, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.modal.priority')}</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    value={createTask.priority}
                    onChange={e => setCreateTask({ ...createTask, priority: e.target.value as any })}
                  >
                    <option value="Low">{t('tasks.priority.low')}</option>
                    <option value="Medium">{t('tasks.priority.medium')}</option>
                    <option value="High">{t('tasks.priority.high')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.modal.assigned_to')}</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  value={createTask.assignedEmployeeId}
                  onChange={e => setCreateTask({ ...createTask, assignedEmployeeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}{emp.employee_code ? ` (${emp.employee_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm"
                >
                  {t('tasks.modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;