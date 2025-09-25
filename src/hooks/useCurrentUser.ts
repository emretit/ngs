import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  full_name: string | null;
  email: string;
  company_id: string | null;
  employee_id: string | null;
}

export const useCurrentUser = () => {
  const { user } = useAuth();

  // Initialize from cache to avoid flicker on route changes
  const getInitialCached = () => {
    if (!user?.id) return null as UserData | null;
    try {
      const raw = sessionStorage.getItem(`user_data_${user.id}`);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      const fresh = Date.now() - (5 * 60 * 1000) < timestamp;
      return fresh ? (data as UserData) : null;
    } catch {
      return null;
    }
  };

  const [userData, setUserData] = useState<UserData | null>(getInitialCached());
  const [loading, setLoading] = useState(!getInitialCached());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        setUserData(null);
        return;
      }

      // Cache kontrol et - eğer aynı user için data varsa ve son 5 dakikada alındıysa tekrar fetch etme
      const cacheKey = `user_data_${user.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          if (timestamp > fiveMinutesAgo) {
            setUserData(data);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Cache parse hatası, devam et
        }
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, company_id, employee_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        // Cache'e kaydet
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

        setUserData(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  return {
    userData,
    loading,
    error,
    displayName: userData?.full_name || user?.user_metadata?.full_name || 'Kullanıcı',
    userInitials: userData?.full_name
      ? userData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user?.email?.slice(0, 2).toUpperCase() || 'U'
  };
};