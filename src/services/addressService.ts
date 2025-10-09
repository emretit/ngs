import { supabase } from '@/integrations/supabase/client';

export interface City {
  id: number;
  name: string;
  code?: string;
}

export interface District {
  id: number;
  city_id: number;
  name: string;
}

export interface Neighborhood {
  id: number;
  district_id: number;
  name: string;
  postal_code?: string;
}

export interface AddressOption {
  value: string;
  label: string;
  postalCode?: string;
}

export interface SavedAddress {
  id?: string;
  entity_id?: string;
  entity_type?: string;
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  address_detail: string;
  postal_code: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  created_at?: string;
  updated_at?: string;
}

class AddressService {
  // Şehirleri getir
  async getCities(): Promise<AddressOption[]> {
    try {
      const { data, error } = await supabase
        .from('turkey_cities')
        .select('id, name, code')
        .order('name');

      if (error) throw error;

      return data?.map(city => ({
        value: city.name,
        label: city.name,
        postalCode: city.code
      })) || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  // Şehre göre ilçeleri getir
  async getDistrictsByCity(cityName: string): Promise<AddressOption[]> {
    try {
      const { data, error } = await supabase
        .from('turkey_districts')
        .select(`
          id,
          name,
          turkey_cities!inner(name)
        `)
        .eq('turkey_cities.name', cityName)
        .order('name');

      if (error) throw error;

      return data?.map(district => ({
        value: district.name,
        label: district.name
      })) || [];
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  }

  // İlçeye göre mahalleleri getir
  async getNeighborhoodsByDistrict(districtName: string): Promise<AddressOption[]> {
    try {
      const { data, error } = await supabase
        .from('turkey_neighborhoods')
        .select(`
          id,
          name,
          postal_code,
          turkey_districts!inner(name)
        `)
        .eq('turkey_districts.name', districtName)
        .order('name');

      if (error) throw error;

      return data?.map(neighborhood => ({
        value: neighborhood.name,
        label: neighborhood.name,
        postalCode: neighborhood.postal_code
      })) || [];
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      return [];
    }
  }

  // Şehir ve ilçeye göre mahalleleri getir (daha spesifik arama)
  async getNeighborhoodsByCityAndDistrict(cityName: string, districtName: string): Promise<AddressOption[]> {
    try {
      const { data, error } = await supabase
        .from('turkey_neighborhoods')
        .select(`
          id,
          name,
          postal_code,
          turkey_districts!inner(
            name,
            turkey_cities!inner(name)
          )
        `)
        .eq('turkey_districts.turkey_cities.name', cityName)
        .eq('turkey_districts.name', districtName)
        .order('name');

      if (error) throw error;

      return data?.map(neighborhood => ({
        value: neighborhood.name,
        label: neighborhood.name,
        postalCode: neighborhood.postal_code
      })) || [];
    } catch (error) {
      console.error('Error fetching neighborhoods by city and district:', error);
      return [];
    }
  }

  // Posta koduna göre mahalle ara
  async getNeighborhoodByPostalCode(postalCode: string): Promise<AddressOption | null> {
    try {
      const { data, error } = await supabase
        .from('turkey_neighborhoods')
        .select(`
          id,
          name,
          postal_code,
          turkey_districts!inner(
            name,
            turkey_cities!inner(name)
          )
        `)
        .eq('postal_code', postalCode)
        .single();

      if (error) throw error;

      return data ? {
        value: data.name,
        label: data.name,
        postalCode: data.postal_code
      } : null;
    } catch (error) {
      console.error('Error fetching neighborhood by postal code:', error);
      return null;
    }
  }

  // Veri yükleme durumunu kontrol et
  async isDataLoaded(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('turkey_cities')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking data load status:', error);
      return false;
    }
  }

  // Toplam veri sayılarını getir
  async getDataCounts(): Promise<{ cities: number; districts: number; neighborhoods: number }> {
    try {
      const [citiesResult, districtsResult, neighborhoodsResult] = await Promise.all([
        supabase.from('turkey_cities').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_districts').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_neighborhoods').select('*', { count: 'exact', head: true })
      ]);

      return {
        cities: citiesResult.count || 0,
        districts: districtsResult.count || 0,
        neighborhoods: neighborhoodsResult.count || 0
      };
    } catch (error) {
      console.error('Error getting data counts:', error);
      return { cities: 0, districts: 0, neighborhoods: 0 };
    }
  }

  // Adres kaydetme
  async saveAddress(address: SavedAddress): Promise<{ data: SavedAddress | null; error: any }> {
    try {
      const addressData = {
        entity_id: address.entity_id,
        entity_type: address.entity_type,
        country: address.country,
        city: address.city,
        district: address.district,
        neighborhood: address.neighborhood,
        address_detail: address.address_detail,
        postal_code: address.postal_code,
        coordinates: address.coordinates ? JSON.stringify(address.coordinates) : null
      };

      if (address.id) {
        // Güncelleme
        const { data, error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', address.id)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } else {
        // Yeni kayıt
        const { data, error } = await supabase
          .from('addresses')
          .insert(addressData)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error saving address:', error);
      return { data: null, error };
    }
  }

  // Adresleri getir
  async getAddresses(entityId?: string, entityType?: string): Promise<SavedAddress[]> {
    try {
      let query = supabase.from('addresses').select('*');

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(addr => ({
        ...addr,
        coordinates: addr.coordinates ? JSON.parse(addr.coordinates) : undefined
      })) || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  }

  // Adres sil
  async deleteAddress(addressId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting address:', error);
      return { success: false, error };
    }
  }

  // Entity için ana adresi getir
  async getPrimaryAddress(entityId: string, entityType: string): Promise<SavedAddress | null> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (!data) {
        // Eğer primary adres yoksa, ilk adresi döndür
        const { data: firstAddress, error: firstError } = await supabase
          .from('addresses')
          .select('*')
          .eq('entity_id', entityId)
          .eq('entity_type', entityType)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (firstError && firstError.code !== 'PGRST116') {
          throw firstError;
        }

        return firstAddress ? {
          ...firstAddress,
          coordinates: firstAddress.coordinates ? JSON.parse(firstAddress.coordinates) : undefined
        } : null;
      }

      return {
        ...data,
        coordinates: data.coordinates ? JSON.parse(data.coordinates) : undefined
      };
    } catch (error) {
      console.error('Error fetching primary address:', error);
      return null;
    }
  }

  // Ana adres olarak işaretle
  async setPrimaryAddress(addressId: string, entityId: string, entityType: string): Promise<{ success: boolean; error?: any }> {
    try {
      // Önce tüm adreslerin primary durumunu kaldır
      await supabase
        .from('addresses')
        .update({ is_primary: false })
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      // Seçilen adresi primary yap
      const { error } = await supabase
        .from('addresses')
        .update({ is_primary: true })
        .eq('id', addressId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error setting primary address:', error);
      return { success: false, error };
    }
  }

  // Koordinat güncelleme (Google Maps/OpenStreetMap entegrasyonu için)
  async updateAddressCoordinates(
    addressId: string,
    coordinates: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({
          coordinates: JSON.stringify(coordinates),
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating address coordinates:', error);
      return { success: false, error };
    }
  }

  // Koordinatlara göre adres arama (yakın adresler)
  async findNearbyAddresses(
    latitude: number,
    longitude: number,
    radiusKm: number = 1
  ): Promise<SavedAddress[]> {
    try {
      // Bu bir basit implementasyon. Gerçek uygulamada PostGIS kullanılabilir.
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .not('coordinates', 'is', null);

      if (error) throw error;

      const addressesWithDistance = data?.map(addr => {
        const coords = JSON.parse(addr.coordinates || '{}');
        if (coords.latitude && coords.longitude) {
          const distance = this.calculateDistance(
            latitude, longitude,
            coords.latitude, coords.longitude
          );
          return {
            ...addr,
            coordinates: coords,
            distance
          };
        }
        return null;
      }).filter(addr => addr && addr.distance <= radiusKm) || [];

      return addressesWithDistance.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby addresses:', error);
      return [];
    }
  }

  // İki koordinat arasındaki mesafeyi hesapla (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const addressService = new AddressService();
