import type { Handler } from '@netlify/functions';

import { processCreateList } from '../../src/body/processor';

import { withAuthorizedHandler } from './_lib/runtime';

interface CreateListBody {
  name: string;
}

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const body = parseJson<CreateListBody>(event.body);
  const created = await processCreateList(eventStore, userId, body.name);

  return { statusCode: 201, body: created };
});

function parseJson<T>(body: string | null): T {
  if (!body) throw new Error('Missing request body.');
  return JSON.parse(body) as T;
}
