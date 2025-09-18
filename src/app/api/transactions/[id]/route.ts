// src/app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await _req.json().catch(() => ({}));
  const { category_id, hidden } = body ?? {};

  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { error } = await supabase
    .from("transactions")
    .update({ category_id, hidden })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
