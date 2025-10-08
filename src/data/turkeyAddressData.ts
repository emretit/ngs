// Turkey Address Data - Optimized with dynamic loading
export const countries = [
  { value: "Turkey", label: "Türkiye" },
  { value: "USA", label: "Amerika Birleşik Devletleri" },
  { value: "Germany", label: "Almanya" },
  { value: "France", label: "Fransa" },
  { value: "UK", label: "İngiltere" }
];

export interface TurkeyNeighborhood {
  name: string;
  code: string;
}

export interface TurkeyDistrict {
  name: string;
  neighborhoods: TurkeyNeighborhood[];
}

export interface TurkeyCounty {
  name: string;
  districts: TurkeyDistrict[];
}

export interface TurkeyCity {
  name: string;
  counties: TurkeyCounty[];
}

// Turkish Cities - All 81 cities
export const turkishCities = [
  { value: "Adana", label: "Adana" },
  { value: "Adıyaman", label: "Adıyaman" },
  { value: "Afyonkarahisar", label: "Afyonkarahisar" },
  { value: "Ağrı", label: "Ağrı" },
  { value: "Aksaray", label: "Aksaray" },
  { value: "Amasya", label: "Amasya" },
  { value: "Ankara", label: "Ankara" },
  { value: "Antalya", label: "Antalya" },
  { value: "Ardahan", label: "Ardahan" },
  { value: "Artvin", label: "Artvin" },
  { value: "Aydın", label: "Aydın" },
  { value: "Balıkesir", label: "Balıkesir" },
  { value: "Bartın", label: "Bartın" },
  { value: "Batman", label: "Batman" },
  { value: "Bayburt", label: "Bayburt" },
  { value: "Bilecik", label: "Bilecik" },
  { value: "Bingöl", label: "Bingöl" },
  { value: "Bitlis", label: "Bitlis" },
  { value: "Bolu", label: "Bolu" },
  { value: "Burdur", label: "Burdur" },
  { value: "Bursa", label: "Bursa" },
  { value: "Çanakkale", label: "Çanakkale" },
  { value: "Çankırı", label: "Çankırı" },
  { value: "Çorum", label: "Çorum" },
  { value: "Denizli", label: "Denizli" },
  { value: "Diyarbakır", label: "Diyarbakır" },
  { value: "Düzce", label: "Düzce" },
  { value: "Edirne", label: "Edirne" },
  { value: "Elazığ", label: "Elazığ" },
  { value: "Erzincan", label: "Erzincan" },
  { value: "Erzurum", label: "Erzurum" },
  { value: "Eskişehir", label: "Eskişehir" },
  { value: "Gaziantep", label: "Gaziantep" },
  { value: "Giresun", label: "Giresun" },
  { value: "Gümüşhane", label: "Gümüşhane" },
  { value: "Hakkâri", label: "Hakkâri" },
  { value: "Hatay", label: "Hatay" },
  { value: "Iğdır", label: "Iğdır" },
  { value: "Isparta", label: "Isparta" },
  { value: "İstanbul", label: "İstanbul" },
  { value: "İzmir", label: "İzmir" },
  { value: "Kahramanmaraş", label: "Kahramanmaraş" },
  { value: "Karabük", label: "Karabük" },
  { value: "Karaman", label: "Karaman" },
  { value: "Kars", label: "Kars" },
  { value: "Kastamonu", label: "Kastamonu" },
  { value: "Kayseri", label: "Kayseri" },
  { value: "Kilis", label: "Kilis" },
  { value: "Kırıkkale", label: "Kırıkkale" },
  { value: "Kırklareli", label: "Kırklareli" },
  { value: "Kırşehir", label: "Kırşehir" },
  { value: "Kocaeli", label: "Kocaeli" },
  { value: "Konya", label: "Konya" },
  { value: "Kütahya", label: "Kütahya" },
  { value: "Malatya", label: "Malatya" },
  { value: "Manisa", label: "Manisa" },
  { value: "Mardin", label: "Mardin" },
  { value: "Mersin", label: "Mersin" },
  { value: "Muğla", label: "Muğla" },
  { value: "Muş", label: "Muş" },
  { value: "Nevşehir", label: "Nevşehir" },
  { value: "Niğde", label: "Niğde" },
  { value: "Ordu", label: "Ordu" },
  { value: "Osmaniye", label: "Osmaniye" },
  { value: "Rize", label: "Rize" },
  { value: "Sakarya", label: "Sakarya" },
  { value: "Samsun", label: "Samsun" },
  { value: "Şanlıurfa", label: "Şanlıurfa" },
  { value: "Siirt", label: "Siirt" },
  { value: "Sinop", label: "Sinop" },
  { value: "Sivas", label: "Sivas" },
  { value: "Şırnak", label: "Şırnak" },
  { value: "Tekirdağ", label: "Tekirdağ" },
  { value: "Tokat", label: "Tokat" },
  { value: "Trabzon", label: "Trabzon" },
  { value: "Tunceli", label: "Tunceli" },
  { value: "Uşak", label: "Uşak" },
  { value: "Van", label: "Van" },
  { value: "Yalova", label: "Yalova" },
  { value: "Yozgat", label: "Yozgat" },
  { value: "Zonguldak", label: "Zonguldak" }
];

// Dynamic data loading for districts and neighborhoods
const addressDataCache = new Map<string, any>();

// API endpoint for Turkish address data
const TURKEY_ADDRESS_API = 'https://raw.githubusercontent.com/hsndmr/turkiye-city-county-district-neighborhood/main/data.json';

// Load districts for a specific city
export const getDistrictsByCity = async (cityName: string): Promise<Array<{ value: string; label: string; }>> => {
  const cacheKey = `districts_${cityName}`;

  if (addressDataCache.has(cacheKey)) {
    return addressDataCache.get(cacheKey);
  }

  try {
    if (!addressDataCache.has('fullData')) {
      const response = await fetch(TURKEY_ADDRESS_API);
      const fullData = await response.json();
      addressDataCache.set('fullData', fullData);
    }

    const fullData = addressDataCache.get('fullData');
    const city = fullData.find((c: any) =>
      c.name.toLowerCase() === cityName.toLowerCase() ||
      c.name.toUpperCase() === cityName.toUpperCase()
    );

    if (!city) return [];

    const districts = city.counties.flatMap((county: any) =>
      county.districts.map((district: any) => ({
        value: district.name,
        label: district.name
      }))
    );

    // Remove duplicates and sort
    const uniqueDistricts = Array.from(
      new Map(districts.map((d: any) => [d.value, d])).values()
    ).sort((a, b) => a.label.localeCompare(b.label, 'tr'));

    addressDataCache.set(cacheKey, uniqueDistricts);
    return uniqueDistricts;
  } catch (error) {
    console.error('Error loading districts:', error);
    return [];
  }
};

// Load neighborhoods for a specific city and district
export const getNeighborhoodsByDistrict = async (
  cityName: string,
  districtName: string
): Promise<Array<{ value: string; label: string; postalCode: string; }>> => {
  const cacheKey = `neighborhoods_${cityName}_${districtName}`;

  if (addressDataCache.has(cacheKey)) {
    return addressDataCache.get(cacheKey);
  }

  try {
    if (!addressDataCache.has('fullData')) {
      const response = await fetch(TURKEY_ADDRESS_API);
      const fullData = await response.json();
      addressDataCache.set('fullData', fullData);
    }

    const fullData = addressDataCache.get('fullData');
    const city = fullData.find((c: any) =>
      c.name.toLowerCase() === cityName.toLowerCase() ||
      c.name.toUpperCase() === cityName.toUpperCase()
    );

    if (!city) return [];

    const neighborhoods: Array<{ value: string; label: string; postalCode: string; }> = [];

    city.counties.forEach((county: any) => {
      const district = county.districts.find((d: any) =>
        d.name.toLowerCase() === districtName.toLowerCase() ||
        d.name.toUpperCase() === districtName.toUpperCase()
      );

      if (district) {
        district.neighborhoods.forEach((neighborhood: any) => {
          neighborhoods.push({
            value: neighborhood.name,
            label: neighborhood.name,
            postalCode: neighborhood.code
          });
        });
      }
    });

    // Sort neighborhoods
    neighborhoods.sort((a, b) => a.label.localeCompare(b.label, 'tr'));

    addressDataCache.set(cacheKey, neighborhoods);
    return neighborhoods;
  } catch (error) {
    console.error('Error loading neighborhoods:', error);
    return [];
  }
};

// Synchronous fallback data for major cities (for initial load)
export const turkishDistricts: Record<string, Array<{ value: string; label: string; }>> = {
  "İstanbul": [
    { value: "Adalar", label: "Adalar" },
    { value: "Arnavutköy", label: "Arnavutköy" },
    { value: "Ataşehir", label: "Ataşehir" },
    { value: "Avcılar", label: "Avcılar" },
    { value: "Bağcılar", label: "Bağcılar" },
    { value: "Bahçelievler", label: "Bahçelievler" },
    { value: "Bakırköy", label: "Bakırköy" },
    { value: "Başakşehir", label: "Başakşehir" },
    { value: "Bayrampaşa", label: "Bayrampaşa" },
    { value: "Beşiktaş", label: "Beşiktaş" },
    { value: "Beykoz", label: "Beykoz" },
    { value: "Beylikdüzü", label: "Beylikdüzü" },
    { value: "Beyoğlu", label: "Beyoğlu" },
    { value: "Büyükçekmece", label: "Büyükçekmece" },
    { value: "Çatalca", label: "Çatalca" },
    { value: "Çekmeköy", label: "Çekmeköy" },
    { value: "Esenler", label: "Esenler" },
    { value: "Esenyurt", label: "Esenyurt" },
    { value: "Eyüpsultan", label: "Eyüpsultan" },
    { value: "Fatih", label: "Fatih" },
    { value: "Gaziosmanpaşa", label: "Gaziosmanpaşa" },
    { value: "Güngören", label: "Güngören" },
    { value: "Kadıköy", label: "Kadıköy" },
    { value: "Kağıthane", label: "Kağıthane" },
    { value: "Kartal", label: "Kartal" },
    { value: "Küçükçekmece", label: "Küçükçekmece" },
    { value: "Maltepe", label: "Maltepe" },
    { value: "Pendik", label: "Pendik" },
    { value: "Sancaktepe", label: "Sancaktepe" },
    { value: "Sarıyer", label: "Sarıyer" },
    { value: "Silivri", label: "Silivri" },
    { value: "Şile", label: "Şile" },
    { value: "Şişli", label: "Şişli" },
    { value: "Sultangazi", label: "Sultangazi" },
    { value: "Sultanbeyli", label: "Sultanbeyli" },
    { value: "Tuzla", label: "Tuzla" },
    { value: "Ümraniye", label: "Ümraniye" },
    { value: "Üsküdar", label: "Üsküdar" },
    { value: "Zeytinburnu", label: "Zeytinburnu" }
  ],
  "Ankara": [
    { value: "Akyurt", label: "Akyurt" },
    { value: "Altındağ", label: "Altındağ" },
    { value: "Ayaş", label: "Ayaş" },
    { value: "Bala", label: "Bala" },
    { value: "Beypazarı", label: "Beypazarı" },
    { value: "Çamlıdere", label: "Çamlıdere" },
    { value: "Çankaya", label: "Çankaya" },
    { value: "Çubuk", label: "Çubuk" },
    { value: "Elmadağ", label: "Elmadağ" },
    { value: "Etimesgut", label: "Etimesgut" },
    { value: "Evren", label: "Evren" },
    { value: "Gölbaşı", label: "Gölbaşı" },
    { value: "Güdül", label: "Güdül" },
    { value: "Haymana", label: "Haymana" },
    { value: "Kahramankazan", label: "Kahramankazan" },
    { value: "Kalecik", label: "Kalecik" },
    { value: "Keçiören", label: "Keçiören" },
    { value: "Kızılcahamam", label: "Kızılcahamam" },
    { value: "Mamak", label: "Mamak" },
    { value: "Nallıhan", label: "Nallıhan" },
    { value: "Polatlı", label: "Polatlı" },
    { value: "Pursaklar", label: "Pursaklar" },
    { value: "Sincan", label: "Sincan" },
    { value: "Şereflikoçhisar", label: "Şereflikoçhisar" },
    { value: "Yenimahalle", label: "Yenimahalle" }
  ],
  "İzmir": [
    { value: "Aliağa", label: "Aliağa" },
    { value: "Balçova", label: "Balçova" },
    { value: "Bayındır", label: "Bayındır" },
    { value: "Bayraklı", label: "Bayraklı" },
    { value: "Bergama", label: "Bergama" },
    { value: "Beydağ", label: "Beydağ" },
    { value: "Bornova", label: "Bornova" },
    { value: "Buca", label: "Buca" },
    { value: "Çeşme", label: "Çeşme" },
    { value: "Çiğli", label: "Çiğli" },
    { value: "Dikili", label: "Dikili" },
    { value: "Foça", label: "Foça" },
    { value: "Gaziemir", label: "Gaziemir" },
    { value: "Güzelbahçe", label: "Güzelbahçe" },
    { value: "Karabağlar", label: "Karabağlar" },
    { value: "Karaburun", label: "Karaburun" },
    { value: "Karşıyaka", label: "Karşıyaka" },
    { value: "Kemalpaşa", label: "Kemalpaşa" },
    { value: "Kınık", label: "Kınık" },
    { value: "Kiraz", label: "Kiraz" },
    { value: "Konak", label: "Konak" },
    { value: "Menderes", label: "Menderes" },
    { value: "Menemen", label: "Menemen" },
    { value: "Narlıdere", label: "Narlıdere" },
    { value: "Ödemiş", label: "Ödemiş" },
    { value: "Seferihisar", label: "Seferihisar" },
    { value: "Selçuk", label: "Selçuk" },
    { value: "Tire", label: "Tire" },
    { value: "Torbalı", label: "Torbalı" },
    { value: "Urla", label: "Urla" }
  ]
};

// Fallback neighborhood data for major districts
export const turkishNeighborhoods: Record<string, Array<{ value: string; label: string; postalCode: string; }>> = {
  "Kadıköy": [
    { value: "19 Mayıs", label: "19 Mayıs", postalCode: "34736" },
    { value: "Acıbadem", label: "Acıbadem", postalCode: "34718" },
    { value: "Bostancı", label: "Bostancı", postalCode: "34744" },
    { value: "Caferağa", label: "Caferağa", postalCode: "34710" },
    { value: "Caddebostan", label: "Caddebostan", postalCode: "34728" },
    { value: "Erenköy", label: "Erenköy", postalCode: "34738" },
    { value: "Fenerbahçe", label: "Fenerbahçe", postalCode: "34726" },
    { value: "Feneryolu", label: "Feneryolu", postalCode: "34724" },
    { value: "Fikirtepe", label: "Fikirtepe", postalCode: "34720" },
    { value: "Göztepe", label: "Göztepe", postalCode: "34730" },
    { value: "Hasanpaşa", label: "Hasanpaşa", postalCode: "34722" },
    { value: "İçerenköy", label: "İçerenköy", postalCode: "34752" },
    { value: "Koşuyolu", label: "Koşuyolu", postalCode: "34718" },
    { value: "Kozyatağı", label: "Kozyatağı", postalCode: "34742" },
    { value: "Merdivenköy", label: "Merdivenköy", postalCode: "34732" },
    { value: "Moda", label: "Moda", postalCode: "34710" },
    { value: "Osmanağa", label: "Osmanağa", postalCode: "34714" },
    { value: "Rasimpaşa", label: "Rasimpaşa", postalCode: "34716" },
    { value: "Sahrayıcedit", label: "Sahrayıcedit", postalCode: "34734" },
    { value: "Suadiye", label: "Suadiye", postalCode: "34740" },
    { value: "Zühtüpaşa", label: "Zühtüpaşa", postalCode: "34724" }
  ]
};

// Helper functions (backward compatibility)
export const getAllCities = (): string[] => {
  return turkishCities.map(city => city.value);
};

export const getPostalCodeByNeighborhood = (districtName: string, neighborhoodName: string): string | null => {
  const neighborhoods = turkishNeighborhoods[districtName] || [];
  const neighborhood = neighborhoods.find(n => n.value === neighborhoodName);
  return neighborhood?.postalCode || null;
};