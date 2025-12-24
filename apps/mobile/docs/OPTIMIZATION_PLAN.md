# Flutter Mobil Uygulama Optimizasyon Planı

## 🎯 Hedef
Pafta mobil uygulamasını optimize ederek performansı artırma, API çağrılarını azaltma ve kod kalitesini iyileştirme.

## 📊 Mevcut Durum Özeti

### Tespit Edilen Kritik Sorunlar
- **Duplicate Provider Hatası**: `personalActivitiesProvider` hem [dashboard_provider.dart](apps/mobile/lib/providers/dashboard_provider.dart) hem [activity_provider.dart](apps/mobile/lib/providers/activity_provider.dart) içinde tanımlı (13. ve 11. satırlar)
- **Verimsiz Dashboard**: [dashboard_service.dart:118-152](apps/mobile/lib/services/dashboard_service.dart#L118-L152) 4 sıralı API çağrısı yapıyor (paralel olabilir)
- **Önbellek Yok**: Hiçbir serviste cache mekanizması yok, her çağrı API'ye gidiyor
- **Employee ID Tekrar Sorgulanıyor**: Her API çağrısında employee_id lookup yapılıyor
- **Büyük Widget Dosyaları**: 5 dosya 1000+ satır (service_request_form_page.dart: 2,162 satır)
- **166 setState Çağrısı**: Gereksiz widget rebuild'leri
- **Liste Performansı**: `.map().toList()` kullanımı, ListView.builder yerine
- **29 Güncel Olmayan Paket**: Firebase, Supabase ve diğer major updates

### Beklenen İyileştirmeler
- ✅ %60-70 daha az API çağrısı
- ✅ %40 daha az widget rebuild
- ✅ Sub-saniye dashboard yükleme
- ✅ %70 daha az bellek kullanımı (büyük listeler için)

---

## 🚀 FAZ 1: KRİTİK PERFORMANS DÜZELTMELERİ (Yüksek Etki)

**Tahmini Süre**: 2-3 gün
**Etki**: Anında %60+ performans artışı

### 1.1 Duplicate Provider Sorununu Çöz ⚠️ KRİTİK

**Dosyalar**:
- [apps/mobile/lib/providers/dashboard_provider.dart](apps/mobile/lib/providers/dashboard_provider.dart#L13-L26)
- [apps/mobile/lib/providers/activity_provider.dart](apps/mobile/lib/providers/activity_provider.dart#L11-L21)
- [apps/mobile/lib/pages/dashboard_page.dart](apps/mobile/lib/pages/dashboard_page.dart)

**Değişiklikler**:
1. `dashboard_provider.dart`'dan `personalActivitiesProvider` ve `todayActivitiesProvider`'ı SİL
2. Tek kaynak: `activity_provider.dart`
3. Tüm import'ları güncelle (dashboard_page.dart, crm_page.dart)
4. `todayActivitiesProvider`'ı `personalActivitiesProvider`'dan türet (client-side filtering):
   ```dart
   final todayActivitiesProvider = Provider<List<Activity>>((ref) {
     final activities = ref.watch(personalActivitiesProvider).value ?? [];
     final today = DateTime.now();
     return activities.where((a) =>
       a.dueDate?.day == today.day &&
       a.dueDate?.month == today.month &&
       a.status != 'completed'
     ).toList();
   });
   ```

**Neden**: Runtime'da provider충突 hatası önlenir, kod tekrarı azalır.

---

### 1.2 Dashboard Stats API Optimizasyonu

**Dosyalar**:
- [apps/mobile/lib/services/dashboard_service.dart](apps/mobile/lib/services/dashboard_service.dart#L118-L152)

**Mevcut Durum**:
```dart
// 4 sıralı API çağrısı:
final todayActivities = await getTodayActivities(...);          // API 1
final pendingApprovals = await getPendingApprovals(...);        // API 2
final allActivities = await getPersonalActivities(...);         // API 3
final unreadNotifications = await _supabase.from(...)           // API 4
```

**Değişiklikler**:
1. **Future.wait() ile paralelleştir**:
   ```dart
   final [todayActivities, pendingApprovals, allActivities, notifResult] =
     await Future.wait([
       getTodayActivities(companyId: companyId, userId: userId),
       getPendingApprovals(companyId: companyId, approverId: userId),
       getPersonalActivities(companyId: companyId, userId: userId),
       _supabase.from('notifications').select().eq('user_id', userId).eq('is_read', false).count(),
     ]);
   ```

2. **Opsiyonel: Supabase RPC fonksiyonu oluştur** (ileride):
   - Tek SQL query'sinde tüm stats'ı getir
   - CTEs kullanarak birleştir
   - Network round-trip'i 4'ten 1'e düşür

**Etki**: Dashboard yükleme %75 daha hızlı (4 sıralı → 1 paralel)

---

### 1.3 Employee ID Önbelleği Ekle

**Dosyalar**:
- [apps/mobile/lib/services/activity_service.dart](apps/mobile/lib/services/activity_service.dart#L62-L92)
- [apps/mobile/lib/services/dashboard_service.dart](apps/mobile/lib/services/dashboard_service.dart)

**Değişiklikler**:
1. ActivityService sınıfına static cache ekle:
   ```dart
   class ActivityService {
     static String? _cachedEmployeeId;
     static String? _cachedUserId;

     Future<String?> _getEmployeeIdForUser(String userId) async {
       if (_cachedEmployeeId != null && _cachedUserId == userId) {
         return _cachedEmployeeId;
       }

       // Mevcut lookup logic (satır 66-89)...

       _cachedEmployeeId = employeeId;
       _cachedUserId = userId;
       return employeeId;
     }

     static void clearCache() {
       _cachedEmployeeId = null;
       _cachedUserId = null;
     }
   }
   ```

2. Logout'ta ve profil değişikliklerinde `ActivityService.clearCache()` çağır

**Etki**: Her activity işleminde 2-3 API çağrısı eliminasyonu

---

### 1.4 MainLayout Provider Watching Fix

**Dosyalar**:
- [apps/mobile/lib/shared/layouts/main_layout.dart](apps/mobile/lib/shared/layouts/main_layout.dart#L20)

**Değişiklikler**:
1. `final notificationState = ref.watch(notificationProvider);` satırını SİL
2. MainLayout bu state'i kullanmıyor, gereksiz rebuild yapıyor

**Etki**: Her bildirim değişikliğinde tüm ekran rebuild'i önlenir

---

### 1.5 Dashboard Refresh Optimizasyonu

**Dosyalar**:
- [apps/mobile/lib/pages/dashboard_page.dart](apps/mobile/lib/pages/dashboard_page.dart#L70-L73)

**Mevcut Durum**:
```dart
onRefresh: () async {
  ref.invalidate(dashboardStatsProvider);   // 4 API çağrısı
  ref.invalidate(todayActivitiesProvider);  // 1 API çağrısı (DUPLICATE!)
}
```

**Değişiklikler**:
1. `todayActivitiesProvider`'ı invalidate etme (zaten `personalActivitiesProvider`'dan türetiyor)
2. Sadece `dashboardStatsProvider` ve `personalActivitiesProvider`'ı refresh et
3. `todayActivitiesProvider` otomatik güncellenecek

**Etki**: Refresh'te 5 çağrı → 3 çağrıya düşer

---

## 🗄️ FAZ 2: ÖNBELLEKLEMEstratejisi (Orta Etki)

**Tahmini Süre**: 3-4 gün
**Etki**: API çağrılarında %60-80 azalma

### 2.1 Cache Service Oluştur

**Yeni Dosya**: [apps/mobile/lib/services/cache_service.dart](apps/mobile/lib/services/cache_service.dart)

**İçerik**:
```dart
class CacheService {
  static final Map<String, CacheEntry> _cache = {};

  static T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null || entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry.data as T;
  }

  static void set<T>(String key, T data, {Duration ttl = const Duration(minutes: 5)}) {
    _cache[key] = CacheEntry(data, DateTime.now().add(ttl));
  }

  static void invalidate(String keyPattern) {
    _cache.removeWhere((key, _) => key.contains(keyPattern));
  }

  static void clear() => _cache.clear();
}

class CacheEntry {
  final dynamic data;
  final DateTime expiresAt;

  CacheEntry(this.data, this.expiresAt);
  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
```

### 2.2 Provider'lara Cache Ekle

**Dosyalar**:
- Tüm FutureProvider'lar (activity, dashboard, customer, supplier, vb.)

**Strateji**:
1. FutureProvider'ları AsyncNotifierProvider'a çevir (daha iyi cache kontrolü)
2. Her provider'da cache check ekle:
   ```dart
   final activitiesProvider = AsyncNotifierProvider<ActivitiesNotifier, List<Activity>>(
     () => ActivitiesNotifier(),
   );

   class ActivitiesNotifier extends AsyncNotifier<List<Activity>> {
     @override
     Future<List<Activity>> build() async {
       final companyId = ref.watch(authStateProvider).user?.companyId;
       final cacheKey = 'activities_$companyId';

       // Cache check
       final cached = CacheService.get<List<Activity>>(cacheKey);
       if (cached != null) return cached;

       // API call
       final activities = await ref.read(activityServiceProvider)
         .getAllCompanyActivities(companyId: companyId);

       // Cache set
       CacheService.set(cacheKey, activities, ttl: Duration(minutes: 5));
       return activities;
     }

     Future<void> refresh() async {
       CacheService.invalidate('activities_');
       ref.invalidateSelf();
     }
   }
   ```

**Öncelikli Provider'lar**:
- personalActivitiesProvider
- activitiesProvider
- customersProvider
- suppliersProvider
- dashboardStatsProvider

### 2.3 Pagination Ekle

**Dosyalar**:
- [apps/mobile/lib/services/customer_service.dart](apps/mobile/lib/services/customer_service.dart#L10-L23)
- [apps/mobile/lib/services/supplier_service.dart](apps/mobile/lib/services/supplier_service.dart#L10-L23)
- [apps/mobile/lib/services/activity_service.dart](apps/mobile/lib/services/activity_service.dart#L24-L59)

**Değişiklikler**:
1. Service metodlarına pagination parametreleri ekle:
   ```dart
   Future<List<Customer>> getCustomers({
     String? companyId,
     int page = 0,
     int pageSize = 50,
   }) async {
     final start = page * pageSize;
     final end = start + pageSize - 1;

     final response = await _supabase
       .from('customers')
       .select()
       .eq('company_id', companyId)
       .order('created_at', ascending: false)
       .range(start, end);  // Supabase pagination

     return (response as List).map((json) => Customer.fromJson(json)).toList();
   }
   ```

2. UI'da infinite scroll ekle (ListView.builder + ScrollController)

**Etki**: İlk yükleme %80 daha hızlı (100+ kayıt → 50 kayıt)

---

## 🎨 FAZ 3: WIDGET OPTİMİZASYONU (Orta Etki)

**Tahmini Süre**: 3-4 gün
**Etki**: %40 daha az rebuild, daha smooth UI

### 3.1 Const Constructor'lar Ekle

**Dosyalar** (yüksek öncelikli):
- [apps/mobile/lib/pages/dashboard_page.dart](apps/mobile/lib/pages/dashboard_page.dart)
- [apps/mobile/lib/shared/layouts/main_layout.dart](apps/mobile/lib/shared/layouts/main_layout.dart)
- [apps/mobile/lib/shared/widgets/](apps/mobile/lib/shared/widgets/)

**Pattern**:
```dart
// Önce:
Icon(CupertinoIcons.house_fill, size: 24)
SizedBox(width: 10)
EdgeInsets.all(16)

// Sonra:
const Icon(CupertinoIcons.house_fill, size: 24)
const SizedBox(width: 10)
const EdgeInsets.all(16)
```

**Strateji**:
1. Tüm statik widget'lara `const` ekle
2. `analysis_options.yaml`'a `prefer_const_constructors: true` ekle (otomatik tespit)

### 3.2 ListView.builder Migrasyonu

**Dosyalar**:
- UI rendering yapan tüm sayfa dosyaları

**Değişiklikler**:
```dart
// Önce (bellek verimsiz):
Column(
  children: activities.map((a) => ActivityCard(a)).toList(),
)

// Sonra (bellek verimli):
ListView.builder(
  itemCount: activities.length,
  itemBuilder: (context, index) => ActivityCard(activities[index]),
)
```

**Etki**: 100+ öğeli listelerde %70 bellek tasarrufu

### 3.3 setState Azaltma

**Dosyalar**:
- [apps/mobile/lib/pages/service_request_form_page.dart](apps/mobile/lib/pages/service_request_form_page.dart) (25+ setState)
- [apps/mobile/lib/pages/activity_form_page.dart](apps/mobile/lib/pages/activity_form_page.dart) (31+ setState)
- [apps/mobile/lib/pages/crm_page.dart](apps/mobile/lib/pages/crm_page.dart)

**Strateji**:
1. Form state'ini Riverpod StateNotifierProvider'a taşı
2. TextEditingController kullanımını ValueNotifier ile değiştir
3. setState scope'unu minimize et (sadece değişen widget rebuild olsun)

**Örnek**:
```dart
// Form state provider
final serviceRequestFormProvider = StateNotifierProvider<ServiceRequestFormNotifier, ServiceRequestFormState>(
  (ref) => ServiceRequestFormNotifier(),
);

class ServiceRequestFormNotifier extends StateNotifier<ServiceRequestFormState> {
  ServiceRequestFormNotifier() : super(ServiceRequestFormState.initial());

  void updateTitle(String title) => state = state.copyWith(title: title);
  void updateDescription(String desc) => state = state.copyWith(description: desc);
  // ...diğer field'lar
}
```

---

## 📦 FAZ 4: BÜYÜK DOSYA REFACTORİNG (Düşük Aciliyet, Yüksek Değer)

**Tahmini Süre**: 5-7 gün
**Etki**: Maintainability, takım verimliliği

### 4.1 Hedef Dosyalar (1000+ satır)

1. **[service_request_form_page.dart](apps/mobile/lib/pages/service_request_form_page.dart)** (2,162 satır)
   - Bölünme: `service_request_form/` klasörü
   - Widget'lar: `basic_info_section.dart`, `contact_section.dart`, `warranty_section.dart`, vb.

2. **[crm_page.dart](apps/mobile/lib/pages/crm_page.dart)** (1,656 satır)
   - Bölünme: `crm/` klasörü
   - Widget'lar: `activity_list.dart`, `filter_section.dart`, `stats_section.dart`

3. **[service_slip_form_page.dart](apps/mobile/lib/pages/service_slip_form_page.dart)** (1,441 satır)
   - Bölünme: `service_slip_form/` klasörü

4. **[service_slip_pdf_service.dart](apps/mobile/lib/services/service_slip_pdf_service.dart)** (1,189 satır)
   - Bölünme: `pdf/` klasörü
   - Sınıflar: `PdfTemplateBuilder`, `PdfDataFetcher`, `PdfGenerator`

5. **[activity_form_page.dart](apps/mobile/lib/pages/activity_form_page.dart)** (1,480 satır)
   - Bölünme: `activity_form/` klasörü

**Hedef**: Hiçbir dosya 500 satırı geçmesin

### 4.2 PDF Service Paralelleştirme

**Dosya**: [apps/mobile/lib/services/service_slip_pdf_service.dart](apps/mobile/lib/services/service_slip_pdf_service.dart#L22-L195)

**Mevcut**: 6+ sıralı request (waterfall)
**Hedef**: Tüm data fetch'leri Future.wait() ile paralel

```dart
final [profileData, companyData, templateData, serviceItems, logoImage, signatures] =
  await Future.wait([
    _supabase.from('profiles').select('company_id').eq('id', userId).maybeSingle(),
    _supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
    _supabase.from('service_templates').select('*').eq('id', templateId).single(),
    _supabase.from('service_items').select('*').eq('service_id', serviceId),
    _fetchLogoImage(companyId),
    _fetchSignatures(serviceId),
  ]);
```

**Etki**: PDF oluşturma %60 daha hızlı

---

## 🔧 FAZ 5: PAKET GÜNCELLEMELERİ (Bonus)

**Tahmini Süre**: 1 gün
**Etki**: Güvenlik, bug fixes, yeni özellikler

### Güncellenecek Paketler

**pubspec.yaml değişiklikleri**:
```yaml
dependencies:
  # State Management
  flutter_riverpod: ^3.0.3

  # Backend
  supabase_flutter: ^2.12.0        # 2.10.0 → 2.12.0

  # Push Notifications
  firebase_core: ^4.3.0            # 4.2.1 → 4.3.0
  firebase_messaging: ^16.1.0      # 16.0.4 → 16.1.0

  # Environment Variables (BREAKING)
  flutter_dotenv: ^6.0.0           # 5.2.1 → 6.0.0

  # File Sharing (BREAKING)
  share_plus: ^12.0.1              # 10.1.2 → 12.0.1

  # Signature (BREAKING)
  signature: ^6.3.0                # 5.4.0 → 6.3.0

  # Navigation
  go_router: ^17.0.1               # 17.0.0 → 17.0.1

  # Local Storage
  shared_preferences: ^2.5.4       # 2.2.2 → 2.5.4
```

**Breaking Changes Test**:
1. `flutter_dotenv` v6: `.env` yükleme API değişikliği (documentation check)
2. `share_plus` v12: Share API güncelleme (test share fonksiyonları)
3. `signature` v6: Signature widget API değişikliği (test signature capture)

---

## 📝 FAZ 6: KOD KALİTESİ İYİLEŞTİRMELERİ (Opsiyonel)

**Tahmini Süre**: 1-2 gün

### 6.1 Linter Kuralları Güçlendir

**Dosya**: [apps/mobile/analysis_options.yaml](apps/mobile/analysis_options.yaml)

```yaml
linter:
  rules:
    # Performans
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    avoid_unnecessary_containers: true
    sized_box_for_whitespace: true

    # Kod kalitesi
    always_declare_return_types: true
    require_trailing_commas: true
    prefer_single_quotes: true
    sort_constructors_first: true

    # Production
    avoid_print: true                # print() kullanımını yasakla
```

### 6.2 Logger Service Ekle

**Yeni Dosya**: [apps/mobile/lib/services/logger_service.dart](apps/mobile/lib/services/logger_service.dart)

**Paket ekle**: `logger: ^2.0.2+1`

**Tüm print() statement'ları AppLogger ile değiştir**:
```dart
// Önce:
print('Dashboard istatistikleri getirme hatası: $e');

// Sonra:
AppLogger.error('Dashboard istatistikleri getirme hatası', e);
```

### 6.3 Deprecated API Fixes (666 uyarı)

**Ana sorun**: `Colors.withOpacity()` → `Colors.withValues(alpha:)`

**Bulk replace**:
```dart
// Önce:
Colors.white.withOpacity(0.25)
Colors.grey.withOpacity(0.1)

// Sonra:
Colors.white.withValues(alpha: 0.25)
Colors.grey.withValues(alpha: 0.1)
```

**Tooling**: VS Code find/replace ile toplu düzeltme

---

## 📋 UYGULAMA SIRASI VE BAĞIMLILIKLAR

### Hafta 1: Kritik Performans Düzeltmeleri
- **Gün 1-2**: Faz 1.1-1.3 (Duplicate provider, employee cache, dashboard optimization)
- **Gün 3-4**: Faz 1.4-1.5 (MainLayout fix, refresh optimization)
- **Gün 5**: Test ve doğrulama

### Hafta 2: Önbellekleme ve Widget Optimizasyonu
- **Gün 1-2**: Faz 2.1-2.2 (Cache service, provider caching)
- **Gün 3**: Faz 2.3 (Pagination)
- **Gün 4-5**: Faz 3.1-3.2 (Const constructors, ListView.builder)

### Hafta 3: Büyük Refactoring
- **Gün 1-3**: Faz 4.1 (Büyük dosyaları böl - en kritik 2-3 dosya)
- **Gün 4**: Faz 4.2 (PDF service paralelleştirme)
- **Gün 5**: Faz 3.3 (setState azaltma)

### Hafta 4: Paketler ve Kalite (Opsiyonel)
- **Gün 1**: Faz 5 (Paket güncellemeleri + test)
- **Gün 2-3**: Faz 6 (Linter, logger, deprecated fixes)
- **Gün 4-5**: Final test ve dokumentasyon

---

## ✅ TEST STRATEJİSİ

### Her Faz Sonrası:
1. **Manuel Test**:
   - Dashboard yükleme testi
   - Activity oluşturma/güncelleme
   - PDF oluşturma
   - Refresh fonksiyonları

2. **Performans Metrikleri**:
   - Flutter DevTools ile rebuild sayısı
   - Network tab ile API çağrı sayısı
   - Memory profiler ile bellek kullanımı
   - Timeline ile frame render süreleri

3. **Regresyon Testi**:
   - Tüm ana akışları test et
   - Edge case'leri kontrol et
   - Error handling doğrula

### Hedef Metrikler:
- ✅ Dashboard yükleme: <1 saniye (şu an: 2-3 saniye)
- ✅ API çağrıları: %60 azalma (örn: Dashboard 5 → 2)
- ✅ Widget rebuilds: %40 azalma
- ✅ Memory usage: %30 azalma (büyük listeler için)

---

## 🎯 KRİTİK DOSYALAR

### Faz 1 (Must-Fix):
1. [apps/mobile/lib/providers/dashboard_provider.dart](apps/mobile/lib/providers/dashboard_provider.dart) - Duplicate provider sil
2. [apps/mobile/lib/providers/activity_provider.dart](apps/mobile/lib/providers/activity_provider.dart) - Tek kaynak
3. [apps/mobile/lib/services/dashboard_service.dart](apps/mobile/lib/services/dashboard_service.dart) - Paralelleştir
4. [apps/mobile/lib/services/activity_service.dart](apps/mobile/lib/services/activity_service.dart) - Employee cache
5. [apps/mobile/lib/shared/layouts/main_layout.dart](apps/mobile/lib/shared/layouts/main_layout.dart) - Provider watch fix

### Faz 2 (High Value):
6. [apps/mobile/lib/services/cache_service.dart](apps/mobile/lib/services/cache_service.dart) - YENİ: Cache implementasyonu
7. Tüm provider dosyaları - Cache entegrasyonu
8. Tüm service dosyaları - Pagination ekleme

### Faz 3-4 (Long-term):
9. [apps/mobile/lib/pages/service_request_form_page.dart](apps/mobile/lib/pages/service_request_form_page.dart) - Böl ve setState azalt
10. [apps/mobile/lib/services/service_slip_pdf_service.dart](apps/mobile/lib/services/service_slip_pdf_service.dart) - Paralelleştir

---

## ⚠️ RİSK YÖNETİMİ

### Yüksek Riskli Değişiklikler:
1. **Duplicate Provider Fix**: Tüm dashboard ve CRM'i etkileyebilir
   - **Önlem**: Her ekranı ayrı ayrı test et

2. **Major Package Updates**: Breaking API changes
   - **Önlem**: Feature branch'te test et, changelog'ları oku

3. **Büyük Dosya Bölme**: Yeni bug'lar oluşturabilir
   - **Önlem**: İyi test coverage, incremental refactoring

### Rollback Stratejisi:
- Her faz için ayrı git branch
- Her faz sonrası git tag
- CI/CD olmadığı için manuel test checklistleri

---

## 🎉 BEKLENEN SONUÇLAR

### Faz 1 Sonrası (Hafta 1):
- ✅ Runtime provider hatası gitti
- ✅ Dashboard 4 yerine 2 API çağrısı
- ✅ Employee ID cache (her aktivitede 2-3 çağrı tasarrufu)
- ✅ MainLayout gereksiz rebuild yok

**Ölçülebilir**: Dashboard yükleme 3 saniye → 1.2 saniye

### Faz 2 Sonrası (Hafta 2):
- ✅ Tüm liste sorguları cache'lenmiş
- ✅ 5 dakika TTL ile API çağrıları %70 azaldı
- ✅ Pagination ile ilk yükleme %80 hızlı
- ✅ Const widget'lar rebuild edilmiyor

**Ölçülebilir**: Customer listesi 100 kayıt → 50 kayıt, 3 saniye → 0.5 saniye

### Faz 3-4 Sonrası (Hafta 3):
- ✅ Hiçbir dosya 500 satırı geçmiyor
- ✅ PDF oluşturma 6 sıralı → 1 paralel request
- ✅ setState çağrıları %50 azaldı
- ✅ Form state'leri Riverpod'ta

**Ölçülebilir**: Kod review süresi %40 azalma, PDF oluşturma 5 saniye → 2 saniye

### Faz 5-6 Sonrası (Hafta 4):
- ✅ Tüm paketler güncel
- ✅ Zero deprecated warnings
- ✅ Production-ready logging
- ✅ Strict linter rules

**Ölçülebilir**: Sıfır build warning, daha iyi developer experience

---

## 📌 ÖNEMLİ NOTLAR

1. **Platform-Agnostic**: Android SDK/iOS deployment target sorunlarıyla uğraşmıyoruz, sadece Dart/Flutter optimizasyonu
2. **Breaking Changes OK**: Major package updates kabul edildi, test edeceğiz
3. **Öncelik Sırası**: Performans > Code Quality > Documentation
4. **İnkremental Yaklaşım**: Her faz bağımsız test edilebilir, rollback yapılabilir
5. **Git Strategy**: Her faz ayrı branch, PR'lar ile merge

---

## 🚦 İLERLEME TAKİBİ

Implementasyon sırasında her faz için:
- [ ] Kod değişiklikleri
- [ ] Manuel test
- [ ] Performans metrik ölçümü
- [ ] Git commit + tag
- [ ] Sonraki faza geçiş onayı

Hadi başlayalım! 🚀
