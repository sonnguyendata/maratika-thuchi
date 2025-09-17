// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supa = supabaseServerAdmin();
  const { data, error } = await supa.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data?.users ?? []).map(u => ({
    id: u.id,
    email: u.email,
    role: (u.user_metadata?.role as string) || 'user',
    created_at: u.created_at,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const supa = supabaseServerAdmin();
  const body = await req.json().catch(() => ({}));
  const { email, password, role = 'user' } = body as {
    email?: string; password?: string; role?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { data, error } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    user: { id: data.user!.id, email, role }
  }, { status: 201 });
}
