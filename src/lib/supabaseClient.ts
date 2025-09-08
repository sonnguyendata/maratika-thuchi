// src/lib/supabaseClient.ts
import { createBrowserClient, createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// For client-side use (browser)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// For server-side use (API routes / server actions)
export const createServer = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
