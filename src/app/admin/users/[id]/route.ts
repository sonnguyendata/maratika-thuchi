// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supa = supabaseServerAdmin();
  const body = await req.json().catch(() => ({}));
  const { role, password } = body as { role?: string; password?: string };

  // Update metadata (role)
  if (role) {
    const { error } = await supa.auth.admin.updateUserById(id, {
      user_metadata: { role },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update password
  if (password && password.length >= 6) {
    const { error } = await supa.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supa = supabaseServerAdmin();

  const { error } = await supa.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
