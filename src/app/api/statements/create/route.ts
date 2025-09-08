import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const { accountName, filePath } = await req.json();

  if (!accountName || !filePath) {
    return NextResponse.json({ error: 'accountName and filePath are required' }, { status: 400 });
  }

  const supabase = supabaseServerAdmin();

  // Ensure account exists (upsert by unique name)
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .upsert({ name: accountName }, { onConflict: 'name' })
    .select()
    .single();

  if (accErr || !account) {
    return NextResponse.json({ error: accErr?.message ?? 'Account upsert failed' }, { status: 400 });
  }

  // Create upload batch
  const { data: stmt, error: stErr } = await supabase
    .from('statement_uploads')
    .insert({ account_id: account.id, file_path: filePath })
    .select()
    .single();

  if (stErr || !stmt) {
    return NextResponse.json({ error: stErr?.message ?? 'Could not create statement upload' }, { status: 400 });
  }

  return NextResponse.json({ statementId: stmt.id });
}