/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
