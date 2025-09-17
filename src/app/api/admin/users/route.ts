// src/app/api/admin/users/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const supa = supabaseServerAdmin();
  const { data, error } = await supa.from('profiles')
    .select('id:user_id, email, full_name, role')
    .order('email', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, full_name, role } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const supa = supabaseServerAdmin();

  // 1) Create auth user
  const { data: authRes, error: authErr } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr || !authRes?.user) {
    return NextResponse.json({ error: authErr?.message ?? 'createUser failed' }, { status: 500 });
  }

  // 2) Upsert profile
  const { error: profErr } = await supa.from('profiles').upsert({
    user_id: authRes.user.id,
    email,
    full_name: full_name ?? '',
    role: role ?? 'user',
  });

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { user_id, email, full_name, role, password } = body ?? {};
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const supa = supabaseServerAdmin();

  // optional email/password update
  if (email || password) {
    const { error: updAuthErr } = await supa.auth.admin.updateUserById(user_id, {
      email: email || undefined,
      password: password || undefined,
    });
    if (updAuthErr) return NextResponse.json({ error: updAuthErr.message }, { status: 500 });
  }

  const { error: updProfErr } = await supa.from('profiles')
    .update({
      ...(email ? { email } : {}),
      ...(full_name !== undefined ? { full_name } : {}),
      ...(role ? { role } : {}),
    })
    .eq('user_id', user_id);

  if (updProfErr) return NextResponse.json({ error: updProfErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const supa = supabaseServerAdmin();

  // remove profile row first (FK clean-up if you set one)
  await supa.from('profiles').delete().eq('user_id', user_id);

  // delete auth user
  const { error: delErr } = await supa.auth.admin.deleteUser(user_id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
