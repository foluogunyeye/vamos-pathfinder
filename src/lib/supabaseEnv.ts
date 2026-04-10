function trimEnv(value: string | undefined): string {
  if (value == null || typeof value !== "string") return "";
  let s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Supabase anon / publishable key — Lovable used PUBLISHABLE_KEY; Supabase docs use ANON_KEY (same value). */
export function getSupabaseAnonKey(): string {
  return trimEnv(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

/** Base URL with no trailing slash, e.g. https://xxxx.supabase.co */
export function getSupabaseUrl(): string {
  const raw = trimEnv(import.meta.env.VITE_SUPABASE_URL);
  return raw.replace(/\/+$/, "");
}
