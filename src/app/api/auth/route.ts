import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map(cookie => ({ name: cookie.name, value: cookie.value })),
        setAll: cookies => {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { event, session } = body ?? {};

  if (event === 'SIGNED_IN' && session?.access_token) {
    // Set the auth cookie on the server
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
