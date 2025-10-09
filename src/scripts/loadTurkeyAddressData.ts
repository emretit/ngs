/**
 * Script to load Turkey address data from turkiyeapi.dev into Supabase tables
 * This will populate turkey_cities, turkey_districts, and turkey_neighborhoods
 * with complete data: 81 provinces, 973 districts, and 32,000+ neighborhoods
 */

import { supabase } from '@/integrations/supabase/client';
import { turkeyApiService, Province, District, Neighborhood } from '@/services/turkeyApiService';

interface LoadStats {
  citiesLoaded: number;
  districtsLoaded: number;
  neighborhoodsLoaded: number;
  errors: string[];
}

class TurkeyAddressDataLoader {
  private stats: LoadStats = {
    citiesLoaded: 0,
    districtsLoaded: 0,
    neighborhoodsLoaded: 0,
    errors: []
  };

  async loadAllData(): Promise<LoadStats> {
    console.log('🇹🇷 Starting Turkey address data loading from turkiyeapi.dev...');
    console.log('📊 Expected: 81 provinces, 973 districts, 32,000+ neighborhoods');

    try {
      // Clear existing data
      await this.clearExistingData();

      // Load all provinces
      const provinces = await turkeyApiService.getProvinces();
      console.log(`📍 Found ${provinces.length} provinces from API`);

      // Load each province with its districts and neighborhoods
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
    console.log('🧹 Clearing existing data from tables...');

    try {
      // Delete in reverse order due to foreign key constraints
      const { error: neighError } = await supabase.from('turkey_neighborhoods').delete().neq('id', 0);
      if (neighError) console.warn('Warning clearing neighborhoods:', neighError);

      const { error: distError } = await supabase.from('turkey_districts').delete().neq('id', 0);
      if (distError) console.warn('Warning clearing districts:', distError);

      const { error: cityError } = await supabase.from('turkey_cities').delete().neq('id', 0);
      if (cityError) console.warn('Warning clearing cities:', cityError);

      console.log('✅ Existing data cleared');
    } catch (error) {
      console.error('❌ Error clearing existing data:', error);
      // Continue anyway
    }
  }

  private async loadProvince(province: Province): Promise<void> {
    console.log(`📍 Loading province: ${province.name}`);

    // Insert city (using turkey_cities table)
    const { error: cityError } = await supabase
      .from('turkey_cities')
      .insert({
        id: province.id,
        name: province.name,
        code: province.id.toString().padStart(2, '0')
      });

    if (cityError) {
      throw new Error(`Failed to insert city: ${cityError.message}`);
    }

    this.stats.citiesLoaded++;

    // Load districts for this province
    console.log(`  📋 Loading districts for ${province.name}...`);
    const districts = await turkeyApiService.getDistrictsByProvinceId(province.id);
    console.log(`  📋 Found ${districts.length} districts`);

    for (const district of districts) {
      try {
        await this.loadDistrict(district, province.id);
      } catch (error) {
        this.stats.errors.push(`Error loading district ${district.name} in ${province.name}: ${error}`);
        console.error(`❌ Error loading district ${district.name}:`, error);
      }
    }
  }

  private async loadDistrict(district: District, cityId: number): Promise<void> {
    // Insert district
    const { error: districtError } = await supabase
      .from('turkey_districts')
      .insert({
        id: district.id,
        name: district.name,
        city_id: cityId
      });

    if (districtError) {
      throw new Error(`Failed to insert district: ${districtError.message}`);
    }

    this.stats.districtsLoaded++;

    // Load neighborhoods for this district
    const neighborhoods = await turkeyApiService.getNeighborhoodsByDistrictId(district.id);
    
    if (neighborhoods.length > 0) {
      console.log(`    🏘️  Loading ${neighborhoods.length} neighborhoods for ${district.name}`);
    }

    for (const neighborhood of neighborhoods) {
      try {
        await this.loadNeighborhood(neighborhood, district.id);
      } catch (error) {
        this.stats.errors.push(`Error loading neighborhood ${neighborhood.name} in ${district.name}: ${error}`);
        console.error(`❌ Error loading neighborhood ${neighborhood.name}:`, error);
      }
    }
  }

  private async loadNeighborhood(neighborhood: Neighborhood, districtId: number): Promise<void> {
    // Insert neighborhood
    const { error: neighborhoodError } = await supabase
      .from('turkey_neighborhoods')
      .insert({
        id: neighborhood.id,
        name: neighborhood.name,
        district_id: districtId,
        postal_code: neighborhood.postCode || null
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
          provinces_count: this.stats.citiesLoaded,
          districts_count: this.stats.districtsLoaded,
          neighborhoods_count: this.stats.neighborhoodsLoaded,
          error_message: this.stats.errors.length > 0 ? this.stats.errors.slice(0, 10).join('; ') : null
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

  private printStats(): void {
    console.log('\n📊 Loading Statistics:');
    console.log(`✅ Cities loaded: ${this.stats.citiesLoaded} / 81`);
    console.log(`✅ Districts loaded: ${this.stats.districtsLoaded} / 973`);
    console.log(`✅ Neighborhoods loaded: ${this.stats.neighborhoodsLoaded} / ~32,000`);

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors encountered: ${this.stats.errors.length}`);
      console.log('First 10 errors:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('🎉 No errors encountered!');
    }
  }

  async checkDataStatus(): Promise<{ hasData: boolean; counts: any }> {
    try {
      const [citiesResult, districtsResult, neighborhoodsResult, syncResult] = await Promise.all([
        supabase.from('turkey_cities').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_districts').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_neighborhoods').select('*', { count: 'exact', head: true }),
        supabase.from('turkey_address_sync').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      const counts = {
        cities: citiesResult.count || 0,
        districts: districtsResult.count || 0,
        neighborhoods: neighborhoodsResult.count || 0,
        lastSync: syncResult.data?.last_sync_date || null,
        syncStatus: syncResult.data?.sync_status || null
      };

      const hasData = counts.cities > 0 && counts.districts > 0 && counts.neighborhoods > 0;

      console.log('📊 Current database status:', counts);

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