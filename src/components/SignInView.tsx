import { motion } from 'motion/react';
import {
  AlertCircle,
  CalendarClock,
  CheckSquare,
  ListChecks,
  Loader2,
  Moon,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function SignInView() {
  const { signInWithGoogle, signingIn, authError } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/35 dark:text-slate-100">
      {/* Minimal Header */}
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <CheckSquare className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
            TaskFlow
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid w-full items-center gap-12 lg:grid-cols-12"
        >
          {/* Left Copy */}
          <div className="space-y-6 lg:col-span-7">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12] dark:text-white">
              Plan daily work and finish what matters most.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Create, prioritize, filter, and track tasks across every project in one
              focused workspace. Stay ahead of due dates with clear completion progress
              and overdue alerts.
            </p>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <div className="space-y-1.5">
                <ListChecks
                  className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Full Task Control
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Add, edit, complete, and organize tasks by category and priority.
                </p>
              </div>
              <div className="space-y-1.5">
                <CalendarClock
                  className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Deadline Clarity
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Sort by due date and surface overdue items automatically.
                </p>
              </div>
              <div className="space-y-1.5">
                <SlidersHorizontal
                  className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Instant Filtering
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Search titles, filter by status or priority, and review progress.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sign-In Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-7 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/95">
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Use your Google account to save tasks permanently and keep your
                progress synced across sessions.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={signingIn}
                onClick={signInWithGoogle}
                className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-900"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.24-.92 2.29-1.96 2.99v2.48h3.17c1.86-1.71 2.93-4.23 2.93-7.21 0-.42-.04-.84-.23-1.24z"
                      />
                      <path
                        fill="currentColor"
                        d="M12.17 21c2.65 0 4.88-.88 6.51-2.38l-3.17-2.48c-.88.59-2 .94-3.34.94-2.57 0-4.75-1.74-5.53-4.08H3.36v2.56C4.98 18.78 8.32 21 12.17 21z"
                      />
                      <path
                        fill="currentColor"
                        d="M6.64 13a5.5 5.5 0 0 1 0-3.51V6.93H3.36a9.01 9.01 0 0 0 0 8.63L6.64 13z"
                      />
                      <path
                        fill="currentColor"
                        d="M12.17 5.42c1.44 0 2.74.5 3.76 1.47l2.82-2.82C17.04 2.47 14.82 1.5 12.17 1.5 8.32 1.5 4.98 3.72 3.36 6.93l3.28 2.56c.78-2.34 2.96-4.07 5.53-4.07z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
