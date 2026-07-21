import React from 'react';
import { useGetTasksQuery, useDeleteTaskMutation, Task } from '../services/tasksApi';

interface TasksListProps {
    onEdit: (task: Task) => void;
}

const TasksList: React.FC<TasksListProps> = ({ onEdit }) => {
    // We can pass filters for pagination, status, etc. as an argument here.
    const { data: tasksResponse, error, isLoading, isFetching } = useGetTasksQuery();
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(id).unwrap();
            } catch (err) {
                console.error('Failed to delete the task:', err);
            }
        }
    };


    if (isLoading) {
        return <div>Loading tasks...</div>;
    }

    if (error) {
        // In a real app, you'd want to handle this more gracefully with a proper error component.
        console.error('Error fetching tasks:', error);
        return <div>Error fetching tasks. Please check the console and try again later.</div>;
    }

    if (!tasksResponse || tasksResponse.data.length === 0) {
        return <div>No tasks found.</div>;
    }

    return (
        <div>
            <h1>Tasks</h1>
            {isFetching && <p>Refreshing...</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                        <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Priority</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Due Date</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Assignee</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasksResponse.data.map((task) => (
                        <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{task.id}</td>
                            <td style={{ padding: '8px' }}>{task.title}</td>
                            <td style={{ padding: '8px' }}>{task.status}</td>
                            <td style={{ padding: '8px' }}>{task.priority}</td>
                            <td style={{ padding: '8px' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                            <td style={{ padding: '8px' }}>{task.assignee?.name ?? 'Unassigned'}</td>
                            <td style={{ padding: '8px', display: 'flex', gap: '10px' }}>
                                <button onClick={() => onEdit(task)} style={{ padding: '5px 10px' }}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(task.id)} disabled={isDeleting} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TasksList;
