import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export const createClient = () => {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient<Database>(url, key);
};
