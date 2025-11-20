// Diagnostic utility to check environment setup
export function checkEnvironment() {
  const checks = {
    hasSupabaseProjectId: !!import.meta.env.VITE_SUPABASE_PROJECT_ID,
    hasSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasWindow: typeof window !== 'undefined',
    hasLocalStorage: typeof window !== 'undefined' && !!window.localStorage,
    nodeEnv: import.meta.env.MODE,
  };

  console.log('Environment Diagnostics:', checks);
  
  if (!checks.hasSupabaseProjectId || !checks.hasSupabaseAnonKey) {
    console.error('⚠️ Missing Supabase environment variables!');
    console.log('Make sure these are set in Vercel:');
    console.log('- VITE_SUPABASE_PROJECT_ID');
    console.log('- VITE_SUPABASE_ANON_KEY');
  }

  return checks;
}
