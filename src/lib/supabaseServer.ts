import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          store.getAll().map(cookie => ({ name: cookie.name, value: cookie.value })),
        setAll: cookies => {
          cookies.forEach(({ name, value, options }) => {
            store.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

/** Admin client — ONLY import from server files (Route Handlers / Server Components) */
export function supabaseServerAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
