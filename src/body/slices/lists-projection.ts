import type { ListView } from './task-types';
import { TASK_EVENT_TYPES } from './task-types';

interface ListState extends ListView {
  deleted: boolean;
}

export function projectLists(events: { eventType: string; payload: Record<string, unknown> }[], userId: string): ListState[] {
  const lists = new Map<string, ListState>();

  for (const event of events) {
    if (event.payload.userId !== userId) continue;

    if (event.eventType === TASK_EVENT_TYPES.defaultListCreated || event.eventType === TASK_EVENT_TYPES.listCreated) {
      const listId = String(event.payload.listId);
      lists.set(listId, {
        listId,
        userId,
        name: String(event.payload.name),
        isDefault: event.eventType === TASK_EVENT_TYPES.defaultListCreated,
        deleted: false,
      });
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.listRenamed) {
      const listId = String(event.payload.listId);
      const current = lists.get(listId);
      if (!current || current.deleted) continue;

      const name = event.payload.name;
      if (typeof name === 'string' && name.trim()) {
        lists.set(listId, { ...current, name: name.trim() });
      }
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.listDeleted) {
      const listId = String(event.payload.listId);
      const current = lists.get(listId);
      if (!current) continue;

      lists.set(listId, { ...current, deleted: true });
    }
  }

  return [...lists.values()];
}

export function projectActiveLists(
  events: { eventType: string; payload: Record<string, unknown> }[],
  userId: string,
): ListView[] {
  return projectLists(events, userId)
    .filter((list) => !list.deleted)
    .map(({ deleted, ...list }) => list)
    .sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
}
