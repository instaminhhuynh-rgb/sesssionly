/**
 * Supabase client placeholder.
 *
 * Phase 3 wires this up. For now the app reads from lib/mock-data.ts.
 * When ready:
 *   npm i @supabase/supabase-js @supabase/ssr
 * then replace the stub below with a real browser client and swap the
 * accessor functions in lib/mock-data.ts to query these tables.
 *
 * Browser (client component) usage:
 *   import { createBrowserClient } from "@supabase/ssr";
 *   export const supabase = createBrowserClient(
 *     process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   );
 */

export const SUPABASE_READY = false;

export function assertSupabase(): never {
  throw new Error(
    "Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and implement lib/supabase/client.ts.",
  );
}
