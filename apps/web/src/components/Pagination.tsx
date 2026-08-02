'use client';
import type { Pagination as PaginationType } from '../lib/api';

export function Pagination({ pagination, onPageChange }: { pagination: PaginationType; onPageChange: (page: number) => void }) {
  if (pagination.pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Task pages">
      <button type="button" className="secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
        Previous
      </button>
      <span className="muted small">
        Page {pagination.page} of {pagination.pages} · {pagination.total} tasks
      </span>
      <button
        type="button"
        className="secondary"
        disabled={pagination.page >= pagination.pages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
