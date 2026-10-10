export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!(url && key)) {
    throw new Error("Supabase URL and anonymous key are required for sign-in.");
  }
  return { url, key };
};
