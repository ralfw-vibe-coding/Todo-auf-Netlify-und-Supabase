import type { EventStore } from '@ricofritzsche/eventstore';

import { byTaskFilter } from './eventstore-filters';
import type { CreateTaskInput, TaskStatus } from './task-types';
import { TASK_EVENT_TYPES } from './task-types';

export interface CreateTaskDeps {
  eventStore: EventStore;
  now?: () => Date;
  randomId?: () => string;
}

export async function createTaskCommandSlice(
  deps: CreateTaskDeps,
  params: {
    userId: string;
    listId: string;
    input: CreateTaskInput;
  },
): Promise<{ taskId: string; taskCreatedId: string }> {
  const { eventStore } = deps;
  const now = deps.now ?? (() => new Date());
  const randomId = deps.randomId ?? (() => crypto.randomUUID());

  const title = params.input.title?.trim();
  if (!title) {
    throw new Error('Title is required.');
  }

  const taskId = randomId();
  const taskCreatedId = randomId();
  const filter = byTaskFilter(params.userId, taskId);

  const createdAt = now().toISOString();
  const status: TaskStatus = 'In Progress';
  const tags = normalizeTags(params.input.tags ?? []);

  const eventPayload: Record<string, unknown> = {
    taskCreatedId,
    taskId,
    userId: params.userId,
    listId: params.listId,
    title,
    description: normalizeOptionalText(params.input.description),
    dueDate: normalizeOptionalText(params.input.dueDate),
    status,
    tags,
    createdAt,
  };

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.taskCreated,
        payload: eventPayload,
      },
    ],
    filter,
    0,
  );

  return { taskId, taskCreatedId };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTags(tags: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of tags) {
    const normalized = raw.trim().toLowerCase();
    if (normalized) {
      unique.add(normalized);
    }
  }

  return [...unique];
}
