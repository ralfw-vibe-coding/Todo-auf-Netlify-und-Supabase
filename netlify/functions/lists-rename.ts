import type { Handler } from '@netlify/functions';

import { processRenameList } from '../../src/body/processor';

import { withAuthorizedHandler } from './_lib/runtime';

interface RenameListBody {
  listId: string;
  name: string;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<RenameListBody>(event.body);
  const result = await processRenameList(eventStore, userId, body.listId, body.name);

  return { statusCode: 200, body: result };
});

function parseJson<T>(body: string | null): T {
  if (!body) throw new Error('Missing request body.');
  return JSON.parse(body) as T;
}
