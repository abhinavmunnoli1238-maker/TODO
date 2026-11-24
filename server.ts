import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  createManyTasks,
  createTask,
  deleteTask,
  getTaskById,
  getTasksByUserId,
  updateTask,
} from './src/db/tasks.ts';
import type {
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from './src/db/tasks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_PRIORITIES: ReadonlySet<string> = new Set(['High', 'Medium', 'Low']);
const VALID_STATUSES: ReadonlySet<string> = new Set(['Pending', 'Completed']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function parseTaskId(rawId: string | string[] | undefined): number | null {
  if (typeof rawId !== 'string' || !/^\d+$/.test(rawId)) return null;
  const parsed = Number(rawId);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function validateCreateBody(
  body: unknown
): { ok: true; data: CreateTaskInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a valid JSON object.' };
  }
  const record = body as Record<string, unknown>;

  const title = typeof record.title === 'string' ? record.title.trim() : '';
  if (!title) {
    return { ok: false, error: 'Task title is required and cannot be empty.' };
  }
  if (title.length > 255) {
    return { ok: false, error: 'Task title must be 255 characters or fewer.' };
  }

  const description =
    typeof record.description === 'string' ? record.description.trim() : '';
  if (description.length > 2000) {
    return { ok: false, error: 'Task description must be 2000 characters or fewer.' };
  }

  const priority =
    typeof record.priority === 'string' ? record.priority.trim() : 'Medium';
  if (!VALID_PRIORITIES.has(priority)) {
    return { ok: false, error: 'Priority must be High, Medium, or Low.' };
  }

  const category =
    typeof record.category === 'string' && record.category.trim()
      ? record.category.trim()
      : 'General';
  if (category.length > 100) {
    return { ok: false, error: 'Category must be 100 characters or fewer.' };
  }

  const dueDateRaw =
    typeof record.dueDate === 'string'
      ? record.dueDate.trim()
      : typeof record.due_date === 'string'
        ? record.due_date.trim()
        : '';

  if (!dueDateRaw || !isValidIsoDate(dueDateRaw)) {
    return { ok: false, error: 'A valid due date (YYYY-MM-DD) is required.' };
  }

  const status =
    typeof record.status === 'string' ? record.status.trim() : 'Pending';
  if (!VALID_STATUSES.has(status)) {
    return { ok: false, error: 'Status must be Pending or Completed.' };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      priority: priority as TaskPriority,
      category,
      dueDate: dueDateRaw,
      status: status as TaskStatus,
    },
  };
}

function validateUpdateBody(
  body: unknown
): { ok: true; data: UpdateTaskInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a valid JSON object.' };
  }
  const record = body as Record<string, unknown>;
  const data: UpdateTaskInput = {};

  if ('title' in record) {
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) {
      return { ok: false, error: 'Task title cannot be empty.' };
    }
    if (title.length > 255) {
      return { ok: false, error: 'Task title must be 255 characters or fewer.' };
    }
    data.title = title;
  }

  if ('description' in record) {
    if (typeof record.description !== 'string') {
      return { ok: false, error: 'Task description must be text.' };
    }
    const description = record.description.trim();
    if (description.length > 2000) {
      return { ok: false, error: 'Task description must be 2000 characters or fewer.' };
    }
    data.description = description;
  }

  if ('priority' in record) {
    const priority = typeof record.priority === 'string' ? record.priority.trim() : '';
    if (!VALID_PRIORITIES.has(priority)) {
      return { ok: false, error: 'Priority must be High, Medium, or Low.' };
    }
    data.priority = priority as TaskPriority;
  }

  if ('category' in record) {
    const category = typeof record.category === 'string' ? record.category.trim() : '';
    if (!category) {
      return { ok: false, error: 'Category cannot be empty.' };
    }
    if (category.length > 100) {
      return { ok: false, error: 'Category must be 100 characters or fewer.' };
    }
    data.category = category;
  }

  if ('dueDate' in record || 'due_date' in record) {
    const dueDateRaw =
      typeof record.dueDate === 'string'
        ? record.dueDate.trim()
        : typeof record.due_date === 'string'
          ? record.due_date.trim()
          : '';
    if (!dueDateRaw || !isValidIsoDate(dueDateRaw)) {
      return { ok: false, error: 'A valid due date (YYYY-MM-DD) is required.' };
    }
    data.dueDate = dueDateRaw;
  }

  if ('status' in record) {
    const status = typeof record.status === 'string' ? record.status.trim() : '';
    if (!VALID_STATUSES.has(status)) {
      return { ok: false, error: 'Status must be Pending or Completed.' };
    }
    data.status = status as TaskStatus;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: 'At least one field must be provided to update.' };
  }

  return { ok: true, data };
}

function getRelativeIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // READ all tasks for authenticated user
  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const items = await getTasksByUserId(userId);
      res.json({ tasks: items });
    } catch (error) {
      console.error('GET /api/tasks failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to load tasks.';
      res.status(500).json({ error: message });
    }
  });

  // READ single task by ID
  app.get('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    const taskId = parseTaskId(req.params.id);
    if (taskId === null) {
      res.status(400).json({ error: 'Invalid task ID.' });
      return;
    }

    try {
      const task = await getTaskById(req.dbUser!.id, taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }
      res.json({ task });
    } catch (error) {
      console.error('GET /api/tasks/:id failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to load task.';
      res.status(500).json({ error: message });
    }
  });

  // CREATE task
  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    const validation = validateCreateBody(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const created = await createTask(req.dbUser!.id, validation.data);
      res.status(201).json({ task: created });
    } catch (error) {
      console.error('POST /api/tasks failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to create task.';
      res.status(500).json({ error: message });
    }
  });

  // Optional starter tasks helper (user-triggered from empty state)
  app.post('/api/tasks/seed', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const existing = await getTasksByUserId(userId);
      if (existing.length > 0) {
        res.status(409).json({ error: 'Workspace already contains tasks.' });
        return;
      }

      const starterTasks: CreateTaskInput[] = [
        {
          title: 'Finalize Q4 product roadmap presentation',
          description:
            'Consolidate engineering milestones, design review notes, and key delivery dates for stakeholder review.',
          priority: 'High',
          category: 'Work',
          dueDate: getRelativeIsoDate(-1),
          status: 'Pending',
        },
        {
          title: 'Review monthly cloud infrastructure budget',
          description:
            'Audit database storage utilization and verify cost alerts are configured for staging environments.',
          priority: 'Medium',
          category: 'Finance',
          dueDate: getRelativeIsoDate(0),
          status: 'Pending',
        },
        {
          title: 'Refactor navigation accessibility focus states',
          description:
            'Ensure keyboard tab order, ARIA labels, and contrast ratios meet WCAG AA across desktop and mobile.',
          priority: 'High',
          category: 'Engineering',
          dueDate: getRelativeIsoDate(2),
          status: 'Pending',
        },
        {
          title: 'Schedule annual dental checkup',
          description:
            'Book a morning appointment next month and confirm insurance details.',
          priority: 'Low',
          category: 'Health',
          dueDate: getRelativeIsoDate(5),
          status: 'Pending',
        },
        {
          title: 'Set up automated weekly backup verification',
          description:
            'Confirmed recovery snapshots and documented rollback steps in the team wiki.',
          priority: 'Medium',
          category: 'Engineering',
          dueDate: getRelativeIsoDate(-2),
          status: 'Completed',
        },
      ];

      const inserted = await createManyTasks(userId, starterTasks);
      res.status(201).json({ tasks: inserted });
    } catch (error) {
      console.error('POST /api/tasks/seed failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to add starter tasks.';
      res.status(500).json({ error: message });
    }
  });

  // UPDATE task details
  app.put('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    const taskId = parseTaskId(req.params.id);
    if (taskId === null) {
      res.status(400).json({ error: 'Invalid task ID.' });
      return;
    }

    const validation = validateUpdateBody(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const updated = await updateTask(req.dbUser!.id, taskId, validation.data);
      if (!updated) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }
      res.json({ task: updated });
    } catch (error) {
      console.error('PUT /api/tasks/:id failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update task.';
      res.status(500).json({ error: message });
    }
  });

  // PATCH task status (quick toggle Pending <-> Completed)
  app.patch('/api/tasks/:id/status', requireAuth, async (req: AuthRequest, res) => {
    const taskId = parseTaskId(req.params.id);
    if (taskId === null) {
      res.status(400).json({ error: 'Invalid task ID.' });
      return;
    }

    const status =
      req.body && typeof req.body.status === 'string'
        ? req.body.status.trim()
        : '';
    if (!VALID_STATUSES.has(status)) {
      res.status(400).json({ error: 'Status must be Pending or Completed.' });
      return;
    }

    try {
      const updated = await updateTask(req.dbUser!.id, taskId, {
        status: status as TaskStatus,
      });
      if (!updated) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }
      res.json({ task: updated });
    } catch (error) {
      console.error('PATCH /api/tasks/:id/status failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update task status.';
      res.status(500).json({ error: message });
    }
  });

  // DELETE task
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    const taskId = parseTaskId(req.params.id);
    if (taskId === null) {
      res.status(400).json({ error: 'Invalid task ID.' });
      return;
    }

    try {
      const removed = await deleteTask(req.dbUser!.id, taskId);
      if (!removed) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }
      res.json({ deleted: true, id: removed.id });
    } catch (error) {
      console.error('DELETE /api/tasks/:id failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to delete task.';
      res.status(500).json({ error: message });
    }
  });

  // Return JSON 404 for unknown API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
