import { createFilter } from '@ricofritzsche/eventstore';

import { TASK_EVENT_TYPES } from './task-types';

export function byUserFilter(userId: string) {
  return createFilter(
    [
      TASK_EVENT_TYPES.defaultListCreated,
      TASK_EVENT_TYPES.listCreated,
      TASK_EVENT_TYPES.listRenamed,
      TASK_EVENT_TYPES.listDeleted,
      TASK_EVENT_TYPES.taskCreated,
      TASK_EVENT_TYPES.taskUpdated,
      TASK_EVENT_TYPES.taskStatusSet,
      TASK_EVENT_TYPES.taskDeleted,
    ],
    [{ userId }],
  );
}

export function byTaskFilter(userId: string, taskId: string) {
  return createFilter(
    [
      TASK_EVENT_TYPES.taskCreated,
      TASK_EVENT_TYPES.taskUpdated,
      TASK_EVENT_TYPES.taskStatusSet,
      TASK_EVENT_TYPES.taskDeleted,
    ],
    [{ userId, taskId }],
  );
}

export function byDefaultListFilter(userId: string) {
  return createFilter([TASK_EVENT_TYPES.defaultListCreated], [{ userId }]);
}
