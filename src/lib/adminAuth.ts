// src/lib/adminAuth.ts
import { supabaseServer } from '@/lib/supabaseServer';

export async function ensureAdmin() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Check admin email from environment variable
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return null;
  }

  // If no admin email is set, allow any authenticated user (for development)
  if (!adminEmail) {
    return supabase;
  }

  return supabase;
}
