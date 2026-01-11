import { logger } from '@/utils/logger';

interface Province {
  id: number;
  name: string;
  districts: District[];
}

interface District {
  id: number;
  name: string;
  neighborhoods: Neighborhood[];
}

interface Neighborhood {
  id: number;
  name: string;
  postCode: string;
}

interface AddressOption {
  value: string;
  label: string;
  id?: number;
  postalCode?: string;
}

class TurkeyApiService {
  private baseUrl = 'https://turkiyeapi.dev/api/v1';
  private cache = new Map<string, any>();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private getCacheKey(endpoint: string): string {
    return `turkey_api_${endpoint}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheTTL;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private async fetchFromApi<T>(endpoint: string): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint);
    const cached = this.getCache(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`Turkey API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  async getProvinces(): Promise<Province[]> {
    const response = await this.fetchFromApi<{ data: Province[] }>('/provinces');
    return response.data;
  }

  async getDistrictsByProvinceId(provinceId: number): Promise<District[]> {
    const response = await this.fetchFromApi<{ data: District[] }>(`/districts/${provinceId}`);
    return response.data;
  }

  async getNeighborhoodsByDistrictId(districtId: number): Promise<Neighborhood[]> {
    const response = await this.fetchFromApi<{ data: Neighborhood[] }>(`/neighborhoods/${districtId}`);
    return response.data;
  }

  // Helper methods for address form compatibility
  async getCitiesForSelect(): Promise<AddressOption[]> {
    try {
      const provinces = await this.getProvinces();
      return provinces.map(province => ({
        value: province.name,
        label: province.name,
        id: province.id
      }));
    } catch (error) {
      logger.error('Error fetching cities:', error);
      return [];
    }
  }

  async getDistrictsByCityId(cityId: number): Promise<AddressOption[]> {
    try {
      const districts = await this.getDistrictsByProvinceId(cityId);
      return districts.map(district => ({
        value: district.name,
        label: district.name,
        id: district.id
      }));
    } catch (error) {
      logger.error('Error fetching districts for city ID:', cityId, error);
      return [];
    }
  }

  async getNeighborhoodsByDistrictIdForSelect(districtId: number): Promise<AddressOption[]> {
    try {
      const neighborhoods = await this.getNeighborhoodsByDistrictId(districtId);
      return neighborhoods.map(neighborhood => ({
        value: neighborhood.name,
        label: neighborhood.name,
        id: neighborhood.id,
        postalCode: neighborhood.postCode
      }));
    } catch (error) {
      logger.error('Error fetching neighborhoods for district ID:', districtId, error);
      return [];
    }
  }

  // Legacy compatibility methods
  async getDistrictsByCityName(cityName: string): Promise<AddressOption[]> {
    try {
      const provinces = await this.getProvinces();
      const province = provinces.find(p =>
        p.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!province) {
        logger.warn(`Province not found: ${cityName}`);
        return [];
      }

      return this.getDistrictsByCityId(province.id);
    } catch (error) {
      logger.error('Error fetching districts for city:', cityName, error);
      return [];
    }
  }

  async getNeighborhoodsByDistrictName(districtName: string, cityName?: string): Promise<AddressOption[]> {
    try {
      let districtId: number | undefined;

      if (cityName) {
        const districts = await this.getDistrictsByCityName(cityName);
        const district = districts.find(d =>
          d.label.toLowerCase() === districtName.toLowerCase()
        );
        districtId = district?.id;
      } else {
        // Search all provinces for this district name
        const provinces = await this.getProvinces();
        for (const province of provinces) {
          const districts = await this.getDistrictsByCityId(province.id);
          const district = districts.find(d =>
            d.label.toLowerCase() === districtName.toLowerCase()
          );
          if (district) {
            districtId = district.id;
            break;
          }
        }
      }

      if (!districtId) {
        logger.warn(`District not found: ${districtName}`);
        return [];
      }

      return this.getNeighborhoodsByDistrictIdForSelect(districtId);
    } catch (error) {
      logger.error('Error fetching neighborhoods for district:', districtName, error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const turkeyApiService = new TurkeyApiService();
export type { Province, District, Neighborhood, AddressOption };