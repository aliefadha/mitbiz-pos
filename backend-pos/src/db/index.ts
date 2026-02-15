import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load .env file explicitly since this module loads before ConfigModule
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
