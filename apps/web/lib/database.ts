import "server-only";

import { Pool } from "pg";

const LOCAL_DATABASE_URL = "postgresql://milo:milo@127.0.0.1:5433/milo";

const globalDatabase = globalThis as typeof globalThis & {
  miloPool?: Pool;
  miloSchemaPromise?: Promise<void>;
};

export const pool =
  globalDatabase.miloPool ??
  new Pool({
    connectionString: LOCAL_DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalDatabase.miloPool = pool;

export async function ensureSchema(): Promise<void> {
  if (!globalDatabase.miloSchemaPromise) {
    globalDatabase.miloSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id uuid PRIMARY KEY,
          title varchar(80) NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS messages (
          id uuid PRIMARY KEY,
          conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          client_id varchar(100) NOT NULL,
          role varchar(16) NOT NULL CHECK (role IN ('user', 'assistant')),
          content text NOT NULL,
          attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (conversation_id, client_id)
        );

        CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
          ON messages (conversation_id, created_at);
      `)
      .then(() => undefined)
      .catch((error) => {
        globalDatabase.miloSchemaPromise = undefined;
        throw error;
      });
  }
  await globalDatabase.miloSchemaPromise;
}
