import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!connectionString) return null;
  if (!dbInstance) {
    const pool = new Pool({ connectionString });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export function requireDb() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required");
  return db;
}

export { schema };
