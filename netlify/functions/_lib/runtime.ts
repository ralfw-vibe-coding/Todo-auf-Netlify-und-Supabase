import type { Handler, HandlerEvent } from '@netlify/functions';
import { PostgresEventStore } from '@ricofritzsche/eventstore';
import { createClient } from '@supabase/supabase-js';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

export function withAuthorizedHandler(
  handler: (ctx: {
    event: HandlerEvent;
    userId: string;
    eventStore: PostgresEventStore;
  }) => Promise<{ statusCode?: number; body: unknown }>,
): Handler {
  return async (event) => {
    try {
      const userId = await requireUserId(event);
      const connectionString = process.env.BACKEND_SUPABASE_DB_URL;

      if (!connectionString) {
        return response(500, {
          error: 'Missing BACKEND_SUPABASE_DB_URL.',
        });
      }

      const eventStore = new PostgresEventStore({ connectionString });
      try {
        const result = await handler({ event, userId, eventStore });
        return response(result.statusCode ?? 200, result.body);
      } finally {
        await eventStore.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      return response(401, { error: message });
    }
  };
}

function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

async function requireUserId(event: HandlerEvent): Promise<string> {
  const authHeader = event.headers.authorization ?? event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_PROJECT_URL/SUPABASE_ANON_KEY.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Invalid auth token.');
  }

  return data.user.id;
}
