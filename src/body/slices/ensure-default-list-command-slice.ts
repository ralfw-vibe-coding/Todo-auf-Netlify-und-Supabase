import type { EventStore } from '@ricofritzsche/eventstore';

import { byDefaultListFilter } from './eventstore-filters';
import { TASK_EVENT_TYPES } from './task-types';

export interface EnsureDefaultListDeps {
  eventStore: EventStore;
  randomId?: () => string;
}

export async function ensureDefaultListCommandSlice(
  deps: EnsureDefaultListDeps,
  userId: string,
): Promise<{ listId: string }> {
  const { eventStore } = deps;
  const randomId = deps.randomId ?? (() => crypto.randomUUID());

  const filter = byDefaultListFilter(userId);
  const context = await eventStore.query(filter);

  const existing = context.events[0];
  if (existing) {
    return { listId: String(existing.payload.listId) };
  }

  const defaultListCreatedId = randomId();
  const listId = randomId();

  try {
    await eventStore.append(
      [
        {
          eventType: TASK_EVENT_TYPES.defaultListCreated,
          payload: {
            defaultListCreatedId,
            userId,
            listId,
            name: 'default',
          },
        },
      ],
      filter,
      context.maxSequenceNumber,
    );

    return { listId };
  } catch (error) {
    // Another request might have created the default list in the meantime.
    const current = await eventStore.query(filter);
    const created = current.events[0];
    if (!created) {
      throw error;
    }

    return { listId: String(created.payload.listId) };
  }
}
