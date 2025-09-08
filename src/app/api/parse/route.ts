import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: replace with real PDF parsing in Step 8
  return NextResponse.json({ new: 0, dup: 0, err: 0 });
}