/**
 * Script to load Turkey address data from the external API into Supabase tables
 * This script should be run once to populate the local database with address data
 */

import { supabase } from '@/integrations/supabase/client';
import { turkeyApiService } from '@/services/turkeyApiService';

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

interface LoadStats {
  provincesLoaded: number;
  districtsLoaded: number;
  neighborhoodsLoaded: number;
  errors: string[];
}

class TurkeyAddressDataLoader {
  private stats: LoadStats = {
    provincesLoaded: 0,
    districtsLoaded: 0,
    neighborhoodsLoaded: 0,
    errors: []
  };

  async loadAllData(): Promise<LoadStats> {
    console.log('🇹🇷 Starting Turkey address data loading...');

    try {
      // Clear existing data
      await this.clearExistingData();

      // Load provinces from API
      const provinces = await turkeyApiService.getProvinces();
      console.log(`📍 Found ${provinces.length} provinces to load`);

      // Load provinces into database
      for (const province of provinces) {
        try {
          await this.loadProvince(province);
        } catch (error) {
          this.stats.errors.push(`Error loading province ${province.name}: ${error}`);
          console.error(`❌ Error loading province ${province.name}:`, error);
        }
      }

      // Update sync status
      await this.updateSyncStatus();

    } catch (error) {
      this.stats.errors.push(`General error: ${error}`);
      console.error('❌ General error during data loading:', error);
    }

    this.printStats();
    return this.stats;
  }

  private async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing data...');

    try {
      // Delete in reverse order due to foreign key constraints
      await supabase.from('turkey_neighborhoods').delete().neq('id', 0);
      await supabase.from('turkey_districts').delete().neq('id', 0);
      await supabase.from('turkey_provinces').delete().neq('id', 0);

      console.log('✅ Existing data cleared');
    } catch (error) {
      console.error('❌ Error clearing existing data:', error);
      throw error;
    }
  }

  private async loadProvince(province: Province): Promise<void> {
    console.log(`📍 Loading province: ${province.name}`);

    // Insert province
    const { data: provinceData, error: provinceError } = await supabase
      .from('turkey_provinces')
      .insert({
        id: province.id,
        name: province.name,
        area_code: province.id.toString().padStart(2, '0'),
        is_metropolitan: this.isMetropolitanCity(province.name)
      })
      .select()
      .single();

    if (provinceError) {
      throw new Error(`Failed to insert province: ${provinceError.message}`);
    }

    this.stats.provincesLoaded++;

    // Load districts for this province
    const districts = await turkeyApiService.getDistrictsByProvinceId(province.id);

    for (const district of districts) {
      try {
        await this.loadDistrict(district, province.id);
      } catch (error) {
        this.stats.errors.push(`Error loading district ${district.name} in ${province.name}: ${error}`);
        console.error(`❌ Error loading district ${district.name}:`, error);
      }
    }
  }

  private async loadDistrict(district: District, provinceId: number): Promise<void> {
    // Insert district
    const { data: districtData, error: districtError } = await supabase
      .from('turkey_districts')
      .insert({
        id: district.id,
        name: district.name,
        province_id: provinceId,
        population: null // Will be updated if population data is available
      })
      .select()
      .single();

    if (districtError) {
      throw new Error(`Failed to insert district: ${districtError.message}`);
    }

    this.stats.districtsLoaded++;

    // Load neighborhoods for this district
    const neighborhoods = await turkeyApiService.getNeighborhoodsByDistrictId(district.id);

    for (const neighborhood of neighborhoods) {
      try {
        await this.loadNeighborhood(neighborhood, district.id, provinceId);
      } catch (error) {
        this.stats.errors.push(`Error loading neighborhood ${neighborhood.name} in ${district.name}: ${error}`);
        console.error(`❌ Error loading neighborhood ${neighborhood.name}:`, error);
      }
    }
  }

  private async loadNeighborhood(neighborhood: Neighborhood, districtId: number, provinceId: number): Promise<void> {
    // Insert neighborhood
    const { error: neighborhoodError } = await supabase
      .from('turkey_neighborhoods')
      .insert({
        id: neighborhood.id,
        name: neighborhood.name,
        district_id: districtId,
        province_id: provinceId,
        postal_code: neighborhood.postCode,
        population: null // Will be updated if population data is available
      });

    if (neighborhoodError) {
      throw new Error(`Failed to insert neighborhood: ${neighborhoodError.message}`);
    }

    this.stats.neighborhoodsLoaded++;
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      const { error } = await supabase
        .from('turkey_address_sync')
        .insert({
          last_sync_date: new Date().toISOString(),
          sync_status: this.stats.errors.length > 0 ? 'completed_with_errors' : 'completed',
          provinces_count: this.stats.provincesLoaded,
          districts_count: this.stats.districtsLoaded,
          neighborhoods_count: this.stats.neighborhoodsLoaded,
          error_message: this.stats.errors.length > 0 ? this.stats.errors.join('; ') : null
        });

      if (error) {
        console.error('❌ Error updating sync status:', error);
      } else {
        console.log('✅ Sync status updated');
      }
    } catch (error) {
      console.error('❌ Error updating sync status:', error);
    }
  }

  private isMetropolitanCity(cityName: string): boolean {
    const metropolitanCities = [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana',
      'Konya', 'Şanlıurfa', 'Gaziantep', 'Kocaeli', 'Mersin',
      'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun',
      'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Denizli',
      'Şahinbey', 'Adapazarı', 'Malatya', 'Erzurum', 'Trabzon',
      'Ordu', 'Muğla', 'Eskişehir', 'Tekirdağ'
    ];

    return metropolitanCities.includes(cityName);
  }

  private printStats(): void {
    console.log('\n📊 Loading Statistics:');
    console.log(`✅ Provinces loaded: ${this.stats.provincesLoaded}`);
    console.log(`✅ Districts loaded: ${this.stats.districtsLoaded}`);
    console.log(`✅ Neighborhoods loaded: ${this.stats.neighborhoodsLoaded}`);

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors encountered: ${this.stats.errors.length}`);
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('🎉 No errors encountered!');
    }
  }

  async checkDataStatus(): Promise<{ hasData: boolean; counts: any }> {
    try {
      const [provincesResult, districtsResult, neighborhoodsResult, syncResult] = await Promise.all([
        supabase.from('turkey_provinces').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_districts').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_neighborhoods').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_address_sync').select('*').order('created_at', { ascending: false }).limit(1).single()
      ]);

      const counts = {
        provinces: provincesResult.count || 0,
        districts: districtsResult.count || 0,
        neighborhoods: neighborhoodsResult.count || 0,
        lastSync: syncResult.data?.last_sync_date || null,
        syncStatus: syncResult.data?.sync_status || null
      };

      const hasData = counts.provinces > 0 && counts.districts > 0 && counts.neighborhoods > 0;

      return { hasData, counts };
    } catch (error) {
      console.error('Error checking data status:', error);
      return { hasData: false, counts: {} };
    }
  }
}

// Export the loader instance
export const turkeyAddressLoader = new TurkeyAddressDataLoader();

// Main function for running the script
export async function loadTurkeyAddressData(): Promise<LoadStats> {
  return await turkeyAddressLoader.loadAllData();
}

// Check if data already exists
export async function checkTurkeyAddressData() {
  return await turkeyAddressLoader.checkDataStatus();
}

// Usage example:
// import { loadTurkeyAddressData, checkTurkeyAddressData } from '@/scripts/loadTurkeyAddressData';
//
// // Check if data exists
// const status = await checkTurkeyAddressData();
// console.log('Data status:', status);
//
// // Load data if needed
// if (!status.hasData) {
//   const result = await loadTurkeyAddressData();
//   console.log('Load result:', result);
// }