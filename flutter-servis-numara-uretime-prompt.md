# Flutter Mobil Uygulama - Servis Numarası Üretimi Prompt

## 📱 Flutter'da Servis Talebi Oluşturma - Kayıt Anında Numara Üretimi

### Görev
Yeni servis talebi oluşturma sayfasında, kayıt anında otomatik servis numarası üretimi ve race condition koruması ekle.

---

## 🎯 Gereksinimler

### 1. Servis Numarası Üretimi
- **Zamanlama:** Form açıldığında değil, **kayıt anında** numara üretilmeli
- **Format:** `SRV-{YYYY}-{0001}` (örnek: `SRV-2025-0001`)
- **API Endpoint:** Supabase'den `service_number_format` ayarını al ve numara üret
- **Kullanıcı Girişi:** Kullanıcı manuel numara girebilir (opsiyonel)

### 2. Race Condition Koruması
- İki kullanıcı aynı anda kayıt yaparsa:
  - Her ikisi de aynı numarayı alabilir
  - İlk kayıt başarılı olur
  - İkinci kayıt unique constraint hatası alır (PostgreSQL error code: 23505)
  - Sistem otomatik olarak yeni numara üretmeli ve tekrar denemeli
  - Maksimum 5 deneme yapılmalı

### 3. Veritabanı Yapısı
- **Tablo:** `service_requests`
- **Kolon:** `service_number` (text, nullable)
- **Unique Constraint:** `company_id + service_number` (sadece null olmayanlar için)
- **Index:** `idx_service_requests_company_service_number`

---

## 🔧 Teknik Detaylar

### API Endpoint'leri

#### 1. Servis Numarası Üretme
```dart
// Supabase RPC veya REST API kullan
Future<String> generateServiceNumber(String companyId) async {
  // Supabase'de tanımlı RPC fonksiyonu veya
  // number_formats tablosundan format al ve numara üret
  // Format: 'SRV-{YYYY}-{0001}'
}
```

#### 2. Servis Talebi Oluşturma
```dart
Future<ServiceRequest> createServiceRequest({
  required String companyId,
  required String serviceTitle,
  required String serviceDescription,
  String? serviceNumber, // Kullanıcı girerse bu kullanılır
  // ... diğer alanlar
}) async {
  // Retry mekanizması ile kayıt yap
}
```

### Hata Kodları
- **23505:** PostgreSQL unique constraint violation
- Bu hata alındığında yeni numara üret ve tekrar dene

---

## 💻 Flutter Kod Yapısı

### 1. Servis Numarası Üretim Servisi

```dart
class ServiceNumberGenerator {
  final SupabaseClient supabase;
  
  ServiceNumberGenerator(this.supabase);
  
  /// Servis numarası üretir
  /// Format: SRV-{YYYY}-{0001}
  Future<String> generateServiceNumber(String companyId) async {
    try {
      // 1. Format'ı al (number_formats tablosundan veya default)
      final format = await _getNumberFormat(companyId);
      
      // 2. Mevcut en yüksek numarayı bul
      final maxNumber = await _getMaxServiceNumber(companyId);
      
      // 3. Bir sonraki numarayı üret
      final year = DateTime.now().year;
      final nextNumber = (maxNumber ?? 0) + 1;
      final serviceNumber = 'SRV-$year-${nextNumber.toString().padLeft(4, '0')}';
      
      // 4. Bu numara kullanılıyor mu kontrol et
      final exists = await _checkNumberExists(serviceNumber, companyId);
      if (exists) {
        // Varsa bir sonrakini dene
        return await generateServiceNumber(companyId);
      }
      
      return serviceNumber;
    } catch (e) {
      // Fallback: timestamp kullan
      return 'SRV-${DateTime.now().millisecondsSinceEpoch}';
    }
  }
  
  Future<String> _getNumberFormat(String companyId) async {
    // number_formats tablosundan service_number_format'ı al
    // Veya default: 'SRV-{YYYY}-{0001}'
  }
  
  Future<int?> _getMaxServiceNumber(String companyId) async {
    // service_requests tablosundan company_id'ye göre
    // en yüksek service_number'ı bul
    final year = DateTime.now().year;
    final response = await supabase
        .from('service_requests')
        .select('service_number')
        .eq('company_id', companyId)
        .not('service_number', 'is', null)
        .like('service_number', 'SRV-$year-%')
        .order('service_number', ascending: false)
        .limit(1)
        .single();
    
    if (response.data == null) return null;
    
    // SRV-2025-0001 formatından 0001 kısmını çıkar
    final number = response.data['service_number'] as String;
    final match = RegExp(r'SRV-\d{4}-(\d+)').firstMatch(number);
    if (match != null) {
      return int.tryParse(match.group(1) ?? '0');
    }
    return null;
  }
  
  Future<bool> _checkNumberExists(String number, String companyId) async {
    final response = await supabase
        .from('service_requests')
        .select('id')
        .eq('company_id', companyId)
        .eq('service_number', number)
        .limit(1)
        .maybeSingle();
    
    return response.data != null;
  }
}
```

### 2. Servis Talebi Oluşturma (Retry Mekanizması ile)

```dart
class ServiceRequestService {
  final SupabaseClient supabase;
  final ServiceNumberGenerator numberGenerator;
  
  ServiceRequestService(this.supabase, this.numberGenerator);
  
  /// Servis talebi oluşturur (retry mekanizması ile)
  Future<ServiceRequest> createServiceRequest({
    required String companyId,
    required String serviceTitle,
    required String serviceDescription,
    String? serviceNumber, // Kullanıcı girerse bu kullanılır
    // ... diğer alanlar
  }) async {
    int attempts = 0;
    const maxAttempts = 5;
    String? currentServiceNumber = serviceNumber?.trim();
    
    // Eğer kullanıcı numara girmediyse, otomatik üret
    if (currentServiceNumber == null || currentServiceNumber.isEmpty) {
      try {
        currentServiceNumber = await numberGenerator.generateServiceNumber(companyId);
      } catch (e) {
        throw Exception('Servis numarası üretilemedi: $e');
      }
    }
    
    // Retry mekanizması ile kayıt yap
    while (attempts < maxAttempts) {
      try {
        final response = await supabase
            .from('service_requests')
            .insert({
              'company_id': companyId,
              'service_title': serviceTitle,
              'service_request_description': serviceDescription,
              'service_number': currentServiceNumber,
              'service_status': 'new',
              'service_priority': 'medium',
              // ... diğer alanlar
            })
            .select()
            .single();
        
        return ServiceRequest.fromJson(response.data);
        
      } on PostgrestException catch (e) {
        // Unique constraint hatası (23505)
        if (e.code == '23505' && 
            e.message?.contains('service_number') == true) {
          attempts++;
          
          if (attempts >= maxAttempts) {
            throw Exception('Servis numarası çakışması. Lütfen tekrar deneyin.');
          }
          
          // Yeni numara üret
          try {
            currentServiceNumber = await numberGenerator.generateServiceNumber(companyId);
          } catch (genError) {
            throw Exception('Yeni servis numarası üretilemedi: $genError');
          }
          
          // Exponential backoff: 100ms, 200ms, 300ms, ...
          await Future.delayed(Duration(milliseconds: 100 * attempts));
          continue; // Tekrar dene
        }
        
        // Diğer hatalar için direkt fırlat
        rethrow;
      } catch (e) {
        // Beklenmeyen hatalar
        throw Exception('Servis kaydı oluşturulamadı: $e');
      }
    }
    
    throw Exception('Servis kaydı oluşturulamadı. Maksimum deneme sayısına ulaşıldı.');
  }
}
```

### 3. UI (Form Sayfası)

```dart
class NewServiceRequestPage extends StatefulWidget {
  @override
  _NewServiceRequestPageState createState() => _NewServiceRequestPageState();
}

class _NewServiceRequestPageState extends State<NewServiceRequestPage> {
  final _formKey = GlobalKey<FormState>();
  final _serviceTitleController = TextEditingController();
  final _serviceDescriptionController = TextEditingController();
  final _serviceNumberController = TextEditingController(); // Opsiyonel
  
  final _serviceRequestService = ServiceRequestService(
    Supabase.instance.client,
    ServiceNumberGenerator(Supabase.instance.client),
  );
  
  bool _isLoading = false;
  
  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final companyId = await _getCurrentCompanyId(); // Kullanıcının company_id'si
      
      // Kayıt anında numara üretilecek (eğer kullanıcı girmediyse)
      final serviceNumber = _serviceNumberController.text.trim().isEmpty
          ? null
          : _serviceNumberController.text.trim();
      
      final serviceRequest = await _serviceRequestService.createServiceRequest(
        companyId: companyId,
        serviceTitle: _serviceTitleController.text,
        serviceDescription: _serviceDescriptionController.text,
        serviceNumber: serviceNumber, // null ise otomatik üretilecek
        // ... diğer alanlar
      );
      
      // Başarılı
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Servis talebi oluşturuldu: ${serviceRequest.serviceNumber}')),
      );
      
      Navigator.pop(context, serviceRequest);
      
    } catch (e) {
      // Hata
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Yeni Servis Talebi')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            // Servis Başlığı
            TextFormField(
              controller: _serviceTitleController,
              decoration: InputDecoration(
                labelText: 'Servis Başlığı *',
                hintText: 'Örn: Klima bakımı, Elektrik arızası...',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Servis başlığı zorunludur';
                }
                return null;
              },
            ),
            
            SizedBox(height: 16),
            
            // Servis Numarası (Opsiyonel)
            TextFormField(
              controller: _serviceNumberController,
              decoration: InputDecoration(
                labelText: 'Servis No',
                hintText: 'Kayıt anında otomatik üretilecek',
                helperText: 'Boş bırakırsanız otomatik numara üretilir',
              ),
            ),
            
            SizedBox(height: 16),
            
            // Servis Açıklaması
            TextFormField(
              controller: _serviceDescriptionController,
              decoration: InputDecoration(
                labelText: 'Servis Açıklaması *',
                hintText: 'Servisin detaylarını açıklayın...',
              ),
              maxLines: 5,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Servis açıklaması zorunludur';
                }
                return null;
              },
            ),
            
            SizedBox(height: 32),
            
            // Kaydet Butonu
            ElevatedButton(
              onPressed: _isLoading ? null : _submitForm,
              child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🔄 Akış Diyagramı

```
1. Kullanıcı formu dolduruyor
   ↓
2. "Kaydet" butonuna tıklıyor
   ↓
3. service_number boş mu?
   ├─ Evet → generateServiceNumber() çağrılıyor
   │          ↓
   │          SRV-2025-0001 üretiliyor
   │          ↓
   └─ Hayır → Kullanıcının girdiği numara kullanılıyor
   ↓
4. Supabase'e insert yapılıyor
   ↓
5. Başarılı mı?
   ├─ Evet → ✅ Kayıt tamamlandı
   └─ Hayır → Hata kodu 23505 mi? (unique constraint)
       ├─ Evet → Yeni numara üret (+1)
       │          ↓
       │          Tekrar dene (max 5 deneme)
       └─ Hayır → ❌ Hata göster
```

---

## ⚠️ Önemli Notlar

### 1. Unique Constraint
- Veritabanında `company_id + service_number` için unique constraint var
- Bu constraint sayesinde aynı şirket içinde aynı numara kullanılamaz
- Null değerler constraint'e dahil değil

### 2. Retry Mekanizması
- Maksimum 5 deneme yapılmalı
- Her denemede yeni numara üretilmeli
- Exponential backoff kullanılmalı (100ms, 200ms, 300ms, ...)

### 3. Hata Yönetimi
- Kullanıcıya anlaşılır hata mesajları gösterilmeli
- Network hataları için retry yapılmalı
- Unique constraint hataları için otomatik çözüm yapılmalı

### 4. Performans
- Numara üretimi kayıt anında yapılmalı (form açıldığında değil)
- Gereksiz API çağrılarından kaçınılmalı
- Cache kullanılabilir (format bilgisi için)

---

## 📋 Test Senaryoları

1. ✅ Normal kayıt (numara boş) - Otomatik üretilmeli
2. ✅ Manuel numara girişi - Girilen numara kullanılmalı
3. ✅ Race condition - İki kullanıcı aynı anda kayıt yaparsa çakışma olmamalı
4. ✅ Unique constraint - Aynı numara iki kez kaydedilememeli
5. ✅ Retry mekanizması - Çakışma durumunda yeni numara üretilmeli
6. ✅ Network hatası - Retry yapılmalı
7. ✅ Timeout - Uygun hata mesajı gösterilmeli

---

## 🔗 İlgili Dosyalar (Web Uygulaması)

- `src/pages/service/NewServiceRequest.tsx` - Web uygulaması implementasyonu
- `src/utils/numberFormat.ts` - Numara üretim mantığı
- `src/hooks/useNumberGenerator.ts` - React hook
- `supabase/migrations/add_service_number_unique_constraint.sql` - Unique constraint

---

## 📝 Özet

**Flutter geliştiricisine:**
1. `ServiceNumberGenerator` sınıfı oluştur (numara üretimi için)
2. `ServiceRequestService` sınıfı oluştur (retry mekanizması ile)
3. Form sayfasında kayıt anında numara üret
4. Unique constraint hatası (23505) alındığında yeni numara üret ve tekrar dene
5. Maksimum 5 deneme yap
6. Kullanıcıya anlaşılır hata mesajları göster

**Önemli:** Numara üretimi **form açıldığında değil, kayıt anında** yapılmalı!

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-01-XX  
**Versiyon:** 1.0


