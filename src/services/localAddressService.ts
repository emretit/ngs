import turkeyAddressData from '@/data/turkey-address-data.json';

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
  postalCode: string;
}

interface AddressOption {
  value: string;
  label: string;
  id?: number;
  postalCode?: string;
}

class LocalAddressService {
  private provinces: Province[] = turkeyAddressData as Province[];
  private provinceMap: Map<number, Province>;
  private districtMap: Map<number, District>;
  private provinceNameMap: Map<string, Province>;

  constructor() {
    // İndeksleme ile hızlı erişim için Map oluştur
    this.provinceMap = new Map();
    this.districtMap = new Map();
    this.provinceNameMap = new Map();

    this.provinces.forEach(province => {
      this.provinceMap.set(province.id, province);
      this.provinceNameMap.set(province.name.toLowerCase(), province);

      province.districts.forEach(district => {
        this.districtMap.set(district.id, district);
      });
    });
  }

  // Tüm illeri getir
  getCitiesForSelect(): AddressOption[] {
    return this.provinces
      .map(province => ({
        value: province.name,
        label: province.name,
        id: province.id
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }

  // İl ID'sine göre ilçeleri getir
  getDistrictsByCityId(cityId: number): AddressOption[] {
    const province = this.provinceMap.get(cityId);
    if (!province) return [];

    return province.districts
      .map(district => ({
        value: district.name,
        label: district.name,
        id: district.id
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }

  // İl adına göre ilçeleri getir
  getDistrictsByCityName(cityName: string): AddressOption[] {
    const province = this.provinceNameMap.get(cityName.toLowerCase());
    if (!province) return [];

    return this.getDistrictsByCityId(province.id);
  }

  // İlçe ID'sine göre mahalleleri getir
  getNeighborhoodsByDistrictIdForSelect(districtId: number): AddressOption[] {
    const district = this.districtMap.get(districtId);
    if (!district) return [];

    return district.neighborhoods
      .map(neighborhood => ({
        value: neighborhood.name,
        label: neighborhood.name,
        id: neighborhood.id,
        postalCode: neighborhood.postalCode
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }

  // İlçe adına göre mahalleleri getir
  getNeighborhoodsByDistrictName(districtName: string, cityName?: string): AddressOption[] {
    let targetDistrict: District | undefined;

    if (cityName) {
      const province = this.provinceNameMap.get(cityName.toLowerCase());
      if (province) {
        targetDistrict = province.districts.find(
          d => d.name.toLowerCase() === districtName.toLowerCase()
        );
      }
    } else {
      // Tüm iller içinde ara
      for (const province of this.provinces) {
        targetDistrict = province.districts.find(
          d => d.name.toLowerCase() === districtName.toLowerCase()
        );
        if (targetDistrict) break;
      }
    }

    if (!targetDistrict) return [];

    return this.getNeighborhoodsByDistrictIdForSelect(targetDistrict.id);
  }

  // İl sayısını getir
  getCityCount(): number {
    return this.provinces.length;
  }

  // Toplam ilçe sayısını getir
  getDistrictCount(): number {
    return this.provinces.reduce((sum, province) => sum + province.districts.length, 0);
  }

  // Toplam mahalle sayısını getir
  getNeighborhoodCount(): number {
    return this.provinces.reduce((sum, province) => 
      sum + province.districts.reduce((dSum, district) => 
        dSum + district.neighborhoods.length, 0
      ), 0
    );
  }

  // İstatistikleri getir
  getStats() {
    return {
      cities: this.getCityCount(),
      districts: this.getDistrictCount(),
      neighborhoods: this.getNeighborhoodCount()
    };
  }
}

export const localAddressService = new LocalAddressService();
export type { Province, District, Neighborhood, AddressOption };
