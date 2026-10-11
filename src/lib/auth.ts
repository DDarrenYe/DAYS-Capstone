import "server-only";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";

import { readAccount } from "@/lib/supabase/account";
import { createClient } from "@/lib/supabase/server";

export const getAccount = async () => {
  "use cache: private";
  cacheLife({ stale: 300 });
  return readAccount(await createClient());
};

export const requireRole = async (role: "student" | "instructor") => {
  const account = await getAccount();
  if (!account) {
    redirect("/");
  }
  if (account.role !== role) {
    redirect(`/${account.role}`);
  }
  return account;
};
