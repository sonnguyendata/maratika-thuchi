import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Receives { event, session } from the client and syncs the server auth cookie
export async function POST(req: NextRequest) {
  const { event, session } = await req.json();

  const supa = supabaseServer();

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    await supa.auth.setSession({
      access_token: session?.access_token,
      refresh_token: session?.refresh_token,
    });
  }

  if (event === 'SIGNED_OUT') {
    await supa.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
