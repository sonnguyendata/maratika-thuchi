import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { accountName, filePath } = await req.json();
  const supabase = createServer();

  // Ensure account exists (upsert by name)
  const { data: acc } = await supabase
    .from('accounts')
    .upsert({ name: accountName })
    .select()
    .limit(1)
    .single();

  const { data: ins, error } = await supabase
    .from('statement_uploads')
    .insert({ account_id: acc?.id, file_path: filePath })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ statementId: ins.id });
}