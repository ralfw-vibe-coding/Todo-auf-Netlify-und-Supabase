import type { EventStore } from '@ricofritzsche/eventstore';

import { byTaskFilter } from './eventstore-filters';
import type { TaskStatus } from './task-types';
import { TASK_EVENT_TYPES } from './task-types';

export interface SetTaskStatusDeps {
  eventStore: EventStore;
  randomId?: () => string;
}

export async function setTaskStatusCommandSlice(
  deps: SetTaskStatusDeps,
  params: {
    userId: string;
    taskId: string;
    status: TaskStatus;
  },
): Promise<{ taskStatusSetId: string }> {
  const { eventStore } = deps;
  const randomId = deps.randomId ?? (() => crypto.randomUUID());

  const filter = byTaskFilter(params.userId, params.taskId);
  const context = await eventStore.query(filter);

  if (!context.events.some((event) => event.eventType === TASK_EVENT_TYPES.taskCreated)) {
    throw new Error('Task not found.');
  }

  const taskStatusSetId = randomId();

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.taskStatusSet,
        payload: {
          taskStatusSetId,
          taskId: params.taskId,
          userId: params.userId,
          status: params.status,
        },
      },
    ],
    filter,
    context.maxSequenceNumber,
  );

  return { taskStatusSetId };
}
