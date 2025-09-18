// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ user: null, isAdmin: false });
  }

  // Check admin email from environment variable
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !adminEmail || userRes.user.email === adminEmail;

  return NextResponse.json({
    user: { id: userRes.user.id, email: userRes.user.email },
    isAdmin,
  });
}
