// src/app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await _req.json().catch(() => ({}));
  const { category_id, hidden } = body ?? {};

  const supabase = supabaseServer();

  // Optional: verify current user is admin via profiles
  const { data: me } = await supabase.from("profiles").select("role").eq("user_id", (await supabase.auth.getUser()).data.user?.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { error } = await supabase
    .from("transactions")
    .update({ category_id, hidden })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
