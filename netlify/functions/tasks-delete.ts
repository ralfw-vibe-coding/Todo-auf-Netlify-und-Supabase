import type { Handler } from '@netlify/functions';

import { processDeleteTask } from '../../src/body/processor';

import { withAuthorizedHandler } from './_lib/runtime';

interface DeleteTaskBody {
  taskId: string;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<DeleteTaskBody>(event.body);
  const result = await processDeleteTask(eventStore, userId, body.taskId);

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
