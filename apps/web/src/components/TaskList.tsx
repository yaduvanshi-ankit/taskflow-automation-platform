'use client';
import type { Task } from '../lib/api';
import { TaskItem } from './TaskItem';

export function TaskList({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  if (isLoading) return <p className="empty">Loading tasks…</p>;
  if (!tasks.length) return <p className="empty">No tasks yet. Add one to watch the queue work.</p>;
  return (
    <div className="task-list" aria-live="polite">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} />
      ))}
    </div>
  );
}
