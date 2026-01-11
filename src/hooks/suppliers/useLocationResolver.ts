import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

/**
 * Location (City/District) çözümleme utility'leri
 * ID <-> Name çevirileri için
 */

export const useLocationResolver = () => {
  // City ID'den name çözme
  const resolveCityName = useCallback(async (cityId: number | null): Promise<string> => {
    if (!cityId) return "";
    try {
      const { data } = await supabase
        .from('turkey_cities')
        .select('name')
        .eq('id', cityId)
        .maybeSingle();
      return data?.name || "";
    } catch (error) {
      logger.error('Error resolving city name:', error);
      return "";
    }
  }, []);

  // District ID'den name çözme
  const resolveDistrictName = useCallback(async (districtId: number | null, cityId: number | null): Promise<string> => {
    if (!districtId || !cityId) return "";
    try {
      const { data } = await supabase
        .from('turkey_districts')
        .select('name')
        .eq('id', districtId)
        .eq('city_id', cityId)
        .maybeSingle();
      return data?.name || "";
    } catch (error) {
      logger.error('Error resolving district name:', error);
      return "";
    }
  }, []);

  // City name'den ID bulma
  const resolveCityId = useCallback(async (cityName: string): Promise<number | null> => {
    if (!cityName) return null;
    try {
      const { data } = await supabase
        .from('turkey_cities')
        .select('id')
        .ilike('name', cityName)
        .maybeSingle();
      return data?.id || null;
    } catch (error) {
      logger.error('Error resolving city ID:', error);
      return null;
    }
  }, []);

  // District name'den ID bulma
  const resolveDistrictId = useCallback(async (districtName: string, cityId: number): Promise<number | null> => {
    if (!districtName || !cityId) return null;
    try {
      const { data } = await supabase
        .from('turkey_districts')
        .select('id')
        .ilike('name', districtName)
        .eq('city_id', cityId)
        .maybeSingle();
      return data?.id || null;
    } catch (error) {
      logger.error('Error resolving district ID:', error);
      return null;
    }
  }, []);

  // City/District string veya ID'yi çöz
  const parseCityDistrict = useCallback(async (city: string, district?: string) => {
    let cityId: number | null = null;
    let districtId: number | null = null;
    let cityName: string | null = null;
    let districtName: string | null = null;

    // City çözümleme
    if (city) {
      const parsedCityId = parseInt(city);
      if (!isNaN(parsedCityId) && city === parsedCityId.toString()) {
        cityId = parsedCityId;
      } else {
        cityName = city;
        cityId = await resolveCityId(city);
      }
    }

    // District çözümleme
    if (district && cityId) {
      const parsedDistrictId = parseInt(district);
      if (!isNaN(parsedDistrictId) && district === parsedDistrictId.toString()) {
        districtId = parsedDistrictId;
      } else {
        districtName = district;
        districtId = await resolveDistrictId(district, cityId);
      }
    } else if (district) {
      districtName = district;
    }

    return { cityId, districtId, cityName, districtName };
  }, [resolveCityId, resolveDistrictId]);

  return {
    resolveCityName,
    resolveDistrictName,
    parseCityDistrict,
  };
};
