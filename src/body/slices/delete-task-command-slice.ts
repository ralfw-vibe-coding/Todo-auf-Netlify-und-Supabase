import type { EventStore } from '@ricofritzsche/eventstore';

import { byTaskFilter } from './eventstore-filters';
import { TASK_EVENT_TYPES } from './task-types';

export interface DeleteTaskDeps {
  eventStore: EventStore;
  randomId?: () => string;
}

export async function deleteTaskCommandSlice(
  deps: DeleteTaskDeps,
  params: {
    userId: string;
    taskId: string;
  },
): Promise<{ taskDeletedId: string }> {
  const { eventStore } = deps;
  const randomId = deps.randomId ?? (() => crypto.randomUUID());

  const filter = byTaskFilter(params.userId, params.taskId);
  const context = await eventStore.query(filter);

  if (!context.events.some((event) => event.eventType === TASK_EVENT_TYPES.taskCreated)) {
    throw new Error('Task not found.');
  }

  if (context.events.some((event) => event.eventType === TASK_EVENT_TYPES.taskDeleted)) {
    return { taskDeletedId: '' };
  }

  const taskDeletedId = randomId();

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.taskDeleted,
        payload: {
          taskDeletedId,
          userId: params.userId,
          taskId: params.taskId,
        },
      },
    ],
    filter,
    context.maxSequenceNumber,
  );

  return { taskDeletedId };
}
