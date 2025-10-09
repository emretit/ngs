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
  ],
  "Bursa": [
    { value: "Büyükorhan", label: "Büyükorhan" },
    { value: "Gemlik", label: "Gemlik" },
    { value: "Gürsu", label: "Gürsu" },
    { value: "Harmancık", label: "Harmancık" },
    { value: "İnegöl", label: "İnegöl" },
    { value: "İznik", label: "İznik" },
    { value: "Karacabey", label: "Karacabey" },
    { value: "Keles", label: "Keles" },
    { value: "Kestel", label: "Kestel" },
    { value: "Mudanya", label: "Mudanya" },
    { value: "Mustafakemalpaşa", label: "Mustafakemalpaşa" },
    { value: "Nilüfer", label: "Nilüfer" },
    { value: "Orhaneli", label: "Orhaneli" },
    { value: "Orhangazi", label: "Orhangazi" },
    { value: "Osmangazi", label: "Osmangazi" },
    { value: "Yenişehir", label: "Yenişehir" },
    { value: "Yıldırım", label: "Yıldırım" }
  ],
  "Antalya": [
    { value: "Akseki", label: "Akseki" },
    { value: "Aksu", label: "Aksu" },
    { value: "Alanya", label: "Alanya" },
    { value: "Demre", label: "Demre" },
    { value: "Döşemealtı", label: "Döşemealtı" },
    { value: "Elmalı", label: "Elmalı" },
    { value: "Finike", label: "Finike" },
    { value: "Gazipaşa", label: "Gazipaşa" },
    { value: "Gündoğmuş", label: "Gündoğmuş" },
    { value: "İbradı", label: "İbradı" },
    { value: "Kaş", label: "Kaş" },
    { value: "Kemer", label: "Kemer" },
    { value: "Kepez", label: "Kepez" },
    { value: "Konyaaltı", label: "Konyaaltı" },
    { value: "Korkuteli", label: "Korkuteli" },
    { value: "Kumluca", label: "Kumluca" },
    { value: "Manavgat", label: "Manavgat" },
    { value: "Muratpaşa", label: "Muratpaşa" },
    { value: "Serik", label: "Serik" }
  ],
  "Adana": [
    { value: "Aladağ", label: "Aladağ" },
    { value: "Ceyhan", label: "Ceyhan" },
    { value: "Çukurova", label: "Çukurova" },
    { value: "Feke", label: "Feke" },
    { value: "İmamoğlu", label: "İmamoğlu" },
    { value: "Karaisalı", label: "Karaisalı" },
    { value: "Karataş", label: "Karataş" },
    { value: "Kozan", label: "Kozan" },
    { value: "Pozantı", label: "Pozantı" },
    { value: "Saimbeyli", label: "Saimbeyli" },
    { value: "Sarıçam", label: "Sarıçam" },
    { value: "Seyhan", label: "Seyhan" },
    { value: "Tufanbeyli", label: "Tufanbeyli" },
    { value: "Yumurtalık", label: "Yumurtalık" },
    { value: "Yüreğir", label: "Yüreğir" }
  ],
  "Konya": [
    { value: "Ahırlı", label: "Ahırlı" },
    { value: "Akören", label: "Akören" },
    { value: "Akşehir", label: "Akşehir" },
    { value: "Altınekin", label: "Altınekin" },
    { value: "Beyşehir", label: "Beyşehir" },
    { value: "Bozkır", label: "Bozkır" },
    { value: "Cihanbeyli", label: "Cihanbeyli" },
    { value: "Çeltik", label: "Çeltik" },
    { value: "Çumra", label: "Çumra" },
    { value: "Derbent", label: "Derbent" },
    { value: "Derebucak", label: "Derebucak" },
    { value: "Doğanhisar", label: "Doğanhisar" },
    { value: "Emirgazi", label: "Emirgazi" },
    { value: "Ereğli", label: "Ereğli" },
    { value: "Güneysinir", label: "Güneysinir" },
    { value: "Hadim", label: "Hadim" },
    { value: "Halkapınar", label: "Halkapınar" },
    { value: "Hüyük", label: "Hüyük" },
    { value: "Ilgın", label: "Ilgın" },
    { value: "Kadınhanı", label: "Kadınhanı" },
    { value: "Karapınar", label: "Karapınar" },
    { value: "Karatay", label: "Karatay" },
    { value: "Kulu", label: "Kulu" },
    { value: "Meram", label: "Meram" },
    { value: "Sarayönü", label: "Sarayönü" },
    { value: "Selçuklu", label: "Selçuklu" },
    { value: "Seydişehir", label: "Seydişehir" },
    { value: "Taşkent", label: "Taşkent" },
    { value: "Tuzlukçu", label: "Tuzlukçu" },
    { value: "Yalıhüyük", label: "Yalıhüyük" },
    { value: "Yunak", label: "Yunak" }
  ]
};

// Fallback neighborhood data for major districts
export const turkishNeighborhoods: Record<string, Array<{ value: string; label: string; postalCode: string; }>> = {
  // İstanbul - Kadıköy
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
  ],
  // İstanbul - Beşiktaş
  "Beşiktaş": [
    { value: "Abbasağa", label: "Abbasağa", postalCode: "34353" },
    { value: "Arnavutköy", label: "Arnavutköy", postalCode: "34345" },
    { value: "Bebek", label: "Bebek", postalCode: "34342" },
    { value: "Etiler", label: "Etiler", postalCode: "34337" },
    { value: "Gayrettepe", label: "Gayrettepe", postalCode: "34349" },
    { value: "Kuruçeşme", label: "Kuruçeşme", postalCode: "34345" },
    { value: "Levent", label: "Levent", postalCode: "34330" },
    { value: "Ortaköy", label: "Ortaköy", postalCode: "34347" },
    { value: "Sinanpaşa", label: "Sinanpaşa", postalCode: "34353" },
    { value: "Ulus", label: "Ulus", postalCode: "34340" },
    { value: "Vişnezade", label: "Vişnezade", postalCode: "34349" },
    { value: "Yıldız", label: "Yıldız", postalCode: "34349" }
  ],
  // İstanbul - Şişli
  "Şişli": [
    { value: "19 Mayıs", label: "19 Mayıs", postalCode: "34360" },
    { value: "Bomonti", label: "Bomonti", postalCode: "34381" },
    { value: "Bozkurt", label: "Bozkurt", postalCode: "34375" },
    { value: "Cumhuriyet", label: "Cumhuriyet", postalCode: "34380" },
    { value: "Duatepe", label: "Duatepe", postalCode: "34375" },
    { value: "Ergenekon", label: "Ergenekon", postalCode: "34375" },
    { value: "Esentepe", label: "Esentepe", postalCode: "34394" },
    { value: "Eskişehir", label: "Eskişehir", postalCode: "34375" },
    { value: "Feriköy", label: "Feriköy", postalCode: "34375" },
    { value: "Fulya", label: "Fulya", postalCode: "34394" },
    { value: "Gülbağ", label: "Gülbağ", postalCode: "34375" },
    { value: "Halaskargazi", label: "Halaskargazi", postalCode: "34371" },
    { value: "Harbiye", label: "Harbiye", postalCode: "34367" },
    { value: "Huzur", label: "Huzur", postalCode: "34394" },
    { value: "İnönü", label: "İnönü", postalCode: "34375" },
    { value: "İzzetpaşa", label: "İzzetpaşa", postalCode: "34375" },
    { value: "Kaptanpaşa", label: "Kaptanpaşa", postalCode: "34375" },
    { value: "Kuştepe", label: "Kuştepe", postalCode: "34375" },
    { value: "Mahmut Şevket Paşa", label: "Mahmut Şevket Paşa", postalCode: "34375" },
    { value: "Mecidiyeköy", label: "Mecidiyeköy", postalCode: "34387" },
    { value: "Meşrutiyet", label: "Meşrutiyet", postalCode: "34375" },
    { value: "Mim Kemal Öke", label: "Mim Kemal Öke", postalCode: "34375" },
    { value: "Osmanbey", label: "Osmanbey", postalCode: "34375" },
    { value: "Pangaltı", label: "Pangaltı", postalCode: "34375" },
    { value: "Pişmaniye", label: "Pişmaniye", postalCode: "34375" },
    { value: "Piyalepaşa", label: "Piyalepaşa", postalCode: "34375" },
    { value: "Sıracevizler", label: "Sıracevizler", postalCode: "34375" },
    { value: "Teşvikiye", label: "Teşvikiye", postalCode: "34365" },
    { value: "Yayla", label: "Yayla", postalCode: "34375" }
  ],
  // Ankara - Çankaya
  "Çankaya": [
    { value: "Aşağı Ayrancı", label: "Aşağı Ayrancı", postalCode: "06420" },
    { value: "Aşıkpaşa", label: "Aşıkpaşa", postalCode: "06420" },
    { value: "Ata", label: "Ata", postalCode: "06420" },
    { value: "Aydınlıkevler", label: "Aydınlıkevler", postalCode: "06420" },
    { value: "Ayrancı", label: "Ayrancı", postalCode: "06420" },
    { value: "Bademlidere", label: "Bademlidere", postalCode: "06420" },
    { value: "Balgat", label: "Balgat", postalCode: "06420" },
    { value: "Bayındır", label: "Bayındır", postalCode: "06420" },
    { value: "Bilkent", label: "Bilkent", postalCode: "06420" },
    { value: "Birlik", label: "Birlik", postalCode: "06420" },
    { value: "Çankaya", label: "Çankaya", postalCode: "06420" },
    { value: "Çukurambar", label: "Çukurambar", postalCode: "06420" },
    { value: "Dikmen", label: "Dikmen", postalCode: "06420" },
    { value: "Emek", label: "Emek", postalCode: "06420" },
    { value: "Gaziosmanpaşa", label: "Gaziosmanpaşa", postalCode: "06420" },
    { value: "Güvenevler", label: "Güvenevler", postalCode: "06420" },
    { value: "Hilal", label: "Hilal", postalCode: "06420" },
    { value: "Hilal Mahallesi", label: "Hilal Mahallesi", postalCode: "06420" },
    { value: "Kızılay", label: "Kızılay", postalCode: "06420" },
    { value: "Konutkent", label: "Konutkent", postalCode: "06420" },
    { value: "Korkutreis", label: "Korkutreis", postalCode: "06420" },
    { value: "Kurtuluş", label: "Kurtuluş", postalCode: "06420" },
    { value: "Maltepe", label: "Maltepe", postalCode: "06420" },
    { value: "Mithatpaşa", label: "Mithatpaşa", postalCode: "06420" },
    { value: "Oğuzlar", label: "Oğuzlar", postalCode: "06420" },
    { value: "Orta Doğu Teknik Üniversitesi", label: "Orta Doğu Teknik Üniversitesi", postalCode: "06420" },
    { value: "Ostim", label: "Ostim", postalCode: "06420" },
    { value: "Öveçler", label: "Öveçler", postalCode: "06420" },
    { value: "Remzi Oğuz Arık", label: "Remzi Oğuz Arık", postalCode: "06420" },
    { value: "Seyranbağları", label: "Seyranbağları", postalCode: "06420" },
    { value: "Sokullu Mehmet Paşa", label: "Sokullu Mehmet Paşa", postalCode: "06420" },
    { value: "Tunalı", label: "Tunalı", postalCode: "06420" },
    { value: "Yıldızevler", label: "Yıldızevler", postalCode: "06420" },
    { value: "Yukarı Ayrancı", label: "Yukarı Ayrancı", postalCode: "06420" }
  ],
  // İzmir - Konak
  "Konak": [
    { value: "Akdeniz", label: "Akdeniz", postalCode: "35250" },
    { value: "Alsancak", label: "Alsancak", postalCode: "35220" },
    { value: "Basmane", label: "Basmane", postalCode: "35250" },
    { value: "Çankaya", label: "Çankaya", postalCode: "35250" },
    { value: "Eşrefpaşa", label: "Eşrefpaşa", postalCode: "35250" },
    { value: "Güzelyalı", label: "Güzelyalı", postalCode: "35250" },
    { value: "Kadifekale", label: "Kadifekale", postalCode: "35250" },
    { value: "Kemeraltı", label: "Kemeraltı", postalCode: "35250" },
    { value: "Konak", label: "Konak", postalCode: "35250" },
    { value: "Mersinli", label: "Mersinli", postalCode: "35250" },
    { value: "Mithatpaşa", label: "Mithatpaşa", postalCode: "35250" },
    { value: "Pasaport", label: "Pasaport", postalCode: "35220" },
    { value: "Piri Reis", label: "Piri Reis", postalCode: "35250" },
    { value: "Tepecik", label: "Tepecik", postalCode: "35250" },
    { value: "Tirebolu", label: "Tirebolu", postalCode: "35250" }
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