import type { Event, EventStore } from '@ricofritzsche/eventstore';

import { byUserFilter } from './eventstore-filters';
import { projectActiveLists } from './lists-projection';
import { projectTasks } from './query-tasks-slice';
import { TASK_EVENT_TYPES } from './task-types';

export async function deleteListCommandSlice(
  eventStore: EventStore,
  params: { userId: string; listId: string; randomId?: () => string },
): Promise<{ listDeletedId: string }> {
  const randomId = params.randomId ?? (() => crypto.randomUUID());

  const filter = byUserFilter(params.userId);
  const context = await eventStore.query(filter);
  const lists = projectActiveLists(context.events, params.userId);
  const target = lists.find((list) => list.listId === params.listId);

  if (!target) {
    throw new Error('List not found.');
  }
  if (target.isDefault) {
    throw new Error('Default list cannot be deleted.');
  }
  const defaultList = lists.find((list) => list.isDefault);
  if (!defaultList) {
    throw new Error('Default list not found.');
  }

  const listDeletedId = randomId();
  const events: Event[] = [
    {
      eventType: TASK_EVENT_TYPES.listDeleted,
      payload: {
        listDeletedId,
        userId: params.userId,
        listId: params.listId,
      },
    },
  ];

  const tasksInList = projectTasks(context.events, params.userId).filter((task) => task.listId === params.listId);
  for (const task of tasksInList) {
    events.push({
      eventType: TASK_EVENT_TYPES.taskUpdated,
      payload: {
        taskUpdatedId: randomId(),
        userId: params.userId,
        taskId: task.taskId,
        listId: defaultList.listId,
      },
    });
  }

  await eventStore.append(events, filter, context.maxSequenceNumber);

  return { listDeletedId };
}
