// src/lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// Read env once (fail fast if missing)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

/**
 * Use this in server code (route handlers / server actions) when you
 * want a NORMAL user/anon context (RLS enforced).
 */
export function supabaseServerAnon() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Use this ONLY in server code that must act as ADMIN (bypass RLS).
 * Never import this from client components. Keep SERVICE_ROLE secret.
 */
export function supabaseServerAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });
}
