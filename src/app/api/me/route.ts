// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ user: null, role: null });
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("user_id", userRes.user.id)
    .single();

  return NextResponse.json({
    user: { id: userRes.user.id, email: userRes.user.email },
    role: prof?.role ?? null,
  });
}
