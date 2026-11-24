import { motion } from 'motion/react';
import {
  AlertCircle,
  Calendar,
  Check,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';
import { formatDueDate, isTaskDueToday, isTaskOverdue } from '../types/task';

interface TaskCardProps {
  task: Task;
  isToggling: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { text: string; label: string }> = {
  High: {
    text: 'text-red-600 dark:text-red-400',
    label: 'High Priority',
  },
  Medium: {
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Medium Priority',
  },
  Low: {
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Low Priority',
  },
};

export function TaskCard({
  task,
  isToggling,
  onToggleStatus,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const priorityStyle = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Medium;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-xl border p-4 transition-colors duration-150 sm:p-5 ${
        overdue
          ? 'border-red-200/90 bg-white hover:border-red-300 dark:border-red-900/50 dark:bg-slate-900/90 dark:hover:border-red-800/70'
          : isCompleted
            ? 'border-slate-200/70 bg-slate-50/70 hover:border-slate-300/80 dark:border-slate-800/70 dark:bg-slate-900/50 dark:hover:border-slate-700'
            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Toggle */}
        <button
          type="button"
          disabled={isToggling}
          onClick={() => onToggleStatus(task)}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:hover:bg-slate-800"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-150 ${
              isCompleted
                ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                : 'border-slate-300 bg-white group-hover:border-indigo-500 dark:border-slate-600 dark:bg-slate-950 dark:group-hover:border-indigo-400'
            }`}
          >
            {isCompleted && <Check className="h-3.5 w-3.5 stroke-[2.75]" />}
          </span>
        </button>

        {/* Main Content */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <h3
              className={`text-base font-semibold leading-snug break-words ${
                isCompleted
                  ? 'text-slate-400 line-through dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit task "${task.title}"`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete task "${task.title}"`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`mt-1.5 text-sm leading-relaxed break-words ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Unboxed Metadata Row with Typographic Separators */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`inline-flex items-center gap-1 font-medium whitespace-nowrap ${priorityStyle.text}`}
            >
              <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {priorityStyle.label}
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span className="font-medium text-slate-700 dark:text-slate-300">
              {task.category}
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1 font-mono tabular-nums whitespace-nowrap ${
                overdue
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : dueToday
                    ? 'font-semibold text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {formatDueDate(task.dueDate)}
                {overdue ? ' (Overdue)' : dueToday ? ' (Due Today)' : ''}
              </span>
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span
              className={`font-medium whitespace-nowrap ${
                isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
