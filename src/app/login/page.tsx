'use client';
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = createClient();
  const signIn = async () => {
    const email = prompt('Enter email for magic link:');
    if (email) {
      await supabase.auth.signInWithOtp({ email });
      alert('Check your email for the login link.');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={signIn} className="px-4 py-2 rounded bg-black text-white">
        Sign in with email
      </button>
    </div>
  );
}