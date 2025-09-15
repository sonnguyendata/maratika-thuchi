// src/app/api/admin/transactions/list/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();

  // check admin
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabase
    .from("transactions")
    .select("id,trx_date,description,credit,debit,balance,transaction_no,category_id,hidden")
    .order("trx_date", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
