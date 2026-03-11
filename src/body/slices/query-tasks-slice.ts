import type { EventStore } from '@ricofritzsche/eventstore';

import { byUserFilter } from './eventstore-filters';
import type { QueryTasksInput, TaskView } from './task-types';
import { TASK_EVENT_TYPES } from './task-types';

export async function queryTasksSlice(
  eventStore: EventStore,
  params: {
    userId: string;
    input: QueryTasksInput;
  },
): Promise<TaskView[]> {
  const context = await eventStore.query(byUserFilter(params.userId));
  const tasks = projectTasks(context.events, params.userId);

  return tasks
    .filter((task) => (params.input.mode === 'archived' ? task.status === 'Done' : task.status !== 'Done'))
    .filter((task) => matchesStatuses(task, params.input.statuses))
    .filter((task) => matchesList(task, params.input.listId))
    .filter((task) => matchesTag(task, params.input.tag))
    .filter((task) => matchesSearch(task, params.input.searchText))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function projectTasks(
  events: { eventType: string; payload: Record<string, unknown> }[],
  userId: string,
): TaskView[] {
  const tasks = new Map<string, TaskView>();

  for (const event of events) {
    const eventUserId = event.payload.userId;
    if (eventUserId !== userId) {
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.taskCreated) {
      const task = toTaskView(event.payload);
      tasks.set(task.taskId, task);
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.taskUpdated) {
      const taskId = String(event.payload.taskId);
      const existing = tasks.get(taskId);
      if (!existing) {
        continue;
      }

      const title = event.payload.title;
      const description = event.payload.description;
      const dueDate = event.payload.dueDate;
      const tags = event.payload.tags;
      const listId = event.payload.listId;

      tasks.set(taskId, {
        ...existing,
        title: typeof title === 'string' ? title : existing.title,
        description: description === null ? undefined : typeof description === 'string' ? description : existing.description,
        dueDate: dueDate === null ? undefined : typeof dueDate === 'string' ? dueDate : existing.dueDate,
        listId: listId === null ? null : typeof listId === 'string' ? listId : existing.listId,
        tags: Array.isArray(tags) ? tags.map(String) : existing.tags,
      });
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.taskStatusSet) {
      const taskId = String(event.payload.taskId);
      const existing = tasks.get(taskId);
      if (!existing) {
        continue;
      }

      const status = event.payload.status;
      if (status === 'Backlog' || status === 'Ready' || status === 'In Progress' || status === 'Done') {
        tasks.set(taskId, { ...existing, status });
      }
      continue;
    }

    if (event.eventType === TASK_EVENT_TYPES.taskDeleted) {
      const taskId = String(event.payload.taskId);
      tasks.delete(taskId);
    }
  }

  return [...tasks.values()];
}

function matchesSearch(task: TaskView, searchText: string | undefined): boolean {
  if (!searchText) return true;
  const q = searchText.trim().toLowerCase();
  if (!q) return true;

  return task.title.toLowerCase().includes(q) || (task.description ?? '').toLowerCase().includes(q);
}

function matchesTag(task: TaskView, tag: string | undefined): boolean {
  if (!tag) return true;
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return true;

  return task.tags.includes(normalized);
}

function matchesList(task: TaskView, listId: string | undefined): boolean {
  if (!listId) return true;
  return task.listId === listId;
}

function matchesStatuses(task: TaskView, statuses: TaskView['status'][] | undefined): boolean {
  if (!statuses || statuses.length === 0) return true;
  return statuses.includes(task.status);
}

function toTaskView(payload: Record<string, unknown>): TaskView {
  const rawListId = payload.listId;

  return {
    taskId: String(payload.taskId),
    userId: String(payload.userId),
    listId: rawListId === null || rawListId === undefined ? null : String(rawListId),
    title: String(payload.title),
    description: typeof payload.description === 'string' ? payload.description : undefined,
    dueDate: typeof payload.dueDate === 'string' ? payload.dueDate : undefined,
    status: toTaskStatus(payload.status),
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
    createdAt: String(payload.createdAt),
  };
}

function toTaskStatus(value: unknown): TaskView['status'] {
  if (value === 'Backlog' || value === 'Ready' || value === 'In Progress' || value === 'Done') {
    return value;
  }

  return 'In Progress';
}
