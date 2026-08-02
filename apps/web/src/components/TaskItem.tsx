'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteTask, retryTask, updateTask, SOCKET_URL, type Task } from '../lib/api';

export function TaskItem({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const save = useMutation({
    mutationFn: () => updateTask(task._id, { title, description }),
    onSuccess: () => {
      setIsEditing(false);
      invalidate();
    }
  });
  const retry = useMutation({ mutationFn: () => retryTask(task._id), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: () => deleteTask(task._id), onSuccess: invalidate });

  if (isEditing) {
    return (
      <article className="task">
        <form
          className="edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <input aria-label="Edit title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea aria-label="Edit description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="actions">
            <button type="submit" disabled={save.isPending}>
              Save
            </button>
            <button type="button" className="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="task">
      <div>
        <span className={`status ${task.status}`}>{task.status}</span>
        <span className="priority">{task.priority}</span>
        <h3>{task.title}</h3>
        <p>{task.description || 'Queued for automated processing'}</p>
        {task.scheduledFor && <p>Scheduled: {new Date(task.scheduledFor).toLocaleString()}</p>}
        {task.attachment && (
          <a href={`${SOCKET_URL}${task.attachment.path}`} target="_blank" rel="noreferrer">
            Attachment: {task.attachment.filename}
          </a>
        )}
        {task.lastError && <p className="error">{task.lastError}</p>}
      </div>
      <div className="actions">
        {task.status === 'failed' && (
          <button type="button" className="secondary" disabled={retry.isPending} onClick={() => retry.mutate()}>
            Retry
          </button>
        )}
        <button type="button" className="secondary" disabled={task.status === 'processing'} onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="secondary"
          disabled={task.status === 'processing' || remove.isPending}
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) remove.mutate();
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
