import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowUpDown,
  ClipboardList,
  Filter,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createTaskApi,
  deleteTaskApi,
  fetchTasks,
  seedStarterTasksApi,
  updateTaskApi,
  updateTaskStatusApi,
} from '../lib/api';
import {
  DEFAULT_CATEGORIES,
  PRIORITY_RANK,
  isTaskOverdue,
  normalizeDateString,
} from '../types/task';
import type {
  Task,
  TaskFormPayload,
  TaskPriority,
  TaskSortOption,
  WorkspaceView,
} from '../types/task';
import { Sidebar } from './Sidebar';
import { DashboardStats } from './DashboardStats';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ToastContainer } from './ToastContainer';
import type { ToastItem } from './ToastContainer';

const VIEW_TITLES: Record<WorkspaceView, string> = {
  all: 'All Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
  overdue: 'Overdue Tasks',
};

export function TaskWorkspace() {
  const { user, getIdToken, signOut } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation & Filters
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<TaskSortOption>('dueDateAsc');

  // Modals & Action states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [seeding, setSeeding] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    setLoadError(null);
    try {
      const token = await getIdToken();
      const fetched = await fetchTasks(token);
      setTasks(fetched);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load your tasks right now.';
      setLoadError(message);
    } finally {
      setLoadingTasks(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      void loadTasks();
    }
  }, [user, loadTasks]);

  // Derived counts
  const counts = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return {
      all: tasks.length,
      pending: tasks.length - completed,
      completed,
      overdue,
    };
  }, [tasks]);

  // Dynamic category list with counts
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const def of DEFAULT_CATEGORIES) {
      map.set(def, 0);
    }
    for (const task of tasks) {
      map.set(task.category, (map.get(task.category) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [tasks]);

  const availableCategoryNames = useMemo(
    () => categoryStats.map((c) => c.name),
    [categoryStats]
  );

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (activeView === 'pending' && task.status !== 'Pending') return false;
      if (activeView === 'completed' && task.status !== 'Completed') return false;
      if (activeView === 'overdue' && !isTaskOverdue(task)) return false;

      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }

      if (query) {
        const inTitle = task.title.toLowerCase().includes(query);
        const inDesc = task.description.toLowerCase().includes(query);
        const inCat = task.category.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inCat) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const dateA = normalizeDateString(a.dueDate);
      const dateB = normalizeDateString(b.dueDate);

      if (sortOption === 'dueDateAsc') {
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      }
      if (sortOption === 'dueDateDesc') {
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      }
      if (sortOption === 'priorityDesc') {
        const diff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (diff !== 0) return diff;
        return dateA.localeCompare(dateB);
      }
      // createdDesc
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [tasks, activeView, selectedCategory, priorityFilter, searchQuery, sortOption]);

  const pendingFiltered = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Pending'),
    [filteredTasks]
  );

  const completedFiltered = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Completed'),
    [filteredTasks]
  );

  const hasActiveFilters =
    activeView !== 'all' ||
    selectedCategory !== 'All' ||
    priorityFilter !== 'All' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setActiveView('all');
    setSelectedCategory('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  // Modal openers
  const openCreateModal = () => {
    setModalMode('create');
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setModalMode('edit');
    setEditingTask(task);
    setModalOpen(true);
  };

  // CRUD Handlers
  const handleSaveTask = async (payload: TaskFormPayload) => {
    setSubmittingTask(true);
    try {
      const token = await getIdToken();
      if (modalMode === 'create') {
        const created = await createTaskApi(token, payload);
        setTasks((prev) => [created, ...prev]);
        setModalOpen(false);
        pushToast('success', `Task "${created.title}" added.`);
      } else if (editingTask) {
        const updated = await updateTaskApi(token, editingTask.id, payload);
        setTasks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setModalOpen(false);
        setEditingTask(null);
        pushToast('success', `Task "${updated.title}" updated.`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save task.';
      pushToast('error', message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setTogglingIds((prev) => new Set(prev).add(task.id));
    try {
      const token = await getIdToken();
      const updated = await updateTaskStatusApi(token, task.id, nextStatus);
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      pushToast(
        'success',
        nextStatus === 'Completed'
          ? `Marked "${updated.title}" as completed.`
          : `Moved "${updated.title}" back to pending.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update task status.';
      pushToast('error', message);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeletingTask(true);
    try {
      const token = await getIdToken();
      await deleteTaskApi(token, taskToDelete.id);
      const removedTitle = taskToDelete.title;
      setTasks((prev) => prev.filter((item) => item.id !== taskToDelete.id));
      setTaskToDelete(null);
      pushToast('success', `Deleted "${removedTitle}".`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete task.';
      pushToast('error', message);
    } finally {
      setDeletingTask(false);
    }
  };

  const handleSeedStarterTasks = async () => {
    setSeeding(true);
    try {
      const token = await getIdToken();
      const inserted = await seedStarterTasksApi(token);
      setTasks(inserted);
      pushToast('success', `Added ${inserted.length} starter tasks to your list.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load starter tasks.';
      pushToast('error', message);
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/35 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categoryStats}
        counts={counts}
        user={user}
        onSignOut={() => void signOut()}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-950/85">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                Workspace
              </span>
              <span
                aria-hidden="true"
                className="hidden text-slate-300 sm:inline dark:text-slate-700"
              >
                /
              </span>
              <h1 className="truncate font-display text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
                {VIEW_TITLES[activeView]}
              </h1>
              {selectedCategory !== 'All' && (
                <>
                  <span
                    aria-hidden="true"
                    className="text-slate-300 dark:text-slate-700"
                  >
                    /
                  </span>
                  <span className="truncate font-medium text-indigo-600 dark:text-indigo-400">
                    {selectedCategory}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 whitespace-nowrap dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-950"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>New Task</span>
          </button>
        </header>

        {/* Scrollable Workspace Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Error Banner */}
          {loadError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{loadError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadTasks()}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Summary Dashboard */}
          {loadingTasks ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-[116px] animate-pulse rounded-xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-4 h-7 w-14 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/70" />
                  </div>
                ))}
              </div>
              <div className="h-[92px] animate-pulse rounded-xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80" />
            </div>
          ) : (
            <DashboardStats tasks={tasks} onQuickFilter={setActiveView} />
          )}

          {/* Search, Filter & Sort Controls */}
          <section
            aria-label="Search and filter tasks"
            className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-900/90"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, description, or category..."
                  aria-label="Search tasks"
                  className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Priority Filter & Sort Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <div className="relative flex flex-1 items-center sm:flex-initial">
                  <Filter
                    className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                  <select
                    aria-label="Filter by priority"
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as 'All' | TaskPriority)
                    }
                    className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pr-8 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div className="relative flex flex-1 items-center sm:flex-initial">
                  <ArrowUpDown
                    className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                  <select
                    aria-label="Sort tasks"
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as TaskSortOption)
                    }
                    className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pr-8 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-auto dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
                  >
                    <option value="dueDateAsc">Due Date (Earliest)</option>
                    <option value="dueDateDesc">Due Date (Latest)</option>
                    <option value="priorityDesc">Priority (High to Low)</option>
                    <option value="createdDesc">Newest Created</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Segmented Status Tabs Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800/80">
              <div
                role="tablist"
                aria-label="Filter by task status"
                className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
              >
                {(
                  [
                    { id: 'all', label: 'All', count: counts.all },
                    { id: 'pending', label: 'Pending', count: counts.pending },
                    {
                      id: 'completed',
                      label: 'Completed',
                      count: counts.completed,
                    },
                    { id: 'overdue', label: 'Overdue', count: counts.overdue },
                  ] as const
                ).map((tab) => {
                  const active = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveView(tab.id)}
                      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`font-mono tabular-nums ${
                          tab.id === 'overdue' && tab.count > 0
                            ? 'text-red-600 dark:text-red-400'
                            : active
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:underline whitespace-nowrap dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Clear active filters
                </button>
              )}
            </div>
          </section>

          {/* Task List Section */}
          <section aria-label="Task list" className="space-y-6 pb-8">
            {loadingTasks ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-[108px] animate-pulse rounded-xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 h-5 w-5 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                        <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              /* Brand-new Empty Workspace State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <ClipboardList className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Your task list is empty
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  Create your first task with a due date, category, and priority —
                  or load a set of starter tasks to explore the workspace right away.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Create First Task</span>
                  </button>
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={() => void handleSeedStarterTasks()}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 whitespace-nowrap dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {seeding ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                    )}
                    <span>Load Sample Tasks</span>
                  </button>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              /* No Matching Filter Results State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/85 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/70">
                <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  No tasks match your current filters
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search query, category, priority, or status view.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reset Filters
                </button>
              </div>
            ) : activeView === 'all' ? (
              /* Separate Pending & Completed Views in All Tasks */
              <div className="space-y-8">
                {/* Pending Section */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Pending Tasks
                    </h2>
                    <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {pendingFiltered.length}{' '}
                      {pendingFiltered.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  {pendingFiltered.length === 0 ? (
                    <div className="rounded-xl border border-slate-200/70 bg-white/70 px-5 py-6 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                      No pending tasks in this view.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {pendingFiltered.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isToggling={togglingIds.has(task.id)}
                            onToggleStatus={(t) => void handleToggleStatus(t)}
                            onEdit={openEditModal}
                            onDelete={setTaskToDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Completed Section */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Completed Tasks
                    </h2>
                    <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {completedFiltered.length}{' '}
                      {completedFiltered.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  {completedFiltered.length === 0 ? (
                    <div className="rounded-xl border border-slate-200/70 bg-white/70 px-5 py-6 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
                      No completed tasks yet. Check off a pending task to see it here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {completedFiltered.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isToggling={togglingIds.has(task.id)}
                            onToggleStatus={(t) => void handleToggleStatus(t)}
                            onEdit={openEditModal}
                            onDelete={setTaskToDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Focused View (Pending / Completed / Overdue) */
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {VIEW_TITLES[activeView]}
                  </h2>
                  <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {filteredTasks.length}{' '}
                    {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isToggling={togglingIds.has(task.id)}
                        onToggleStatus={(t) => void handleToggleStatus(t)}
                        onEdit={openEditModal}
                        onDelete={setTaskToDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={modalOpen}
        mode={modalMode}
        initialTask={editingTask}
        availableCategories={availableCategoryNames}
        submitting={submittingTask}
        onClose={() => !submittingTask && setModalOpen(false)}
        onSubmit={handleSaveTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        task={taskToDelete}
        deleting={deletingTask}
        onCancel={() => !deletingTask && setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
