// src/app/api/admin/clear-transactions/route.ts
import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/adminAuth";

export async function DELETE() {
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  try {
    // Clear transactions first (due to foreign key constraints)
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', 0); // Delete all records

    if (txError) {
      return NextResponse.json({ 
        error: "Failed to clear transactions", 
        details: txError.message 
      }, { status: 400 });
    }

    // Clear statements
    const { error: stmtError } = await supabase
      .from('statements')
      .delete()
      .neq('id', 0); // Delete all records

    if (stmtError) {
      return NextResponse.json({ 
        error: "Failed to clear statements", 
        details: stmtError.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "All transactions and statements cleared successfully",
      cleared: {
        transactions: true,
        statements: true
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
