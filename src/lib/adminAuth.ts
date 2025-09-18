// src/lib/adminAuth.ts
import { supabaseServer } from '@/lib/supabaseServer';

export async function ensureAdmin() {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log('Auth error or no user:', error?.message);
    return null;
  }

  // Try role-based authentication first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.log('Profile query error:', profileError.message);
    
    // If profile doesn't exist, try to create one
    if (profileError.code === 'PGRST116') { // No rows returned
      console.log('Profile not found, attempting to create one for:', user.email);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          role: user.email === 'admin@maratika.asia' ? 'admin' : 'user',
          full_name: user.user_metadata?.full_name || 'User',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('Failed to create profile:', insertError.message);
        
        // Fallback to email-based authentication
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && user.email === adminEmail) {
          console.log('Using email-based auth fallback for:', user.email);
          return supabase;
        }
        
        return null;
      } else {
        console.log('Profile created successfully for:', user.email);
        // Retry the query
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (newProfile?.role === 'admin') {
          console.log('User is admin:', user.email, newProfile.role);
          return supabase;
        }
      }
    }
    
    // Fallback to email-based authentication if profiles table has issues
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      console.log('Using email-based auth fallback for:', user.email);
      return supabase;
    }
    
    return null;
  }

  if (!profile || profile.role !== 'admin') {
    console.log('User is not admin. Profile:', profile);
    
    // Fallback to email-based authentication
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      console.log('Using email-based auth fallback for:', user.email);
      return supabase;
    }
    
    return null;
  }

  console.log('User is admin:', user.email, profile.role);
  return supabase;
}
