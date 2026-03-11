import type { Handler } from '@netlify/functions';

import { processSetTaskStatus } from '../../src/body/processor';
import type { TaskStatus } from '../../src/shared/api';

import { withAuthorizedHandler } from './_lib/runtime';

interface SetTaskStatusBody {
  taskId: string;
  status: TaskStatus;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<SetTaskStatusBody>(event.body);
  const result = await processSetTaskStatus(eventStore, userId, body.taskId, body.status);

  return {
    statusCode: 200,
    body: result,
  };
});

function parseJson<T>(body: string | null): T {
  if (!body) {
    throw new Error('Missing request body.');
  }

  return JSON.parse(body) as T;
}
