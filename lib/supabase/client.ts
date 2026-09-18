import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://qfzxfpppjliobtnvwzoz.supabase.co";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_Ja_4ejTjTj3G_SoKI_mejw_6yI7v8G2";

  return createBrowserClient(url, key);
}