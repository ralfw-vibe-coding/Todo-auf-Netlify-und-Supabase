import type { EventStore } from '@ricofritzsche/eventstore';

import { byUserFilter } from './eventstore-filters';
import { projectActiveLists } from './lists-projection';
import { TASK_EVENT_TYPES } from './task-types';

export async function createListCommandSlice(
  eventStore: EventStore,
  params: { userId: string; name: string; randomId?: () => string },
): Promise<{ listId: string; listCreatedId: string }> {
  const randomId = params.randomId ?? (() => crypto.randomUUID());
  const name = params.name.trim();
  if (!name) {
    throw new Error('List name is required.');
  }

  const filter = byUserFilter(params.userId);
  const context = await eventStore.query(filter);
  const lists = projectActiveLists(context.events, params.userId);

  if (lists.some((list) => list.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('List name must be unique.');
  }

  const listId = randomId();
  const listCreatedId = randomId();

  await eventStore.append(
    [
      {
        eventType: TASK_EVENT_TYPES.listCreated,
        payload: {
          listCreatedId,
          userId: params.userId,
          listId,
          name,
        },
      },
    ],
    filter,
    context.maxSequenceNumber,
  );

  return { listId, listCreatedId };
}
