"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. The app runs fine with NO Supabase configured
 * (demo mode on mock data). Auth + persistence only switch on once these two
 * public env vars are set.
 */
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
