/**
 * Birim sabitleri ve yardımcı fonksiyonlar
 * Tüm uygulamada tutarlı birim kullanımı için merkezi tanımlar
 */

// Dropdown'da kullanılacak birim değerleri (küçük harf, kısa format)
export const UNIT_VALUES = {
  ADET: 'adet',
  KILOGRAM: 'kg',
  GRAM: 'g',
  METRE: 'm',
  METREKARE: 'm2',
  METREKUP: 'm3',
  LITRE: 'lt',
  MILILITRE: 'ml',
  PAKET: 'paket',
  KUTU: 'kutu',
  SAAT: 'saat',
  GUN: 'gün',
  HAFTA: 'hafta',
  AY: 'ay',
} as const;

// Birim görünen adları (dropdown'da gösterilecek)
export const UNIT_LABELS: Record<string, string> = {
  [UNIT_VALUES.ADET]: 'Adet',
  [UNIT_VALUES.KILOGRAM]: 'Kilogram',
  [UNIT_VALUES.GRAM]: 'Gram',
  [UNIT_VALUES.METRE]: 'Metre',
  [UNIT_VALUES.METREKARE]: 'Metrekare',
  [UNIT_VALUES.METREKUP]: 'Metreküp',
  [UNIT_VALUES.LITRE]: 'Litre',
  [UNIT_VALUES.MILILITRE]: 'Mililitre',
  [UNIT_VALUES.PAKET]: 'Paket',
  [UNIT_VALUES.KUTU]: 'Kutu',
  [UNIT_VALUES.SAAT]: 'Saat',
  [UNIT_VALUES.GUN]: 'Gün',
  [UNIT_VALUES.HAFTA]: 'Hafta',
  [UNIT_VALUES.AY]: 'Ay',
};

// Tüm birim değerlerinin listesi (dropdown için)
export const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// UBL-TR standart birim kodlarını okunabilir birimlere çevir
export const formatUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'C62': 'adet',
    'MTR': 'metre',
    'MTK': 'metrekare',
    'MTQ': 'metreküp',
    'KGM': 'kilogram',
    'GRM': 'gram',
    'LTR': 'litre',
    'MLT': 'mililitre',
    'HUR': 'saat',
    'DAY': 'gün',
    'MON': 'ay',
    'WEE': 'hafta',
    'PA': 'paket',
    'CT': 'kutu',
  };
  return unitMap[unit] || unit;
};

// UBL-TR birim kodlarını dropdown değerlerine çevir
export const mapUnitToDropdownValue = (unit: string): string => {
  // Eğer zaten dropdown değeri formatındaysa (adet, kg, g, vb.) direkt döndür
  const dropdownValues = Object.values(UNIT_VALUES);
  if (dropdownValues.includes(unit.toLowerCase() as any)) {
    return unit.toLowerCase();
  }
  
  // UBL-TR kodlarını dropdown değerlerine çevir
  const unitMap: Record<string, string> = {
    'C62': UNIT_VALUES.ADET,
    'MTR': UNIT_VALUES.METRE,
    'MTK': UNIT_VALUES.METREKARE,
    'MTQ': UNIT_VALUES.METREKUP,
    'KGM': UNIT_VALUES.KILOGRAM,
    'GRM': UNIT_VALUES.GRAM,
    'LTR': UNIT_VALUES.LITRE,
    'MLT': UNIT_VALUES.MILILITRE,
    'HUR': UNIT_VALUES.SAAT,
    'DAY': UNIT_VALUES.GUN,
    'MON': UNIT_VALUES.AY,
    'WEE': UNIT_VALUES.HAFTA,
    'PA': UNIT_VALUES.PAKET,
    'CT': UNIT_VALUES.KUTU,
    // Okunabilir formatları da destekle
    'adet': UNIT_VALUES.ADET,
    'kilogram': UNIT_VALUES.KILOGRAM,
    'gram': UNIT_VALUES.GRAM,
    'metre': UNIT_VALUES.METRE,
    'metrekare': UNIT_VALUES.METREKARE,
    'metreküp': UNIT_VALUES.METREKUP,
    'litre': UNIT_VALUES.LITRE,
    'mililitre': UNIT_VALUES.MILILITRE,
    // Eski formatları da destekle (büyük harf başlangıçlı)
    'Adet': UNIT_VALUES.ADET,
    'Kg': UNIT_VALUES.KILOGRAM,
    'Lt': UNIT_VALUES.LITRE,
    'M': UNIT_VALUES.METRE,
    'M2': UNIT_VALUES.METREKARE,
    'M3': UNIT_VALUES.METREKUP,
    'Paket': UNIT_VALUES.PAKET,
    'Kutu': UNIT_VALUES.KUTU,
  };
  
  return unitMap[unit.toUpperCase()] || unitMap[unit] || unitMap[unit.toLowerCase()] || UNIT_VALUES.ADET;
};

// Birim değerini görünen adına çevir
export const getUnitLabel = (value: string): string => {
  return UNIT_LABELS[value] || value;
};

// Dropdown birim değerini UBL-TR standart koduna çevir (Nilvera API için)
export const mapUnitToUBLTRCode = (unit: string): string => {
  // Eğer zaten UBL-TR kodu formatındaysa direkt döndür
  const ubltrCodes = ['C62', 'MTR', 'MTK', 'MTQ', 'KGM', 'GRM', 'LTR', 'MLT', 'HUR', 'DAY', 'MON', 'WEE', 'PA', 'CT'];
  if (ubltrCodes.includes(unit.toUpperCase())) {
    return unit.toUpperCase();
  }
  
  // Dropdown değerlerini ve okunabilir formatları UBL-TR kodlarına çevir
  const unitToUBLTRMap: Record<string, string> = {
    // Dropdown değerleri
    [UNIT_VALUES.ADET]: 'C62',
    [UNIT_VALUES.KILOGRAM]: 'KGM',
    [UNIT_VALUES.GRAM]: 'GRM',
    [UNIT_VALUES.METRE]: 'MTR',
    [UNIT_VALUES.METREKARE]: 'MTK',
    [UNIT_VALUES.METREKUP]: 'MTQ',
    [UNIT_VALUES.LITRE]: 'LTR',
    [UNIT_VALUES.MILILITRE]: 'MLT',
    [UNIT_VALUES.PAKET]: 'PA',
    [UNIT_VALUES.KUTU]: 'CT',
    [UNIT_VALUES.SAAT]: 'HUR',
    [UNIT_VALUES.GUN]: 'DAY',
    [UNIT_VALUES.HAFTA]: 'WEE',
    [UNIT_VALUES.AY]: 'MON',
    // Eski formatlar
    'Adet': 'C62',
    'Kg': 'KGM',
    'Lt': 'LTR',
    'M': 'MTR',
    'M2': 'MTK',
    'M3': 'MTQ',
    'Paket': 'PA',
    'Kutu': 'CT',
  };
  
  return unitToUBLTRMap[unit.toLowerCase()] || unitToUBLTRMap[unit] || 'C62'; // Varsayılan: C62 (adet)
};

// UBL-TR kodunu dropdown değerine çevir (Nilvera API'den gelen veriler için)
export const mapUBLTRCodeToUnit = (ubltrCode: string): string => {
  return mapUnitToDropdownValue(ubltrCode);
};

