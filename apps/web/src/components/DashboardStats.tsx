'use client';
import type { Summary } from '../lib/api';

export function DashboardStats({ summary, isLoading }: { summary?: Summary; isLoading: boolean }) {
  const cards: Array<[string, number | undefined]> = [
    ['Total tasks', summary?.totalTasks],
    ['Completed', summary?.completedTasks],
    ['In progress', summary?.processingTasks],
    ['Needs attention', summary?.failedTasks]
  ];
  return (
    <section className="metrics" aria-label="Task summary">
      {cards.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{isLoading ? '—' : value ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}
