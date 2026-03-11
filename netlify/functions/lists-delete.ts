import type { Handler } from '@netlify/functions';

import { processDeleteList } from '../../src/body/processor';

import { withAuthorizedHandler } from './_lib/runtime';

interface DeleteListBody {
  listId: string;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<DeleteListBody>(event.body);
  const result = await processDeleteList(eventStore, userId, body.listId);

  return { statusCode: 200, body: result };
});

function parseJson<T>(body: string | null): T {
  if (!body) throw new Error('Missing request body.');
  return JSON.parse(body) as T;
}
