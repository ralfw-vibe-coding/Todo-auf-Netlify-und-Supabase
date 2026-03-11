import { PostgresEventStore } from '@ricofritzsche/eventstore';

const connectionString = process.env.BACKEND_SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('Missing BACKEND_SUPABASE_DB_URL.');
}

process.env.DATABASE_URL = connectionString;

const store = new PostgresEventStore({ connectionString });

try {
  await store.initializeDatabase();
  console.log('Event store database initialized.');
} finally {
  await store.close();
}
