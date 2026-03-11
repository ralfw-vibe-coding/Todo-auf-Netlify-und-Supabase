import type { EventStore } from '@ricofritzsche/eventstore';

import { createListCommandSlice } from './slices/create-list-command-slice';
import { createTaskCommandSlice } from './slices/create-task-command-slice';
import { deleteListCommandSlice } from './slices/delete-list-command-slice';
import { deleteTaskCommandSlice } from './slices/delete-task-command-slice';
import { ensureDefaultListCommandSlice } from './slices/ensure-default-list-command-slice';
import { queryListsSlice } from './slices/query-lists-slice';
import { queryTasksSlice } from './slices/query-tasks-slice';
import { renameListCommandSlice } from './slices/rename-list-command-slice';
import { setTaskStatusCommandSlice } from './slices/set-task-status-command-slice';
import type {
  CreateTaskInput,
  ListView,
  QueryTasksInput,
  TaskStatus,
  TaskView,
  UpdateTaskInput,
} from './slices/task-types';
import { updateTaskCommandSlice } from './slices/update-task-command-slice';

export async function processCreateTask(
  eventStore: EventStore,
  userId: string,
  input: CreateTaskInput,
): Promise<{ taskId: string; taskCreatedId: string }> {
  const { listId } = await ensureDefaultListCommandSlice({ eventStore }, userId);

  return createTaskCommandSlice(
    { eventStore },
    {
      userId,
      listId: input.listId ?? listId,
      input,
    },
  );
}

export async function processUpdateTask(
  eventStore: EventStore,
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<{ taskUpdatedId: string }> {
  return updateTaskCommandSlice(
    { eventStore },
    {
      userId,
      taskId,
      input,
    },
  );
}

export async function processDeleteTask(
  eventStore: EventStore,
  userId: string,
  taskId: string,
): Promise<{ taskDeletedId: string }> {
  return deleteTaskCommandSlice(
    { eventStore },
    {
      userId,
      taskId,
    },
  );
}

export async function processSetTaskStatus(
  eventStore: EventStore,
  userId: string,
  taskId: string,
  status: TaskStatus,
): Promise<{ taskStatusSetId: string }> {
  return setTaskStatusCommandSlice(
    { eventStore },
    {
      userId,
      taskId,
      status,
    },
  );
}

export async function processQueryTasks(
  eventStore: EventStore,
  userId: string,
  input: QueryTasksInput,
): Promise<TaskView[]> {
  return queryTasksSlice(eventStore, { userId, input });
}

export async function processQueryLists(eventStore: EventStore, userId: string): Promise<ListView[]> {
  await ensureDefaultListCommandSlice({ eventStore }, userId);
  return queryListsSlice(eventStore, userId);
}

export async function processCreateList(
  eventStore: EventStore,
  userId: string,
  name: string,
): Promise<{ listId: string; listCreatedId: string }> {
  return createListCommandSlice(eventStore, { userId, name });
}

export async function processRenameList(
  eventStore: EventStore,
  userId: string,
  listId: string,
  name: string,
): Promise<{ listRenamedId: string }> {
  return renameListCommandSlice(eventStore, { userId, listId, name });
}

export async function processDeleteList(
  eventStore: EventStore,
  userId: string,
  listId: string,
): Promise<{ listDeletedId: string }> {
  return deleteListCommandSlice(eventStore, { userId, listId });
}
