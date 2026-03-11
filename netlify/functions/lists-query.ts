import type { Handler } from '@netlify/functions';

import { processQueryLists } from '../../src/body/processor';

import { withAuthorizedHandler } from './_lib/runtime';

export const handler: Handler = withAuthorizedHandler(async ({ event, userId, eventStore }) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: { error: 'Method not allowed.' } };
  }

  const lists = await processQueryLists(eventStore, userId);
  return { statusCode: 200, body: lists };
});
