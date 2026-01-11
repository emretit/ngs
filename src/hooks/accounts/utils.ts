import { supabase } from "@/integrations/supabase/client";

// Company ID cache - shared across all account hooks
let companyIdCache: string | null = null;
let companyIdPromise: Promise<string> | null = null;

export async function fetchCompanyId() {
  // Cache'den döndür
  if (companyIdCache) {
    return companyIdCache;
  }

  // Eğer zaten bir request varsa, onu bekle
  if (companyIdPromise) {
    return companyIdPromise;
  }

  // Yeni request başlat
  companyIdPromise = (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("Şirket bilgisi bulunamadı");
    }

    companyIdCache = profile.company_id;
    return profile.company_id;
  })();

  return companyIdPromise;
}

// Helper function to fetch user info from audit logs
export async function fetchUserInfoFromAuditLogs(
  entityType: string,
  entityIds: string[]
): Promise<Record<string, string>> {
  if (entityIds.length === 0) return {};

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('entity_id, user_id')
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)
    .eq('action', 'create')
    .order('created_at', { ascending: false });

  if (!auditLogs || auditLogs.length === 0) return {};

  const userIds = [...new Set(auditLogs.map((log: any) => log.user_id).filter(Boolean))];
  if (userIds.length === 0) return {};

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (!profiles) return {};

  const profileMap: Record<string, string> = {};
  profiles.forEach((profile: any) => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (fullName) {
      profileMap[profile.id] = fullName;
    }
  });

  const userInfoMap: Record<string, string> = {};
  auditLogs.forEach((log: any) => {
    if (log.user_id && profileMap[log.user_id]) {
      userInfoMap[log.entity_id] = profileMap[log.user_id];
    }
  });

  return userInfoMap;
}
