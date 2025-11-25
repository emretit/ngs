/**
 * LocationIQ API Service
 * Provides address autocomplete and geocoding functionality
 * Free tier: 5,000 requests/day
 */

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
const BASE_URL = 'https://api.locationiq.com/v1';

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
  private apiKey: string;

  constructor() {
    this.apiKey = LOCATIONIQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('LocationIQ API key not found. Set VITE_LOCATIONIQ_API_KEY in environment variables.');
    }
  }

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
    if (!this.apiKey) {
      throw new Error('LocationIQ API key is not configured');
    }

    if (!query || query.length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: query,
        format: 'json',
        countrycodes: countryCode,
        addressdetails: '1',
        limit: '10',
        dedupe: '1',
      });

      const response = await fetch(`${BASE_URL}/autocomplete.php?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LocationIQ API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('LocationIQ autocomplete error:', error);
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
    if (!this.apiKey) {
      throw new Error('LocationIQ API key is not configured');
    }

    if (!address) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: address,
        format: 'json',
        countrycodes: countryCode,
        addressdetails: '1',
        limit: '1',
      });

      const response = await fetch(`${BASE_URL}/search.php?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LocationIQ geocoding error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      
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
      console.error('LocationIQ geocoding error:', error);
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
    if (!this.apiKey) {
      throw new Error('LocationIQ API key is not configured');
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        lat: lat.toString(),
        lon: lon.toString(),
        format: 'json',
        addressdetails: '1',
      });

      const response = await fetch(`${BASE_URL}/reverse.php?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LocationIQ reverse geocoding error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        address: result.display_name,
        latitude: lat,
        longitude: lon,
        display_name: result.display_name,
        city: result.address?.city || result.address?.county || result.address?.state,
        district: result.address?.suburb || result.address?.county,
        country: result.address?.country,
        postal_code: result.address?.postcode,
      };
    } catch (error) {
      console.error('LocationIQ reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const locationiqService = new LocationIQService();




