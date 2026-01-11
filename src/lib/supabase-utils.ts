import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Güvenli logout işlemi
 */
export const safeSignOut = async () => {
  try {
    // Supabase oturumunu da kapat (best-effort)
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      logger.warn('Supabase signOut failed (ignored):', e);
    }

    // Kapsamlı temizlik
    if (typeof window !== 'undefined') {
      // Bilinen tokenları temizle
      clearAuthTokens();

      // Her ihtimale karşı supabase/auth/token içeren tüm anahtarları temizle
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Oturum depolamasını da temizle
      sessionStorage.clear();
    }

    return { success: true, message: 'Successfully signed out' };
  } catch (error: any) {
    logger.error('Error during safe sign out:', error);
    return { success: false, message: 'Error during sign out', error: error.message };
  }
};
    

/**
 * Session durumunu kontrol et (custom auth system)
 */
export const checkSessionStatus = async () => {
  try {
    if (typeof window === 'undefined') {
      return { hasSession: false, user: null, error: null };
    }

    const sessionToken = localStorage.getItem('session_token');
    const userStr = localStorage.getItem('user');
    
    if (!sessionToken || !userStr) {
      return { 
        hasSession: false, 
        user: null, 
        error: null 
      };
    }

    try {
      const user = JSON.parse(userStr);
      return { 
        hasSession: true, 
        user: user, 
        error: null 
      };
    } catch (parseError) {
      // Corrupted data, clear it
      clearAuthTokens();
      return { 
        hasSession: false, 
        user: null, 
        error: 'Invalid session data' 
      };
    }
  } catch (error: any) {
    return { 
      hasSession: false, 
      user: null, 
      error: error.message 
    };
  }
};

/**
 * Authentication token'larını temizle
 */
export const clearAuthTokens = () => {
  if (typeof window !== 'undefined') {
    try {
      // Custom auth tokens
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');

      localStorage.removeItem('supabase_session');
      
      // Supabase specific cleanup
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      // Diğer potansiyel auth verilerini temizle (geniş tarama)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      
      // Session storage temizliği
      sessionStorage.clear();
      

    } catch (e) {
      logger.warn('clearAuthTokens encountered an issue:', e);
    }
  }
};

/**
 * Authentication durumunu yenile
 */
export const refreshAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error refreshing auth state:', error);
      clearAuthTokens();
      return false;
    }
    
    if (!session) {
      clearAuthTokens();
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Unexpected error refreshing auth state:', error);
    clearAuthTokens();
    return false;
  }
};

// Utility to safely handle Supabase query results
export function safeSupabaseResult<T>(data: any): T[] {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return [];
  }
  return data as T[];
}

export function safeSupabaseSingle<T>(data: any): T | null {
  if (!data) {
    return null;
  }
  return data as T;
}

// Type guard to check if data is an error
export function isSupabaseError(data: any): boolean {
  return data && typeof data === 'object' && 'error' in data && data.error === true;
}