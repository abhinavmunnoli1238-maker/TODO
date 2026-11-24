import type { Task, TaskFormPayload, TaskStatus } from '../types/task';

async function requestJson<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload as T;
}

export async function fetchTasks(token: string): Promise<Task[]> {
  const data = await requestJson<{ tasks: Task[] }>('/api/tasks', token, {
    method: 'GET',
  });
  return data.tasks;
}

export async function createTaskApi(
  token: string,
  payload: TaskFormPayload
): Promise<Task> {
  const data = await requestJson<{ task: Task }>('/api/tasks', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function updateTaskApi(
  token: string,
  taskId: number,
  payload: Partial<TaskFormPayload>
): Promise<Task> {
  const data = await requestJson<{ task: Task }>(
    `/api/tasks/${taskId}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return data.task;
}

export async function updateTaskStatusApi(
  token: string,
  taskId: number,
  status: TaskStatus
): Promise<Task> {
  const data = await requestJson<{ task: Task }>(
    `/api/tasks/${taskId}/status`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return data.task;
}

export async function deleteTaskApi(
  token: string,
  taskId: number
): Promise<void> {
  await requestJson<{ deleted: boolean; id: number }>(
    `/api/tasks/${taskId}`,
    token,
    {
      method: 'DELETE',
    }
  );
}

export async function seedStarterTasksApi(token: string): Promise<Task[]> {
  const data = await requestJson<{ tasks: Task[] }>('/api/tasks/seed', token, {
    method: 'POST',
  });
  return data.tasks;
}
