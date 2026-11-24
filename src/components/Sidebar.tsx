import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Folder,
  LayoutGrid,
  LogOut,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { WorkspaceView } from '../types/task';
import { useTheme } from '../context/ThemeContext';

interface SidebarCounts {
  all: number;
  pending: number;
  completed: number;
  overdue: number;
}

interface SidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: Array<{ name: string; count: number }>;
  counts: SidebarCounts;
  user: User;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  selectedCategory,
  onSelectCategory,
  categories,
  counts,
  user,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const navItems: Array<{
    id: WorkspaceView;
    label: string;
    count: number;
    icon: typeof LayoutGrid;
    danger?: boolean;
  }> = [
    { id: 'all', label: 'All Tasks', count: counts.all, icon: LayoutGrid },
    { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: counts.overdue,
      icon: AlertTriangle,
      danger: counts.overdue > 0,
    },
  ];

  const handleViewClick = (view: WorkspaceView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category === selectedCategory ? 'All' : category);
    onCloseMobile();
  };

  const userInitial = (
    user.displayName?.trim()?.[0] ||
    user.email?.trim()?.[0] ||
    'U'
  ).toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-900/95">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/70 px-5 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <CheckSquare className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-white">
            TaskFlow
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav aria-label="Task views" className="space-y-1">
          <p className="px-3 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Views
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleViewClick(item.id)}
                className={`flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      item.danger && !isActive
                        ? 'text-red-600 dark:text-red-400'
                        : isActive
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    item.danger
                      ? 'font-semibold text-red-600 dark:text-red-400'
                      : isActive
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Categories filter list */}
        <div className="mt-7">
          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Categories
            </p>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:underline dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`flex min-h-[38px] w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Folder
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSelected
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isSelected
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Theme toggle + User account */}
      <div className="border-t border-slate-200/70 p-3 dark:border-slate-800/80">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-2 flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500" aria-hidden="true" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {theme === 'dark' ? 'On' : 'Off'}
          </span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex min-w-0 items-center gap-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Account avatar'}
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {user.displayName || 'Workspace User'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile slide-over drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-72 max-w-[85vw]"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
