// src/app/api/admin/setup-profile/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json({ 
        message: "Profile already exists",
        profile: existingProfile 
      });
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        role: user.email === 'admin@maratika.asia' ? 'admin' : 'user',
        full_name: user.user_metadata?.full_name || 'User',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        error: "Failed to create profile", 
        details: insertError.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Profile created successfully",
      profile: newProfile 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
