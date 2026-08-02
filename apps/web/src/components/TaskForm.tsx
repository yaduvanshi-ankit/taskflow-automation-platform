'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { createTask, type TaskPriority } from '../lib/api';

const errorMessage = (error: unknown) =>
  isAxiosError(error) ? error.response?.data?.error?.message || error.message : 'Could not create the task.';

export function TaskForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [scheduledFor, setScheduledFor] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const create = useMutation({
    mutationFn: (formData: FormData) => createTask(formData),
    onSuccess: () => {
      setTitle('');
      setScheduledFor('');
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('priority', priority);
    if (scheduledFor) formData.append('scheduledFor', new Date(scheduledFor).toISOString());
    if (attachment) formData.append('attachment', attachment);
    create.mutate(formData);
  };

  return (
    <form className="create" onSubmit={handleSubmit} aria-label="Create task">
      <input
        aria-label="New task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Describe a task to automate… (try “[fail] demo task”)"
      />
      <select aria-label="Task priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input aria-label="Schedule task" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
      <input
        aria-label="Attachment"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Adding…' : 'Add task'}
      </button>
      {create.error && (
        <p className="error" role="alert">
          {errorMessage(create.error)}
        </p>
      )}
    </form>
  );
}
