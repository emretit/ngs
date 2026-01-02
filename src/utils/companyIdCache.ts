import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

/**
 * Company ID Cache Utility
 *
 * Consolidates 57+ duplicate fetchCompanyId implementations across the codebase.
 * Uses a singleton pattern with promise caching to prevent multiple concurrent requests.
 *
 * @see Phase 1.1 of PAFTA Refactoring Plan
 */

// Cache for company ID
let companyIdCache: string | null = null;
// Promise cache to prevent concurrent requests
let companyIdPromise: Promise<string> | null = null;

/**
 * Fetches the company ID for the current authenticated user
 * Uses caching to avoid repeated database queries
 *
 * @returns Promise<string> The company ID
 * @throws Error if user is not authenticated or company_id is not found
 */
export async function fetchCompanyId(): Promise<string> {
  // Return cached value if available
  if (companyIdCache) {
    logger.debug("Company ID retrieved from cache", { companyId: companyIdCache });
    return companyIdCache;
  }

  // If a request is already in progress, wait for it
  if (companyIdPromise) {
    logger.debug("Waiting for existing company ID request");
    return companyIdPromise;
  }

  // Start new request
  logger.debug("Fetching company ID from database");
  companyIdPromise = (async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        logger.error("Failed to get user", userError);
        throw new Error("Kullanıcı bilgisi alınamadı: " + userError.message);
      }

      if (!user || !user.id) {
        logger.warn("User not found or not authenticated");
        throw new Error("Kullanıcı bulunamadı");
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error("Failed to fetch profile", profileError, { userId: user.id });
        throw new Error("Profil bilgisi alınamadı: " + profileError.message);
      }

      if (!profile?.company_id) {
        logger.error("Company ID not found in profile", null, { userId: user.id });
        throw new Error("Şirket bilgisi bulunamadı");
      }

      companyIdCache = profile.company_id;
      logger.info("Company ID fetched successfully", { companyId: profile.company_id });
      return profile.company_id;
    } catch (error) {
      // Clear promise cache on error so the request can be retried
      companyIdPromise = null;
      throw error;
    }
  })();

  return companyIdPromise;
}

/**
 * Clears the company ID cache
 * Useful when user logs out or switches companies
 */
export function clearCompanyIdCache(): void {
  logger.debug("Clearing company ID cache");
  companyIdCache = null;
  companyIdPromise = null;
}

/**
 * Gets the cached company ID without making a request
 * Returns null if not cached
 *
 * @returns string | null The cached company ID or null
 */
export function getCachedCompanyId(): string | null {
  return companyIdCache;
}
