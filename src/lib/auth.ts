import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";

import { readAccount } from "@/lib/supabase/account";
import { createClient } from "@/lib/supabase/server";

export const getAccount = cache(async () => readAccount(await createClient()));

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
