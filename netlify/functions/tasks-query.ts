import type { Handler } from '@netlify/functions';

import { processQueryTasks } from '../../src/body/processor';
import type { QueryTasksInput, TaskViewMode } from '../../src/shared/api';

import { withAuthorizedHandler } from './_lib/runtime';

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const input: QueryTasksInput = {
    mode: parseMode(event.queryStringParameters?.mode),
    searchText: event.queryStringParameters?.searchText,
    listId: event.queryStringParameters?.listId,
    tag: event.queryStringParameters?.tag,
    statuses: parseStatuses(event.queryStringParameters?.statuses),
  };

  const tasks = await processQueryTasks(eventStore, userId, input);

  return {
    statusCode: 200,
    body: tasks,
  };
});

function parseMode(mode: string | undefined): TaskViewMode {
  if (mode === 'archived') {
    return 'archived';
  }

  return 'active';
}

function parseStatuses(value: string | undefined): QueryTasksInput['statuses'] {
  if (!value) return undefined;

  const statuses = value
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is NonNullable<QueryTasksInput['statuses']>[number] =>
      part === 'Backlog' || part === 'Ready' || part === 'In Progress' || part === 'Done',
    );

  return statuses.length > 0 ? statuses : undefined;
}
