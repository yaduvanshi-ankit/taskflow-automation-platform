'use client';
import type { TaskFilters as Filters } from '../lib/api';

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
};

export function TaskFilters({ filters, onChange }: Props) {
  return (
    <div className="filters" role="search">
      <input
        className="search"
        aria-label="Search tasks"
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value, page: 1 })}
        placeholder="Search your tasks…"
      />
      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as Filters['status'], page: 1 })}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => onChange({ priority: e.target.value as Filters['priority'], page: 1 })}
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select aria-label="Sort tasks" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value as Filters['sort'], page: 1 })}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="priority">Priority</option>
      </select>
    </div>
  );
}
