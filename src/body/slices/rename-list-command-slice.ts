import type { EventStore } from '@ricofritzsche/eventstore';

import { byUserFilter } from './eventstore-filters';
import { projectActiveLists } from './lists-projection';
import { TASK_EVENT_TYPES } from './task-types';

export async function renameListCommandSlice(
  eventStore: EventStore,
  params: { userId: string; listId: string; name: string; randomId?: () => string },
): Promise<{ listRenamedId: string }> {
  const randomId = params.randomId ?? (() => crypto.randomUUID());
  const name = params.name.trim();
  if (!name) {
    throw new Error('List name is required.');
  }

  const filter = byUserFilter(params.userId);
  const context = await eventStore.query(filter);
  const lists = projectActiveLists(context.events, params.userId);
  const target = lists.find((list) => list.listId === params.listId);

  if (!target) {
    throw new Error('List not found.');
  }
  if (target.isDefault) {
    throw new Error('Default list cannot be renamed.');
  }
  if (lists.some((list) => list.listId !== params.listId && list.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('List name must be unique.');
  }

  const listRenamedId = randomId();

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.listRenamed,
        payload: {
          listRenamedId,
          userId: params.userId,
          listId: params.listId,
          name,
        },
      },
    ],
    filter,
    context.maxSequenceNumber,
  );

  return { listRenamedId };
}
