'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchSummary, fetchTasks, logout, type TaskFilters as Filters } from '../lib/api';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { clearSession } from '../lib/store';
import { AuthPage } from './AuthPage';
import { DashboardStats } from './DashboardStats';
import { Navbar } from './Navbar';
import { Pagination } from './Pagination';
import { QueueHealth } from './QueueHealth';
import { TaskFilters } from './TaskFilters';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { useTaskSocket } from './useTaskSocket';

const defaultFilters: Filters = { page: 1, limit: 10, search: '', status: '', priority: '', sort: 'newest' };

export function Dashboard() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const summary = useQuery({ queryKey: ['summary'], queryFn: fetchSummary, enabled: !!auth.accessToken });
  const tasks = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    enabled: !!auth.accessToken,
    placeholderData: (previous) => previous
  });

  useTaskSocket(auth.accessToken);

  const updateFilters = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));

  if (auth.status === 'checking') {
    return <main className="shell">Loading TaskFlow…</main>;
  }

  if (!auth.accessToken) {
    return <AuthPage />;
  }

  return (
    <main className="shell">
      <Navbar
        user={auth.user}
        onSignOut={async () => {
          await logout();
          dispatch(clearSession());
        }}
      />
      <DashboardStats summary={summary.data} isLoading={summary.isLoading} />
      <section className="workspace">
        <div className="task-panel">
          <div className="section-title">
            <div>
              <h2>Task queue</h2>
              <p className="muted">Tasks are processed asynchronously by BullMQ and update this list live.</p>
            </div>
          </div>
          <TaskForm />
          <TaskFilters filters={filters} onChange={updateFilters} />
          <TaskList tasks={tasks.data?.items ?? []} isLoading={tasks.isLoading} />
          {tasks.data?.pagination && <Pagination pagination={tasks.data.pagination} onPageChange={(page) => updateFilters({ page })} />}
        </div>
        <QueueHealth summary={summary.data} />
      </section>
    </main>
  );
}
