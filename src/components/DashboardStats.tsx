import { motion } from 'motion/react';
import type { Task } from '../types/task';
import { isTaskOverdue } from '../types/task';

interface DashboardStatsProps {
  tasks: Task[];
  onQuickFilter: (view: 'all' | 'pending' | 'completed' | 'overdue') => void;
}

export function DashboardStats({ tasks, onQuickFilter }: DashboardStatsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const highPending = tasks.filter(
    (t) => t.status === 'Pending' && t.priority === 'High'
  ).length;
  const mediumPending = tasks.filter(
    (t) => t.status === 'Pending' && t.priority === 'Medium'
  ).length;
  const lowPending = tasks.filter(
    (t) => t.status === 'Pending' && t.priority === 'Low'
  ).length;

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Tasks',
      value: total,
      detail: `${pending} active · ${completed} done`,
      accentClass: 'text-slate-900 dark:text-white',
    },
    {
      id: 'pending' as const,
      label: 'Pending Tasks',
      value: pending,
      detail: pending === 0 ? 'All caught up' : 'Scheduled in queue',
      accentClass: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'completed' as const,
      label: 'Completed Tasks',
      value: completed,
      detail: `${completionPct}% completion rate`,
      accentClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'overdue' as const,
      label: 'Overdue Tasks',
      value: overdue,
      detail: overdue > 0 ? 'Past due date' : 'Everything on schedule',
      accentClass:
        overdue > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-900 dark:text-white',
    },
  ];

  return (
    <section aria-label="Task summary metrics" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onQuickFilter(card.id)}
            className="group rounded-xl border border-slate-200/80 bg-white/90 p-4 text-left transition-all duration-150 hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700 dark:hover:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${card.accentClass}`}
            >
              {card.value}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {card.detail}
            </p>
          </button>
        ))}
      </div>

      {/* Completion progress strip */}
      <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Task Completion Progress
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">{completed}</span> of{' '}
              <span className="font-mono tabular-nums">{total}</span> tasks finished
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-red-600 dark:text-red-400">
              High: <span className="font-mono tabular-nums">{highPending}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Medium: <span className="font-mono tabular-nums">{mediumPending}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Low: <span className="font-mono tabular-nums">{lowPending}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
              {completionPct}%
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion percentage"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <motion.div
            initial={false}
            animate={{ scaleX: completionPct / 100 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left center' }}
            className="h-full w-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400"
          />
        </div>
      </div>
    </section>
  );
}
