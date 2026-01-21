import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../mcp/auth-schema';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export schema for use in queries
export * from '../../../mcp/auth-schema';
