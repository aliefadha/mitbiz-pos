import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type DrizzleDB = NodePgDatabase<typeof import('./schema')>;
