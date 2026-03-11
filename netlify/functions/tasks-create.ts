import type { Handler } from '@netlify/functions';

import { processCreateTask } from '../../src/body/processor';
import type { CreateTaskInput } from '../../src/shared/api';

import { withAuthorizedHandler } from './_lib/runtime';

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const input = parseJson<CreateTaskInput>(event.body);
  const created = await processCreateTask(eventStore, userId, input);

  return {
    statusCode: 201,
    body: created,
  };
});

function parseJson<T>(body: string | null): T {
  if (!body) {
    throw new Error('Missing request body.');
  }

  return JSON.parse(body) as T;
}
