import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * LocationIQ API Service
 * Proxies all requests through a Supabase Edge Function to keep API key server-side
 */

export interface LocationIQAutocompleteResult {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address: {
    name?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  display_name: string;
  city?: string;
  district?: string;
  country?: string;
  postal_code?: string;
}

class LocationIQService {
  /**
   * Search for addresses with autocomplete
   * @param query - Search query
   * @param countryCode - Country code filter (default: 'tr' for Turkey)
   * @returns Array of autocomplete results
   */
  async autocomplete(
    query: string,
    countryCode: string = 'tr'
  ): Promise<LocationIQAutocompleteResult[]> {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: {
          action: 'autocomplete',
          query,
          countryCode
        }
      });

      if (error) {
        logger.error('LocationIQ autocomplete error:', error);
        throw new Error(error.message || 'Adres arama başarısız oldu');
      }

      return data || [];
    } catch (error) {
      logger.error('LocationIQ autocomplete error:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param address - Full address string
   * @param countryCode - Country code filter (default: 'tr')
   * @returns Geocoding result with coordinates
   */
  async geocode(
    address: string,
    countryCode: string = 'tr'
  ): Promise<GeocodingResult | null> {
    if (!address) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: {
          action: 'geocode',
          query: address,
          countryCode
        }
      });

      if (error) {
        logger.error('LocationIQ geocoding error:', error);
        throw new Error(error.message || 'Geocoding başarısız oldu');
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null;
      }

      const result = Array.isArray(data) ? data[0] : data;
      
      return {
        address,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        city: result.address?.city || result.address?.county || result.address?.state,
        district: result.address?.suburb || result.address?.county,
        country: result.address?.country,
        postal_code: result.address?.postcode,
      };
    } catch (error) {
      logger.error('LocationIQ geocoding error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Address information
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: {
          action: 'reverse',
          lat,
          lon
        }
      });

      if (error) {
        logger.error('LocationIQ reverse geocoding error:', error);
        throw new Error(error.message || 'Reverse geocoding başarısız oldu');
      }
      
      return {
        address: data.display_name,
        latitude: lat,
        longitude: lon,
        display_name: data.display_name,
        city: data.address?.city || data.address?.county || data.address?.state,
        district: data.address?.suburb || data.address?.county,
        country: data.address?.country,
        postal_code: data.address?.postcode,
      };
    } catch (error) {
      logger.error('LocationIQ reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Check if service is available (always true since we use edge function)
   */
  isConfigured(): boolean {
    return true;
  }
}

export const locationiqService = new LocationIQService();
