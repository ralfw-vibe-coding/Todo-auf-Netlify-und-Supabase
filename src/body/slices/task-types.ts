export const TASK_EVENT_TYPES = {
  defaultListCreated: 'defaultListCreated',
  listCreated: 'listCreated',
  listRenamed: 'listRenamed',
  listDeleted: 'listDeleted',
  taskCreated: 'taskCreated',
  taskUpdated: 'taskUpdated',
  taskStatusSet: 'taskStatusSet',
  taskDeleted: 'taskDeleted',
} as const;

export type TaskStatus = 'Backlog' | 'Ready' | 'In Progress' | 'Done';

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  tags?: string[];
  listId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  tags?: string[];
  listId?: string | null;
}

export interface QueryTasksInput {
  mode: TaskViewMode;
  searchText?: string;
  listId?: string;
  tag?: string;
  statuses?: TaskStatus[];
}

export interface ListView {
  listId: string;
  userId: string;
  name: string;
  isDefault: boolean;
}

export interface TaskView {
  taskId: string;
  userId: string;
  listId: string | null;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  tags: string[];
  createdAt: string;
}

export type TaskViewMode = 'active' | 'archived';
