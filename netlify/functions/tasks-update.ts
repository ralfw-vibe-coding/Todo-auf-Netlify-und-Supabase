import type { Handler } from '@netlify/functions';

import { processUpdateTask } from '../../src/body/processor';
import type { UpdateTaskInput } from '../../src/shared/api';

import { withAuthorizedHandler } from './_lib/runtime';

interface UpdateTaskBody {
  taskId: string;
  input: UpdateTaskInput;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<UpdateTaskBody>(event.body);
  const result = await processUpdateTask(eventStore, userId, body.taskId, body.input);

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
