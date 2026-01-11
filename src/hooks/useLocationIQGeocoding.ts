import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { locationiqService, GeocodingResult } from '@/services/locationiqService';

interface GeocodingCache {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  display_name: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string;
  expires_at: string;
}

/**
 * Hook for geocoding with Supabase caching
 * Reduces API calls by ~90% by caching results for 30 days
 */
export const useLocationIQGeocoding = () => {
  const queryClient = useQueryClient();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get cached geocoding result from Supabase
   */
  const getCachedResult = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    try {
      const { data, error } = await supabase
        .from('geocoding_cache')
        .select('*')
        .eq('address', address)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return {
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        display_name: data.display_name || '',
        city: data.city || undefined,
        district: data.district || undefined,
        country: data.country || undefined,
        postal_code: data.postal_code || undefined,
      };
    } catch (error) {
      logger.error('Error getting cached geocoding result:', error);
      return null;
    }
  }, []);

  /**
   * Save geocoding result to cache
   */
  const cacheResult = useCallback(async (result: GeocodingResult): Promise<void> => {
    try {
      const { error } = await supabase
        .from('geocoding_cache')
        .upsert({
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          display_name: result.display_name,
          city: result.city || null,
          district: result.district || null,
          country: result.country || null,
          postal_code: result.postal_code || null,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }, {
          onConflict: 'address',
        });

      if (error) {
        logger.error('Error caching geocoding result:', error);
      }
    } catch (error) {
      logger.error('Error caching geocoding result:', error);
    }
  }, []);

  /**
   * Geocode an address with caching
   */
  const geocode = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    if (!address) {
      return null;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      // First, check cache
      const cached = await getCachedResult(address);
      if (cached) {
        setIsGeocoding(false);
        return cached;
      }

      // If not in cache, call API
      const result = await locationiqService.geocode(address);

      if (result) {
        // Cache the result
        await cacheResult(result);
      }

      setIsGeocoding(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Geocoding failed';
      setError(errorMessage);
      setIsGeocoding(false);
      logger.error('Geocoding error:', err);
      return null;
    }
  }, [getCachedResult, cacheResult]);

  /**
   * Geocode multiple addresses in batch
   */
  const geocodeBatch = useCallback(async (addresses: string[]): Promise<Map<string, GeocodingResult | null>> => {
    const results = new Map<string, GeocodingResult | null>();

    for (const address of addresses) {
      if (address) {
        const result = await geocode(address);
        results.set(address, result);
        // Add small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }, [geocode]);

  /**
   * Clean expired cache entries
   */
  const cleanExpiredCache = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('clean_expired_geocoding_cache');
      if (error) throw error;
    },
    onSuccess: () => {
      // Cache cleaned successfully
    },
    onError: (error) => {
      logger.error('Error cleaning expired cache:', error);
    },
  });

  return {
    geocode,
    geocodeBatch,
    isGeocoding,
    error,
    cleanExpiredCache: cleanExpiredCache.mutate,
    isCleaningCache: cleanExpiredCache.isPending,
  };
};

