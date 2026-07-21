import React, { useState } from 'react';
import TasksList from '../../../nexus-api/app/Http/Controllers/TasksList';
import TaskForm from '../../../nexus-api/app/Http/Controllers/TaskForm';
import { Task } from '../services/tasksApi';

const TasksContainer: React.FC = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

    const handleCreateClick = () => {
        setSelectedTask(undefined);
        setIsFormVisible(true);
    };

    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setIsFormVisible(true);
    };

    const handleFormSuccess = () => {
        setIsFormVisible(false);
        setSelectedTask(undefined);
        // The list will refetch automatically due to RTK Query's tag invalidation
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setSelectedTask(undefined);
    };

    return (
        <div style={{ padding: '20px' }}>
            {isFormVisible ? (
                <TaskForm
                    task={selectedTask}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            ) : (
                <>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={handleCreateClick} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Create New Task
                        </button>
                    </div>
                    <TasksList onEdit={handleEditClick} />
                </>
            )}
        </div>
    );
};

export default TasksContainer;
