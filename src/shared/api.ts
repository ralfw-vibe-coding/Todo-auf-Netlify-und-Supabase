import type {
  CreateTaskInput,
  ListView,
  QueryTasksInput,
  TaskStatus,
  TaskView,
  TaskViewMode,
  UpdateTaskInput,
} from '../body/slices/task-types';

export type {
  CreateTaskInput,
  ListView,
  QueryTasksInput,
  TaskStatus,
  TaskView,
  TaskViewMode,
  UpdateTaskInput,
};

export interface CreateTaskResponse {
  taskId: string;
  taskCreatedId: string;
}

export interface UpdateTaskResponse {
  taskUpdatedId: string;
}

export interface DeleteTaskResponse {
  taskDeletedId: string;
}

export interface SetTaskStatusResponse {
  taskStatusSetId: string;
}

export interface CreateListResponse {
  listId: string;
  listCreatedId: string;
}

export interface RenameListResponse {
  listRenamedId: string;
}

export interface DeleteListResponse {
  listDeletedId: string;
}
