import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use a default DATABASE_URL for development if not provided
// This allows the frontend to run without requiring PostgreSQL setup
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/speakup_dev";

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Using default: " + DATABASE_URL + 
    "\n⚠️  Database features won't work until you configure a real PostgreSQL database."
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
