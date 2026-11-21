export interface SupabaseConfigStatus {
  configured: boolean;
  url: string | null;
  anonKey: string | null;
  defaultTenantSlug: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const defaultTenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim() || "sua-odontologia";

  return {
    configured: Boolean(url && anonKey),
    url,
    anonKey,
    defaultTenantSlug
  };
}
