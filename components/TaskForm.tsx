import React, { useState, useEffect } from 'react';
import {
    useCreateTaskMutation,
    useUpdateTaskMutation,
    Task,
    CreateTaskRequest
} from '../services/tasksApi';

interface TaskFormProps {
    task?: Task;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSuccess, onCancel }) => {
    const [createTask, { isLoading: isCreating, error: createError }] = useCreateTaskMutation();
    const [updateTask, { isLoading: isUpdating, error: updateError }] = useUpdateTaskMutation();

    const [formData, setFormData] = useState<CreateTaskRequest>({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        assigned_to: undefined,
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                assigned_to: task.assigned_to || undefined,
            });
        }
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'assigned_to' ? (value ? parseInt(value, 10) : undefined) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (task) {
                await updateTask({ id: task.id, ...formData }).unwrap();
            } else {
                await createTask(formData).unwrap();
                // Reset form on successful create
                setFormData({
                    title: '',
                    description: '',
                    status: 'pending',
                    priority: 'medium',
                    due_date: '',
                    assigned_to: undefined,
                });
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to save task:', err);
        }
    };

    const isLoading = isCreating || isUpdating;
    const error = createError || updateError;

    return (
        <div className="task-form-container" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>An error occurred saving the task.</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', minHeight: '80px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Priority</label>
                        <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Due Date</label>
                        <input
                            type="date"
                            name="due_date"
                            value={formData.due_date || ''}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Assigned To (User ID)</label>
                        <input
                            type="number"
                            name="assigned_to"
                            value={formData.assigned_to || ''}
                            onChange={handleChange}
                            placeholder="User ID"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {onCancel && (
                        <button type="button" onClick={onCancel} disabled={isLoading} style={{ padding: '8px 16px' }}>
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={isLoading} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                        {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskForm;
