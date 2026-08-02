'use client';
import type { Summary } from '../lib/api';

export function QueueHealth({ summary }: { summary?: Summary }) {
  return (
    <aside aria-label="Queue health">
      <h2>Queue health</h2>
      <dl>
        <dt>Waiting</dt>
        <dd>{summary?.queue.waiting ?? 0}</dd>
        <dt>Active</dt>
        <dd>{summary?.queue.active ?? 0}</dd>
        <dt>Delayed</dt>
        <dd>{summary?.queue.delayed ?? 0}</dd>
      </dl>
      <p className="muted small">
        Tip: name a task with <code>[fail]</code> to demonstrate retry handling.
      </p>
    </aside>
  );
}
