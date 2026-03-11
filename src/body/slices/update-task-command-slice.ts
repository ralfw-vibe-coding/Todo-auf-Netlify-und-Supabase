import type { EventStore } from '@ricofritzsche/eventstore';

import { byTaskFilter } from './eventstore-filters';
import type { UpdateTaskInput } from './task-types';
import { TASK_EVENT_TYPES } from './task-types';

export interface UpdateTaskDeps {
  eventStore: EventStore;
  randomId?: () => string;
}

export async function updateTaskCommandSlice(
  deps: UpdateTaskDeps,
  params: {
    userId: string;
    taskId: string;
    input: UpdateTaskInput;
  },
): Promise<{ taskUpdatedId: string }> {
  const { eventStore } = deps;
  const randomId = deps.randomId ?? (() => crypto.randomUUID());

  const filter = byTaskFilter(params.userId, params.taskId);
  const context = await eventStore.query(filter);

  if (!context.events.some((event) => event.eventType === TASK_EVENT_TYPES.taskCreated)) {
    throw new Error('Task not found.');
  }

  const payload = buildPayload(params.userId, params.taskId, params.input, randomId());

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.taskUpdated,
        payload,
      },
    ],
    filter,
    context.maxSequenceNumber,
  );

  return { taskUpdatedId: String(payload.taskUpdatedId) };
}

function buildPayload(userId: string, taskId: string, input: UpdateTaskInput, taskUpdatedId: string) {
  const payload: Record<string, unknown> = {
    taskUpdatedId,
    userId,
    taskId,
  };

  const title = input.title?.trim();
  if (title !== undefined) {
    if (!title) {
      throw new Error('Title must not be empty.');
    }
    payload.title = title;
  }

  if (input.description !== undefined) {
    payload.description = input.description.trim() || null;
  }

  if (input.dueDate !== undefined) {
    payload.dueDate = input.dueDate.trim() || null;
  }

  if (input.listId !== undefined) {
    payload.listId = input.listId === null ? null : input.listId.trim();
  }

  if (input.tags !== undefined) {
    payload.tags = normalizeTags(input.tags);
  }

  if (Object.keys(payload).length <= 3) {
    throw new Error('No fields provided to update.');
  }

  return payload;
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
