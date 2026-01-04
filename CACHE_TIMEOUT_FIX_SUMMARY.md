# Cache ve Timeout Sorunları Düzeltmesi

## Sorun
Müşteriler sayfası ve diğer bazı sayfalar bazen boş geliyor, sayfa yenilenince düzeliyor. Bu durum cache ve timeout ayarlarından kaynaklanıyordu.

## Kök Neden Analizi

### 1. `refetchOnMount` Çelişkisi
- `useInfiniteScroll.ts` içinde `refetchOnMount: true` olarak ayarlanmıştı
- Ancak üst seviye hook'larda (örn: `useCustomersInfiniteScroll`) `refetchOnMount: false` ile override ediliyordu
- Bu durumda cache'deki stale (eski) veri kullanılıyordu ve bazen boş sonuç dönüyordu

### 2. `staleTime` Tutarsızlığı
- Global config: 5 dakika
- `useInfiniteScroll` default: 2 dakika
- Üst seviye hook'lar: 5 dakika
- Bu tutarsızlık nedeniyle verinin ne zaman yenilenmesi gerektiği belirsizdi

### 3. Cache Kontrolünün Yetersizliği
- İlk yüklemede cache'den gelen verinin geçerli olup olmadığı kontrol edilmiyordu
- `enabled` parametresi bazı hook'larda `true` olarak hardcode edilmişti (company_id kontrolü yok)

## Yapılan Düzeltmeler

### 1. Global Cache Ayarları (`src/providers/QueryClientProvider.tsx`)
```typescript
staleTime: 3 * 60 * 1000, // 5 dakika -> 3 dakika (daha sık yenileme)
refetchOnMount: true, // Her mount'ta veriyi kontrol et
```

**Neden 3 dakika?**
- 5 dakika çok uzun, kullanıcılar eski veri görebilir
- 2 dakika çok kısa, gereksiz API çağrıları artar
- 3 dakika optimal denge noktası

### 2. Infinite Scroll Hook'u (`src/hooks/useInfiniteScroll.ts`)
```typescript
refetchOnMount = true, // false -> true (default değişti)
staleTime = 3 * 60 * 1000, // 2 dakika -> 3 dakika
refetchOnMount, // Parametreden gelen değeri kullan
```

### 3. Müşteriler Hook'u (`src/hooks/useCustomersInfiniteScroll.ts`)
```typescript
enabled: !!userData?.company_id, // true -> company_id kontrolü
refetchOnMount: true, // false -> true
staleTime: 3 * 60 * 1000, // 5 dakika -> 3 dakika
```

### 4. Diğer Düzeltilen Hook'lar
Aşağıdaki hook'larda aynı düzeltmeler yapıldı:

#### Infinite Scroll Hook'ları:
- ✅ `useSuppliersInfiniteScroll.ts` - Tedarikçiler
- ✅ `useReturnsInfiniteScroll.ts` - İadeler
- ✅ `useProductsInfiniteScroll.ts` - Ürünler (5 dakika staleTime - daha az değişir)
- ✅ `useDeliveriesInfiniteScroll.ts` - Sevkiyatlar
- ✅ `useActivitiesInfiniteScroll.ts` - Aktiviteler
- ✅ `useBudgetsList.ts` - Bütçeler

#### Diğer Query Hook'ları:
- ✅ `usePurchasing.ts` - Satın alma talepleri
- ✅ `useExpenses.ts` - Giderler (realtime subscription olsa da)
- ✅ `usePurchaseOrders.ts` - Satın alma siparişleri
- ✅ `Contacts.tsx` - Müşteri istatistikleri

### 5. Değiştirilmeyen Hook'lar (Geçerli Sebeplerle)
- ❌ `useAIInsights.ts` - 24 saatlik cache (günlük insight'lar)
- ❌ `useIncomingInvoices.ts` - API senkronizasyonu ile özel yönetim
- ❌ `useOutgoingInvoices.ts` - API senkronizasyonu ile özel yönetim

## Cache Stratejisi Özeti

### Öncelik Seviyelerine Göre:

| Veri Tipi | staleTime | refetchOnMount | Açıklama |
|-----------|-----------|----------------|----------|
| **Kritik Veriler** (Müşteriler, Siparişler, Faturalar) | 3 dakika | ✅ true | Sık güncellenen, kullanıcıya hemen gösterilmesi gereken |
| **Orta Seviye** (Ürünler, Kategoriler) | 5 dakika | ✅ true | Orta sıklıkta güncellenen |
| **Yavaş Değişen** (Ayarlar, Departmanlar) | 10 dakika | ✅ true | Nadiren değişen |
| **Günlük Veriler** (AI Insights, Raporlar) | 24 saat | ❌ false | Günde 1 kez güncellenen |
| **API Senkronize** (e-Fatura, e-İrsaliye) | 10 dakika | ❌ false | Özel senkronizasyon mantığı |

### Önemli Noktalar:

1. **`refetchOnMount: true`** - Mount olduğunda veri stale ise yenile
   - Bu, sayfanın boş gelmesini önler
   - Sadece veri stale ise yeniler, fresh ise cache'den okur

2. **`staleTime: 3 dakika`** - Veri ne kadar süre fresh kabul edilir
   - Daha kısa süre = daha güncel veri, daha fazla API çağrısı
   - Daha uzun süre = daha az API çağrısı, eski veri riski

3. **`gcTime: 10 dakika`** - Cache ne kadar süre bellekte kalır
   - Kullanıcı geri geldiğinde hızlı yükleme
   - Memory leak riskini azaltır

4. **`refetchOnWindowFocus: false`** - Pencere odaklanınca yenileme
   - Kullanıcı experience için kapalı
   - Gereksiz API çağrılarını önler

5. **`refetchOnReconnect: true`** - Ağ bağlantısı döndüğünde yenile
   - Veri tutarlılığı için açık
   - Offline -> online geçişte güncel veri

## Test Senaryoları

### 1. Boş Sayfa Testi
1. Uygulamayı aç
2. Müşteriler sayfasına git
3. Verilerin yüklenmesini bekle
4. ✅ Veriler görünmeli (boş sayfa OLMAMALI)
5. Başka bir sayfaya git, geri dön
6. ✅ Veriler hemen görünmeli (cache'den)

### 2. Stale Veri Testi
1. Müşteriler sayfasını aç
2. 3 dakika bekle
3. Sayfayı yenile veya başka sayfaya git ve geri dön
4. ✅ Veriler yenilenmeli (API çağrısı yapılmalı)
5. Network tab'da yeni request görülmeli

### 3. Fresh Cache Testi
1. Müşteriler sayfasını aç
2. 1 dakika içinde başka sayfaya git ve geri dön
3. ✅ Veriler cache'den gelmeli (API çağrısı OLMAMALI)
4. Network tab'da yeni request görülmemeli

### 4. Company ID Testi
1. Uygulamayı aç (login olmadan)
2. Müşteriler sayfasına gitmeye çalış
3. ✅ Boş liste görünmeli veya loading
4. ❌ API çağrısı YAPILMAMALI (enabled: false)

## Performans İyileştirmeleri

### Öncesi:
- ❌ Bazen boş sayfa
- ❌ Gereksiz 5 dakikalık cache
- ❌ Mount'ta veri kontrolü yok
- ❌ Tutarsız timeout'lar

### Sonrası:
- ✅ Her zaman veri gösterimi
- ✅ Optimal 3 dakikalık cache
- ✅ Mount'ta akıllı veri kontrolü
- ✅ Tutarlı cache stratejisi
- ✅ Company ID kontrolü ile güvenlik

## Notlar

- Real-time subscription'lı sayfalar da `refetchOnMount: true` yapıldı
  - Subscription sadece değişiklikleri dinler
  - İlk yüklemede veri çekilmesi gerekir
  
- `placeholderData` kullanımı korundu
  - Smooth transition için
  - Kullanıcı eski veriyi görürken yeni veri yüklenir

- GC (Garbage Collection) süreleri korundu
  - 10-15 dakika optimal
  - Memory leak riski yok

## İzleme Önerileri

1. **Browser Console** - Gereksiz API çağrıları
2. **Network Tab** - Request sıklığı
3. **React Query DevTools** - Cache durumu
4. **Kullanıcı Geribildirimleri** - Boş sayfa şikayetleri

## Sonuç

Bu düzeltmelerle birlikte:
- ✅ Müşteriler sayfası her zaman veri gösterecek
- ✅ Diğer liste sayfaları da aynı şekilde düzeltildi
- ✅ Cache stratejisi tutarlı hale getirildi
- ✅ Performans optimizasyonu yapıldı
- ✅ API çağrıları kontrollü hale geldi

**Önemli:** Bu değişiklikler production'a deploy edilmeden önce staging ortamında test edilmelidir.

