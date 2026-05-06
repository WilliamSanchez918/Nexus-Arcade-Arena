export function supabaseClientKeyFromEnv(env = {}) {
  return env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
}

export function hasSupabaseClientConfig(env = {}) {
  return env.VITE_IDENTITY_PROVIDER === 'supabase'
    && Boolean(env.VITE_SUPABASE_URL)
    && Boolean(supabaseClientKeyFromEnv(env));
}
