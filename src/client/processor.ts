import type {
  CreateListResponse,
  CreateTaskInput,
  CreateTaskResponse,
  DeleteListResponse,
  DeleteTaskResponse,
  ListView,
  QueryTasksInput,
  RenameListResponse,
  SetTaskStatusResponse,
  TaskStatus,
  TaskView,
  TaskViewMode,
  UpdateTaskInput,
  UpdateTaskResponse,
} from '../shared/api';

export class ClientProcessor {
  private readonly accessTokenProvider: () => Promise<string>;

  constructor(accessTokenProvider: () => Promise<string>) {
    this.accessTokenProvider = accessTokenProvider;
  }

  async createTask(input: CreateTaskInput): Promise<CreateTaskResponse> {
    return this.call<CreateTaskResponse>('/api/tasks-create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<UpdateTaskResponse> {
    return this.call<UpdateTaskResponse>('/api/tasks-update', {
      method: 'POST',
      body: JSON.stringify({ taskId, input }),
    });
  }

  async deleteTask(taskId: string): Promise<DeleteTaskResponse> {
    return this.call<DeleteTaskResponse>('/api/tasks-delete', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    });
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<SetTaskStatusResponse> {
    return this.call<SetTaskStatusResponse>('/api/tasks-set-status', {
      method: 'POST',
      body: JSON.stringify({ taskId, status }),
    });
  }

  async queryTasks(input: QueryTasksInput | TaskViewMode): Promise<TaskView[]> {
    const normalizedInput = typeof input === 'string' ? { mode: input } : input;
    const query = new URLSearchParams();

    query.set('mode', normalizedInput.mode);
    if (normalizedInput.searchText) query.set('searchText', normalizedInput.searchText);
    if (normalizedInput.listId) query.set('listId', normalizedInput.listId);
    if (normalizedInput.tag) query.set('tag', normalizedInput.tag);
    if (normalizedInput.statuses && normalizedInput.statuses.length > 0) {
      query.set('statuses', normalizedInput.statuses.join(','));
    }

    return this.call<TaskView[]>(`/api/tasks-query?${query.toString()}`, { method: 'GET' });
  }

  async queryLists(): Promise<ListView[]> {
    return this.call<ListView[]>('/api/lists-query', { method: 'GET' });
  }

  async createList(name: string): Promise<CreateListResponse> {
    return this.call<CreateListResponse>('/api/lists-create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async renameList(listId: string, name: string): Promise<RenameListResponse> {
    return this.call<RenameListResponse>('/api/lists-rename', {
      method: 'POST',
      body: JSON.stringify({ listId, name }),
    });
  }

  async deleteList(listId: string): Promise<DeleteListResponse> {
    return this.call<DeleteListResponse>('/api/lists-delete', {
      method: 'POST',
      body: JSON.stringify({ listId }),
    });
  }

  private async call<T>(url: string, init: RequestInit): Promise<T> {
    const token = await this.accessTokenProvider();

    const response = await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });

    const payload = (await response.json()) as T | { error?: string };
    if (!response.ok) {
      const message = (payload as { error?: string }).error ?? `Request failed (${response.status})`;
      throw new Error(message);
    }

    return payload as T;
  }
}
