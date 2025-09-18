// src/app/api/transactions/list/route.ts
import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/adminAuth";

export async function GET() {
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { data, error } = await supabase
    .from("transactions")
    .select("id,trx_date,description,credit,debit,balance,transaction_no,category_id,hidden")
    .order("trx_date", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
