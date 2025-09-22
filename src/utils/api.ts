import { projectId } from './supabase/info';

// Prefer env override. If not present, assume Supabase Edge function named "server".
// Example: VITE_API_BASE=https://<your-project>.functions.supabase.co/server
export const API_BASE = (import.meta as any)?.env?.VITE_API_BASE 
  || `https://${projectId}.functions.supabase.co/server`;

