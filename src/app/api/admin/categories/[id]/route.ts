// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

async function ensureAdmin() {
  const supabase = await supabaseServer();
  const { data: usr } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", usr?.user?.id ?? "")
    .single();
  return me?.role === "admin" ? supabase : null;
}

type CategoryType = "income" | "expense";
type CategoryUpdate = Partial<{
  name: string;
  type: CategoryType;
  target_amount: number | null;
}>;

function extractPatch(payload: unknown): CategoryUpdate {
  if (typeof payload !== "object" || payload === null) {
    return {};
  }

  const body = payload as Record<string, unknown>;
  const patch: CategoryUpdate = {};

  if (typeof body.name === "string") {
    patch.name = body.name;
  }

  if (body.type === "income" || body.type === "expense") {
    patch.type = body.type;
  }

  if (body.target_amount === null) {
    patch.target_amount = null;
  } else if (typeof body.target_amount === "number" && Number.isFinite(body.target_amount)) {
    patch.target_amount = body.target_amount;
  }

  return patch;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const patch = extractPatch(await req.json());
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  // Optional: prevent delete if in use (simple check)
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Category in use by transactions" }, { status: 409 });
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
