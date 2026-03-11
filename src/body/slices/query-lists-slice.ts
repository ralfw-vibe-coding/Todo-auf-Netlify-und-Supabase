import type { EventStore } from '@ricofritzsche/eventstore';

import { byUserFilter } from './eventstore-filters';
import { projectActiveLists } from './lists-projection';
import type { ListView } from './task-types';

export async function queryListsSlice(eventStore: EventStore, userId: string): Promise<ListView[]> {
  const context = await eventStore.query(byUserFilter(userId));
  return projectActiveLists(context.events, userId);
}
