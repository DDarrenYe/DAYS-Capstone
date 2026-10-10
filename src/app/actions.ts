"use server";

import { redirect } from "next/navigation";

import { readAccount } from "@/lib/supabase/account";
import { parseCredentials } from "@/lib/supabase/credentials";
import { createClient } from "@/lib/supabase/server";

export const signIn = async (
  _previous: { error: string },
  formData: FormData
) => {
  const credentials = parseCredentials(formData);
  if (!credentials) {
    return { error: "Enter a valid email address and password." };
  }
  let destination: string;
  try {
    const supabase = await createClient({ writeCookies: true });
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      return {
        error:
          error.status === 400
            ? "Email or password is incorrect."
            : "Unable to sign in. Try again shortly.",
      };
    }
    const account = await readAccount(supabase).catch(async () => {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    });
    if (!account) {
      return { error: "Unable to verify your account. Try signing in again." };
    }
    destination = `/${account.role}`;
  } catch (error) {
    console.error("Sign-in failed", error);
    return {
      error: "Unable to sign in. Try again shortly or contact your instructor.",
    };
  }
  redirect(destination);
};

export const signOut = async (_previous: { error: string }) => {
  try {
    const supabase = await createClient({ writeCookies: true });
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      return { error: "Unable to sign out. Try again shortly." };
    }
  } catch (error) {
    console.error("Sign-out failed", error);
    return { error: "Unable to sign out. Try again shortly." };
  }
  redirect("/");
};
