import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

let database: PostgresJsDatabase<typeof schema> | undefined;

export const getDb = () => {
  if (database) {
    return database;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for server database access.");
  }

  database = drizzle(postgres(url, { prepare: false }), { schema });
  return database;
};
