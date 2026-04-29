import { execSync } from 'node:child_process';
import { createDb } from '@/db/index';
import * as schema from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { sql } from 'drizzle-orm';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

export function getSchemaTableNames(): string[] {
  const names: string[] = [];
  for (const [, value] of Object.entries(schema)) {
    try {
      const name = getTableName(value as PgTable);
      if (name) {
        names.push(name);
      }
    } catch {
      // not a table (relations, enums, types, etc.)
    }
  }
  return names;
}

let schemaPushed = false;

export function ensureSchemaPushed(cwd: string): void {
  if (schemaPushed) return;
  execSync('npx drizzle-kit push --force', {
    env: { ...process.env },
    stdio: 'pipe',
    cwd,
  });
  schemaPushed = true;
}

export class TestDb {
  db: DrizzleDB | null = null;

  async connect(): Promise<DrizzleDB> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined. Ensure .env.test is loaded or set DATABASE_URL explicitly.',
      );
    }

    this.db = createDb(connectionString);

    try {
      await this.db.execute(sql`SELECT 1`);
    } catch (error) {
      const cause = error instanceof AggregateError ? error.errors?.[0]?.message : String(error);
      throw new Error(
        `Cannot connect to test database.\n  DATABASE_URL: ${connectionString}\n  Cause: ${cause}\n\nPlease start the test DB container and push the schema:\n  npm run test:db:up\n  npm run test:db:push\n`,
      );
    }

    return this.db;
  }

  async truncate(): Promise<void> {
    if (!this.db) {
      throw new Error('TestDb not connected. Call connect() first.');
    }

    const tableNames = getSchemaTableNames();
    if (tableNames.length === 0) {
      return;
    }

    const quoted = tableNames.map((n) => `"${n}"`).join(', ');
    await this.db.execute(sql.raw(`TRUNCATE TABLE ${quoted} CASCADE`));
  }

  async disconnect(): Promise<void> {
    if (!this.db) return;

    // Close the underlying pg pool
    const pool = (this.db as unknown as { $client: { end: () => Promise<void> } }).$client;
    if (pool?.end) {
      await pool.end();
    }
    this.db = null;
  }
}
