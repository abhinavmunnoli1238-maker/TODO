export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed';
export type WorkspaceView = 'all' | 'pending' | 'completed' | 'overdue';
export type TaskSortOption =
  | 'dueDateAsc'
  | 'dueDateDesc'
  | 'priorityDesc'
  | 'createdDesc';

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  createdAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  status: TaskStatus;
}

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Engineering',
  'Design',
  'Finance',
  'Health',
  'General',
] as const;

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateString(raw: string): string {
  if (!raw) return '';
  return raw.slice(0, 10);
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'Completed') return false;
  const due = normalizeDateString(task.dueDate);
  if (!due) return false;
  return due < getTodayIsoDate();
}

export function isTaskDueToday(task: Task): boolean {
  if (task.status === 'Completed') return false;
  const due = normalizeDateString(task.dueDate);
  return due === getTodayIsoDate();
}

export function formatDueDate(isoDate: string): string {
  const clean = normalizeDateString(isoDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return isoDate;
  const [year, month, day] = clean.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}
