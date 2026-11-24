import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import type {
  Task,
  TaskFormPayload,
  TaskPriority,
  TaskStatus,
} from '../types/task';
import { DEFAULT_CATEGORIES, getTodayIsoDate, normalizeDateString } from '../types/task';

interface TaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialTask: Task | null;
  availableCategories: string[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskFormPayload) => Promise<void>;
}

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export function TaskModal({
  isOpen,
  mode,
  initialTask,
  availableCategories,
  submitting,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [categorySelect, setCategorySelect] = useState('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState(getTodayIsoDate());
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mergedCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...availableCategories])
  );

  useEffect(() => {
    if (!isOpen) return;
    setFieldError(null);
    if (mode === 'edit' && initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setPriority(initialTask.priority);
      if (mergedCategories.includes(initialTask.category)) {
        setCategorySelect(initialTask.category);
        setCustomCategory('');
      } else {
        setCategorySelect('__custom__');
        setCustomCategory(initialTask.category);
      }
      setDueDate(normalizeDateString(initialTask.dueDate) || getTodayIsoDate());
      setStatus(initialTask.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setCategorySelect('Work');
      setCustomCategory('');
      setDueDate(getTodayIsoDate());
      setStatus('Pending');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFieldError('Please enter a task title.');
      return;
    }
    if (trimmedTitle.length > 255) {
      setFieldError('Task title must be 255 characters or fewer.');
      return;
    }

    const resolvedCategory =
      categorySelect === '__custom__'
        ? customCategory.trim()
        : categorySelect.trim();

    if (!resolvedCategory) {
      setFieldError('Please select or enter a category.');
      return;
    }
    if (resolvedCategory.length > 100) {
      setFieldError('Category must be 100 characters or fewer.');
      return;
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setFieldError('Please choose a valid due date.');
      return;
    }

    await onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      category: resolvedCategory,
      dueDate,
      status,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !submitting && onClose()}
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
              <h2
                id="task-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-white"
              >
                {mode === 'create' ? 'Create New Task' : 'Edit Task'}
              </h2>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
              {fieldError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  {fieldError}
                </div>
              )}

              {/* Title */}
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  required
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Prepare quarterly budget review"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="task-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes, links, or deliverables..."
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                />
              </div>

              {/* Priority Segmented Control */}
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Priority <span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                  {PRIORITIES.map((option) => {
                    const active = priority === option;
                    const activeColor =
                      option === 'High'
                        ? 'text-red-600 dark:text-red-400'
                        : option === 'Medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400';

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPriority(option)}
                        className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
                          active
                            ? `bg-white shadow-xs dark:bg-slate-800 ${activeColor}`
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category & Due Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-category"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task-category"
                    value={categorySelect}
                    onChange={(e) => setCategorySelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                  >
                    {mergedCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom category...</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              {categorySelect === '__custom__' && (
                <div>
                  <label
                    htmlFor="task-custom-category"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Custom Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="task-custom-category"
                    type="text"
                    maxLength={100}
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g., Marketing, Study, Travel"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              )}

              {/* Status selector (especially helpful when editing) */}
              {mode === 'edit' && (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Status
                  </span>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                    {(['Pending', 'Completed'] as TaskStatus[]).map((item) => {
                      const active = status === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setStatus(item)}
                          className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 whitespace-nowrap dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-900"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  <span>{mode === 'create' ? 'Add Task' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
