/**
 * LocationIQ Utility Functions
 * Helper functions for mapping LocationIQ results to Supabase data
 */

import { supabase } from '@/integrations/supabase/client';
import { LocationIQAutocompleteResult } from '@/services/locationiqService';

interface City {
  id: number;
  name: string;
  code: string;
}

interface District {
  id: number;
  name: string;
  city_id: number;
}

/**
 * Normalize Turkish characters for better matching
 */
export const normalizeTurkish = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .trim();
};

/**
 * Find city ID from Supabase by city name
 */
export const findCityId = async (cityName: string): Promise<number | null> => {
  if (!cityName) return null;

  try {
    // Try exact match first
    const { data: exactMatch, error: exactError } = await supabase
      .from('turkey_cities')
      .select('id, name')
      .ilike('name', cityName)
      .single();

    if (!exactError && exactMatch) {
      return exactMatch.id;
    }

    // Try normalized match
    const normalizedSearch = normalizeTurkish(cityName);
    
    const { data: cities, error } = await supabase
      .from('turkey_cities')
      .select('id, name');

    if (error || !cities) {
      console.error('Error fetching cities:', error);
      return null;
    }

    const matchedCity = cities.find(city => 
      normalizeTurkish(city.name) === normalizedSearch
    );

    return matchedCity?.id || null;
  } catch (error) {
    console.error('Error finding city ID:', error);
    return null;
  }
};

/**
 * Find district ID from Supabase by district name and city ID
 */
export const findDistrictId = async (
  districtName: string,
  cityId: number
): Promise<number | null> => {
  if (!districtName || !cityId) return null;

  try {
    // Try exact match first
    const { data: exactMatch, error: exactError } = await supabase
      .from('turkey_districts')
      .select('id, name')
      .eq('city_id', cityId)
      .ilike('name', districtName)
      .single();

    if (!exactError && exactMatch) {
      return exactMatch.id;
    }

    // Try normalized match
    const normalizedSearch = normalizeTurkish(districtName);
    
    const { data: districts, error } = await supabase
      .from('turkey_districts')
      .select('id, name')
      .eq('city_id', cityId);

    if (error || !districts) {
      console.error('Error fetching districts:', error);
      return null;
    }

    const matchedDistrict = districts.find(district =>
      normalizeTurkish(district.name) === normalizedSearch
    );

    return matchedDistrict?.id || null;
  } catch (error) {
    console.error('Error finding district ID:', error);
    return null;
  }
};

/**
 * Parse LocationIQ result and map to form data
 */
export interface ParsedAddressData {
  address: string;
  city: string;
  cityId: number | null;
  district: string;
  districtId: number | null;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

export const parseLocationIQResult = async (
  result: LocationIQAutocompleteResult
): Promise<ParsedAddressData | null> => {
  if (!result) return null;

  try {
    // LocationIQ sometimes mixes up city/county/state fields
    // For Turkey, we need smarter parsing:
    // - state is usually the province (İstanbul, Ankara, etc.)
    // - city might be district (Kadıköy, Çankaya, etc.)
    // - county might be district or city
    
    const stateName = result.address?.state || '';
    const cityName = result.address?.city || '';
    const countyName = result.address?.county || '';
    const suburbName = result.address?.suburb || '';

    // Strategy: Try to find the actual city (province) first
    // In Turkey, state is usually the province (İstanbul, Ankara, İzmir, etc.)
    let actualCityName = '';
    let actualDistrictName = '';
    let cityId: number | null = null;
    let districtId: number | null = null;

    // Step 1: Try state as city (most reliable for Turkey)
    if (stateName) {
      const stateCityId = await findCityId(stateName);
      if (stateCityId) {
        actualCityName = stateName;
        cityId = stateCityId;
      }
    }

    // Step 2: If state didn't work, try city field
    if (!cityId && cityName) {
      const cityFieldId = await findCityId(cityName);
      if (cityFieldId) {
        actualCityName = cityName;
        cityId = cityFieldId;
      } else {
        // city field is NOT a city, it's probably a district
        // So use state as city and city as district
        if (stateName) {
          const stateAsCityId = await findCityId(stateName);
          if (stateAsCityId) {
            actualCityName = stateName;
            cityId = stateAsCityId;
            actualDistrictName = cityName; // city field is actually district
          }
        }
      }
    }

    // Step 3: If still no city, try county
    if (!cityId && countyName) {
      const countyCityId = await findCityId(countyName);
      if (countyCityId) {
        actualCityName = countyName;
        cityId = countyCityId;
      }
    }

    // Step 4: Find district
    if (cityId) {
      // Try to find district from various fields
      const districtCandidates = [
        actualDistrictName || cityName, // If city field was actually district
        suburbName,
        countyName,
      ].filter(Boolean);

      for (const candidate of districtCandidates) {
        if (candidate && candidate !== actualCityName) {
          const foundDistrictId = await findDistrictId(candidate, cityId);
          if (foundDistrictId) {
            actualDistrictName = candidate;
            districtId = foundDistrictId;
            break;
          }
        }
      }
    }

    // Build full address - include suburb (mahalle) first, then road/name
    const addressParts = [];
    
    // Add suburb (mahalle) first if available
    if (suburbName) {
      addressParts.push(suburbName + (suburbName.toLowerCase().includes('mahallesi') ? '' : ' Mahallesi'));
    }
    
    // Add road or name
    if (result.address?.road) {
      addressParts.push(result.address.road);
    } else if (result.address?.name) {
      addressParts.push(result.address.name);
    }

    // If we have address parts, use them; otherwise use display_name
    const fullAddress = addressParts.length > 0 
      ? addressParts.join(' ')
      : result.display_name;

    return {
      address: fullAddress,
      city: actualCityName || cityName || stateName,
      cityId,
      district: actualDistrictName || suburbName || countyName,
      districtId,
      country: result.address?.country || 'Türkiye',
      postal_code: result.address?.postcode || '',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    };
  } catch (error) {
    console.error('Error parsing LocationIQ result:', error);
    return null;
  }
};

/**
 * Extract city name from LocationIQ result
 */
export const extractCityName = (result: LocationIQAutocompleteResult): string => {
  return result.address?.city || 
         result.address?.county || 
         result.address?.state || 
         '';
};

/**
 * Extract district name from LocationIQ result
 */
export const extractDistrictName = (result: LocationIQAutocompleteResult): string => {
  return result.address?.suburb || 
         result.address?.county || 
         '';
};

/**
 * Extract postal code from LocationIQ result
 */
export const extractPostalCode = (result: LocationIQAutocompleteResult): string => {
  return result.address?.postcode || '';
};

/**
 * Format display name for dropdown/list
 */
export const formatDisplayName = (result: LocationIQAutocompleteResult): string => {
  const parts = [];
  
  if (result.address?.name) parts.push(result.address.name);
  if (result.address?.road) parts.push(result.address.road);
  if (result.address?.suburb) parts.push(result.address.suburb);
  if (result.address?.city) parts.push(result.address.city);
  
  return parts.length > 0 ? parts.join(', ') : result.display_name;
};

