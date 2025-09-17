// src/app/api/admin/categories/route.ts
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

export async function GET() {
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,type,target_amount")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  const { name, type, target_amount } = body ?? {};
  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, type, target_amount: target_amount ?? 0 })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
