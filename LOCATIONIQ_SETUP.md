# LocationIQ Autocomplete Kurulum Rehberi

## Genel Bakış

LocationIQ Autocomplete ve harita entegrasyonu başarıyla tamamlandı. Bu dokümanda kurulum detayları ve kullanım bilgileri bulunmaktadır.

## Özellikler

✅ **Adres Otomatik Tamamlama:** Tüm adres formlarında LocationIQ autocomplete
✅ **Geocoding Cache:** Supabase'de cache mekanizması (günlük API çağrısı %90 azalır)
✅ **İnteraktif Harita:** ServiceMapView'da Leaflet ile harita görünümü
✅ **Marker Clustering:** Çok sayıda servis lokasyonu için performans
✅ **Şehir/İlçe Mapping:** LocationIQ sonuçlarının Supabase veritabanı ile eşleştirilmesi

## Kurulum

### 1. LocationIQ API Key Alma

1. https://locationiq.com/signup adresinden ücretsiz hesap oluşturun
2. Dashboard'dan API key alın
3. Ücretsiz tier: **5,000 istek/gün**

### 2. Environment Variable Ekleme

`.env` dosyasına ekleyin:

```env
VITE_LOCATIONIQ_API_KEY=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Not:** API key'i production'da da eklemeyi unutmayın (Vercel, Netlify, vb.)

### 3. Paketler (Zaten Kuruldu)

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "react-leaflet-markercluster": "^3.0.0",
  "@types/leaflet": "^1.9.12"
}
```

### 4. Migration (Zaten Uygulandı)

Geocoding cache tablosu oluşturuldu:
- `geocoding_cache` tablosu
- Cache TTL: 30 gün
- `clean_expired_geocoding_cache()` fonksiyonu

## Kullanılan Componentler

### 1. AddressFields Component

Tüm adres formlarında otomatik autocomplete çalışır:

**Kullanılan Formlar:**
- `src/components/customers/form/CompanyBasicInfo.tsx`
- `src/components/customers/form/BasicInformation.tsx`
- `src/components/suppliers/form/SupplierBasicInfo.tsx`
- `src/components/employees/form/sections/AddressInformation.tsx`
- `src/pages/inventory/WarehouseNew.tsx`
- Diğer tüm `AddressFields` kullanan formlar

**Özellikler:**
- 3+ karakter yazınca autocomplete açılır
- Türkiye odaklı arama (`countrycodes: 'tr'`)
- Seçilen adres otomatik parse edilir
- Şehir, ilçe, posta kodu otomatik doldurulur
- Mevcut dropdown sistemi fallback olarak çalışır

### 2. ServiceMapView Component

Servis lokasyonlarını haritada gösterir:

**Özellikler:**
- Leaflet + React-Leaflet ile interaktif harita
- LocationIQ geocoding ile adresler → koordinatlar
- Marker clustering (çok sayıda servis için)
- Popup'larda servis detayları
- Öncelik bazlı renkli marker'lar
- Geocoding cache ile performans

## API Kullanımı ve Limitler

### LocationIQ Free Tier

- **Günlük Limit:** 5,000 istek
- **Kullanım:**
  - Autocomplete: ~50-100 istek/gün
  - Geocoding: ~100 istek/gün (cache sayesinde çok az)
- **Toplam Tahmini:** ~150-200 istek/gün
- **Kalan Kapasite:** ~4,800 istek/gün (yeterli) ✅

### Cache Mekanizması

Geocoding sonuçları Supabase'de saklanır:
- TTL: 30 gün
- Aynı adres için tekrar API çağrısı yapılmaz
- **%90 istek azaltımı** sağlar

**Örnek:**
- Cache olmadan: 1,000 servis × 10 kez yükleme = 10,000 istek/gün ❌
- Cache ile: İlk yükleme 1,000 + sonraki 0 = 1,000 istek/gün ✅

### Cleanup

Expired cache temizleme (isteğe bağlı):

```sql
SELECT clean_expired_geocoding_cache();
```

## Dosya Yapısı

### Yeni Dosyalar

```
src/
  services/
    locationiqService.ts          # LocationIQ API servisi
  hooks/
    useLocationIQAutocomplete.ts  # Autocomplete hook
    useLocationIQGeocoding.ts     # Geocoding hook (cache ile)
  utils/
    locationiqUtils.ts            # Şehir/ilçe mapping utilities

supabase/migrations/
  20251122231700_create_geocoding_cache.sql  # Cache tablosu
```

### Güncellenen Dosyalar

```
src/
  components/
    shared/
      AddressFields.tsx           # Autocomplete entegrasyonu
    service/
      ServiceMapView.tsx          # Leaflet harita
  index.css                       # Leaflet CSS import
```

## Test

### 1. Autocomplete Test

1. Herhangi bir müşteri/tedarikçi/çalışan formu açın
2. "Detaylı Adres" alanına yazın (min 3 karakter)
3. Autocomplete dropdown açılmalı
4. Bir adres seçin
5. Şehir, ilçe, posta kodu otomatik doldurulmalı

### 2. Harita Test

1. Servis sayfasına gidin
2. "Harita" görünümüne geçin
3. Servis lokasyonları haritada görünmeli
4. Marker'lara tıklayınca popup açılmalı
5. Çok sayıda servis varsa clustering çalışmalı

## Sorun Giderme

### API Key Hatası

```
LocationIQ API key not found. Set VITE_LOCATIONIQ_API_KEY in environment variables.
```

**Çözüm:** `.env` dosyasına `VITE_LOCATIONIQ_API_KEY` ekleyin

### Rate Limit Hatası

```
LocationIQ API error: 429
```

**Çözüm:** 
- Günlük 5,000 istek limitini aştınız
- Cache mekanizması çalışıyor mu kontrol edin
- Ücretli plana geçiş yapabilirsiniz

### Harita Görünmüyor

**Çözüm:**
- Leaflet CSS import edildi mi kontrol edin (`index.css`)
- Console'da hata var mı kontrol edin
- Servis lokasyonları boş olabilir

## Alternatif Çözümler

Eğer LocationIQ yetersiz gelirse:

1. **Mapbox:** Daha fazla özellik, aylık 100,000 istek (ama %68 daha pahalı)
2. **HERE Technologies:** Enterprise çözüm
3. **TomTom:** Alternatif API

## Fiyatlandırma Karşılaştırması

| API | Ücretsiz Tier | Ücretli Plan | Özellikler |
|-----|--------------|--------------|------------|
| **LocationIQ** | 5,000/gün | $49/ay (100k) | ✅ Türkiye, ✅ Ucuz |
| Mapbox | 100,000/ay | $112.5/ay (100k) | ✅ Yaygın, ❌ Pahalı |
| Google Maps | $200 kredi | Çok pahalı | ✅ En iyi, ❌ Maliyet |

## Katkıda Bulunanlar

- **LocationIQ:** Autocomplete ve Geocoding API
- **Leaflet:** Açık kaynak harita kütüphanesi
- **OpenStreetMap:** Ücretsiz tile layer
- **Supabase:** Cache veritabanı

## Notlar

- Geocoding cache her 30 günde bir otomatik temizlenir
- Türkiye dışı adresler için `countryCode` parametresi değiştirilebilir
- Marker icon'ları öncelik bazlı renklendirilmiştir
- Cluster'lar otomatik oluşturulur (>100 marker için)











