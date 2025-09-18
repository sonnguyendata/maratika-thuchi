// src/lib/adminAuth.ts
import { supabaseServer } from '@/lib/supabaseServer';

export async function ensureAdmin() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Check if user has admin role in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return supabase;
}
