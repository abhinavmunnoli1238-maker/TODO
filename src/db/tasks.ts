import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { tasks } from './schema.ts';
import type { TaskRecord } from './schema.ts';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed';

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  status: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  status?: TaskStatus;
}

export async function getTasksByUserId(userId: number): Promise<TaskRecord[]> {
  try {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));
  } catch (error) {
    console.error('Database query failed in getTasksByUserId:', error);
    throw new Error('Failed to load tasks. Please try again later.', {
      cause: error,
    });
  }
}

export async function getTaskById(
  userId: number,
  taskId: number
): Promise<TaskRecord | null> {
  try {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getTaskById:', error);
    throw new Error('Failed to fetch task details. Please try again later.', {
      cause: error,
    });
  }
}

export async function createTask(
  userId: number,
  input: CreateTaskInput
): Promise<TaskRecord> {
  try {
    const rows = await db
      .insert(tasks)
      .values({
        userId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        category: input.category,
        dueDate: input.dueDate,
        status: input.status,
      })
      .returning();

    if (!rows[0]) {
      throw new Error('Task insertion returned no row');
    }

    return rows[0];
  } catch (error) {
    console.error('Database query failed in createTask:', error);
    throw new Error('Failed to create task. Please try again later.', {
      cause: error,
    });
  }
}

export async function updateTask(
  userId: number,
  taskId: number,
  input: UpdateTaskInput
): Promise<TaskRecord | null> {
  try {
    const updatePayload: Partial<typeof tasks.$inferInsert> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.dueDate !== undefined) updatePayload.dueDate = input.dueDate;
    if (input.status !== undefined) updatePayload.status = input.status;

    const rows = await db
      .update(tasks)
      .set(updatePayload)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateTask:', error);
    throw new Error('Failed to update task. Please try again later.', {
      cause: error,
    });
  }
}

export async function deleteTask(
  userId: number,
  taskId: number
): Promise<TaskRecord | null> {
  try {
    const rows = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in deleteTask:', error);
    throw new Error('Failed to delete task. Please try again later.', {
      cause: error,
    });
  }
}

export async function createManyTasks(
  userId: number,
  items: CreateTaskInput[]
): Promise<TaskRecord[]> {
  try {
    if (items.length === 0) return [];
    return await db
      .insert(tasks)
      .values(
        items.map((item) => ({
          userId,
          title: item.title,
          description: item.description,
          priority: item.priority,
          category: item.category,
          dueDate: item.dueDate,
          status: item.status,
        }))
      )
      .returning();
  } catch (error) {
    console.error('Database query failed in createManyTasks:', error);
    throw new Error('Failed to add starter tasks. Please try again later.', {
      cause: error,
    });
  }
}
