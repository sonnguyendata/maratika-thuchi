// src/app/api/debug-auth/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ 
      authenticated: false, 
      error: error?.message || "No user found",
      user: null,
      profile: null 
    });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || null,
    profileError: profileError?.message || null,
    isAdmin: profile?.role === 'admin'
  });
}
