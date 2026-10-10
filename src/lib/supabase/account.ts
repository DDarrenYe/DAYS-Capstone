import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const readAccount = async (
  supabase: SupabaseClient
): Promise<{
  id: string;
  displayName: string;
  role: "student" | "instructor";
} | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    if (
      error &&
      error.status !== 400 &&
      error.status !== 401 &&
      error.status !== 403
    ) {
      throw new Error("Unable to verify your session. Try again shortly.");
    }
    return null;
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();
  if (
    profileError ||
    !profile ||
    (profile.role !== "student" && profile.role !== "instructor")
  ) {
    throw new Error("Unable to load your account. Contact your instructor.");
  }
  return {
    id: user.id,
    displayName: String(profile.display_name),
    role: profile.role,
  };
};
