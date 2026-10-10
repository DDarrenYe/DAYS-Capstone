import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

export const createClient = async ({
  writeCookies = false,
}: { writeCookies?: boolean } = {}) => {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: writeCookies
        ? (cookiesToSet) => {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          }
        : undefined,
    },
  });
};
