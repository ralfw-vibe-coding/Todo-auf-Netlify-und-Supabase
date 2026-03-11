import { MemoryEventStore } from '@ricofritzsche/eventstore';
import { describe, expect, test } from 'vitest';

import {
  processCreateList,
  processCreateTask,
  processDeleteList,
  processDeleteTask,
  processQueryLists,
  processQueryTasks,
  processRenameList,
  processSetTaskStatus,
  processUpdateTask,
} from '../processor';

describe('Processor slices', () => {
  test('createTask creates default list once and writes normalized task', async () => {
    const store = new MemoryEventStore();
    const userId = 'user-1';

    const created = await processCreateTask(store, userId, {
      title: '  Erste Aufgabe  ',
      tags: ['Urgent', 'urgent', '  Work  '],
    });

    expect(created.taskId).toBeTruthy();

    const active = await processQueryTasks(store, userId, { mode: 'active' });
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('Erste Aufgabe');
    expect(active[0].tags).toEqual(['urgent', 'work']);
    expect(active[0].listId).toBeTruthy();

    await processCreateTask(store, userId, { title: 'Zweite Aufgabe' });

    const defaults = await store.query({
      filters: [
        {
          eventTypes: ['defaultListCreated'],
          payloadPredicates: [{ userId }],
        },
      ],
    });

    expect(defaults.events).toHaveLength(1);
  });

  test('queryTasks separates active and archived via status', async () => {
    const store = new MemoryEventStore();
    const userId = 'user-2';

    const created = await processCreateTask(store, userId, { title: 'Archivieren' });
    await processSetTaskStatus(store, userId, created.taskId, 'Done');

    const active = await processQueryTasks(store, userId, { mode: 'active' });
    const archived = await processQueryTasks(store, userId, { mode: 'archived' });

    expect(active).toHaveLength(0);
    expect(archived).toHaveLength(1);
    expect(archived[0].taskId).toBe(created.taskId);
  });

  test('queryTasks filters by selected statuses', async () => {
    const store = new MemoryEventStore();
    const userId = 'user-status-filter';

    const backlogTask = await processCreateTask(store, userId, { title: 'Backlog task' });
    const readyTask = await processCreateTask(store, userId, { title: 'Ready task' });
    const doneTask = await processCreateTask(store, userId, { title: 'Done task' });

    await processSetTaskStatus(store, userId, backlogTask.taskId, 'Backlog');
    await processSetTaskStatus(store, userId, readyTask.taskId, 'Ready');
    await processSetTaskStatus(store, userId, doneTask.taskId, 'Done');

    const filtered = await processQueryTasks(store, userId, {
      mode: 'active',
      statuses: ['Backlog', 'Ready'],
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((task) => task.status).sort()).toEqual(['Backlog', 'Ready']);
  });

  test('queryTasks is isolated per userId', async () => {
    const store = new MemoryEventStore();

    await processCreateTask(store, 'user-a', { title: 'Task A' });
    await processCreateTask(store, 'user-b', { title: 'Task B' });

    const userATasks = await processQueryTasks(store, 'user-a', { mode: 'active' });
    const userBTasks = await processQueryTasks(store, 'user-b', { mode: 'active' });

    expect(userATasks).toHaveLength(1);
    expect(userBTasks).toHaveLength(1);
    expect(userATasks[0].title).toBe('Task A');
    expect(userBTasks[0].title).toBe('Task B');
    expect(userATasks[0].userId).toBe('user-a');
    expect(userBTasks[0].userId).toBe('user-b');
  });

  test('update, search and delete task', async () => {
    const store = new MemoryEventStore();
    const userId = 'user-3';

    const created = await processCreateTask(store, userId, { title: 'Alpha task', description: 'old' });
    await processUpdateTask(store, userId, created.taskId, {
      description: 'new text',
      tags: ['office'],
    });

    const searched = await processQueryTasks(store, userId, { mode: 'active', searchText: 'new text' });
    expect(searched).toHaveLength(1);
    expect(searched[0].tags).toEqual(['office']);

    await processDeleteTask(store, userId, created.taskId);
    const afterDelete = await processQueryTasks(store, userId, { mode: 'active' });
    expect(afterDelete).toHaveLength(0);
  });

  test('list lifecycle and deleting list moves tasks to default list', async () => {
    const store = new MemoryEventStore();
    const userId = 'user-4';

    const initialLists = await processQueryLists(store, userId);
    expect(initialLists).toHaveLength(1);
    expect(initialLists[0].isDefault).toBe(true);
    const defaultListId = initialLists[0].listId;

    const createdList = await processCreateList(store, userId, 'arbeit');
    await processRenameList(store, userId, createdList.listId, 'projekt');

    const task = await processCreateTask(store, userId, {
      title: 'Task in list',
      listId: createdList.listId,
    });

    await processDeleteList(store, userId, createdList.listId);

    const listsAfterDelete = await processQueryLists(store, userId);
    expect(listsAfterDelete.some((list) => list.listId === createdList.listId)).toBe(false);

    const tasksAfterDelete = await processQueryTasks(store, userId, { mode: 'active' });
    expect(tasksAfterDelete).toHaveLength(1);
    expect(tasksAfterDelete[0].taskId).toBe(task.taskId);
    expect(tasksAfterDelete[0].listId).toBe(defaultListId);
  });
});
