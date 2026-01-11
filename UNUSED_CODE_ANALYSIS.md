# Kullanılmayan Kod Analiz Raporu

**Tarih:** 11 Ocak 2026  
**Analiz Kapsamı:** /Users/emreaydin/pafta/src dizini

## Özet

Bu rapor, codebase içinde navigasyonu olmayan ve kullanılmayan eski kodları tespit etmek için yapılan manuel analizin sonuçlarını içermektedir.

### İstatistikler
- **Toplam Page Dosyası:** 214
- **Toplam Component Dosyası:** 1,211
- **Route'larda Tanımlı Sayfa:** ~150+
- **Kullanılmayan/Eski Sayfa:** 8+

---

## 1. Kesinlikle Kullanılmayan Sayfalar

### 1.1 CustomerNew.tsx
- **Konum:** `src/pages/CustomerNew.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** Müşteri oluşturma sayfası, ancak `CustomerForm` kullanılıyor
- **Route'da Kullanılan Alternatif:** `/customers/new` -> `CustomerForm` component'i kullanılıyor
- **Öneri:** SİLİNEBİLİR - CustomerForm zaten bu işlevi yapıyor

### 1.2 BudgetManagement.tsx
- **Konum:** `src/pages/BudgetManagement.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor - Deprecated
- **Açıklama:** Dosyanın içinde @deprecated etiketi var, sadece type export için tutuluyor
```typescript
/**
 * @deprecated Bu dosya artık kullanılmıyor. 
 * BudgetManagement component'i BudgetDashboard'a taşındı.
 */
```
- **Öneri:** SİLİNEBİLİR - Type'ları BudgetDashboard'a taşıyıp silinebilir

### 1.3 EmbeddedAIDemo.tsx
- **Konum:** `src/pages/EmbeddedAIDemo.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** Groq AI entegrasyonu için demo sayfası
- **Öneri:** DEV/DEMO amaçlı - Canlıda kullanılmıyorsa SİLİNEBİLİR

### 1.4 AIWorkflows.tsx
- **Konum:** `src/pages/AIWorkflows.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** AI workflow yönetim sayfası, mock data ile çalışıyor
- **Öneri:** GELECEK ÖZELLİK - Şu an kullanılmıyor, geliştirilecekse TUTULABILI, değilse SİLİNEBİLİR

### 1.5 AIInsights.tsx
- **Konum:** `src/pages/AIInsights.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** AI içgörüleri sayfası
- **Öneri:** GELECEK ÖZELLİK - Şu an kullanılmıyor, geliştirilecekse TUTULABILI

### 1.6 Finance.tsx
- **Konum:** `src/pages/Finance.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** Eski finans sayfası, yerine `FinancialOverview` kullanılıyor
- **Öneri:** SİLİNEBİLİR

### 1.7 ProductMapping.tsx
- **Konum:** `src/pages/ProductMapping.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor, başka yerde de import edilmemiş
- **Açıklama:** Ürün eşleştirme sayfası
- **Öneri:** SİLİNEBİLİR

### 1.8 Service.tsx (Root)
- **Konum:** `src/pages/Service.tsx`
- **Durum:** ⚠️ Route'larda kullanılmıyor AMA başka yerlerde import edilebilir
- **Açıklama:** Servis yönetim ana sayfası - 1372 satır, çok büyük component
- **Route'da Kullanılan:** `/service` -> `ServiceDashboard` kullanılıyor
- **Öneri:** KONTROL EDİLMELİ - Eğer başka component'ler içinde kullanılmıyorsa SİLİNEBİLİR

---

## 2. Service Modülündeki Eski View Component'leri

Bu component'ler artık `ServiceManagement` içinde birleştirilmiş durumda:

### 2.1 ServiceListView.tsx
- **Konum:** `src/pages/service/ServiceListView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** Liste görünümü artık ServiceManagement içinde
- **Öneri:** SİLİNEBİLİR

### 2.2 ServiceKanbanView.tsx
- **Konum:** `src/pages/service/ServiceKanbanView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Açıklama:** Kanban görünümü artık ServiceManagement içinde
- **Öneri:** SİLİNEBİLİR

### 2.3 ServiceMapView.tsx
- **Konum:** `src/pages/service/ServiceMapView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Not:** `src/components/service/ServiceMapView.tsx` component'i kullanılıyor
- **Öneri:** SİLİNEBİLİR - Page versiyonu gereksiz

### 2.4 ServiceCalendarView.tsx
- **Konum:** `src/pages/service/ServiceCalendarView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Not:** `src/components/service/ServiceCalendarView.tsx` component'i kullanılıyor
- **Öneri:** SİLİNEBİLİR - Page versiyonu gereksiz

### 2.5 ServiceSchedulingView.tsx
- **Konum:** `src/pages/service/ServiceSchedulingView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Öneri:** SİLİNEBİLİR

### 2.6 ServiceTemplatesView.tsx
- **Konum:** `src/pages/service/ServiceTemplatesView.tsx`
- **Durum:** ❌ Route'larda kullanılmıyor
- **Öneri:** SİLİNEBİLİR

---

## 3. Backup Dosyaları

### 3.1 BankAccountDetail.tsx.backup
- **Konum:** `src/pages/BankAccountDetail.tsx.backup`
- **Öneri:** SİLİNEBİLİR

### 3.2 PartnerAccountDetail.tsx.backup
- **Konum:** `src/pages/PartnerAccountDetail.tsx.backup`
- **Öneri:** SİLİNEBİLİR

### 3.3 Proposals.tsx.backup
- **Konum:** `src/pages/Proposals.tsx.backup`
- **Öneri:** SİLİNEBİLİR

---

## 4. Redirect Component'leri (Geçici)

Bu component'ler geriye dönük uyumluluk için redirect yapıyor. Bir süre sonra silinebilir:

### 4.1 ServiceRedirect.tsx
- **Konum:** `src/pages/service/ServiceRedirect.tsx`
- **Durum:** ✅ Route'larda kullanılıyor (geçici)
- **Route'lar:**
  - `/service/list` -> redirect
  - `/service/kanban` -> redirect
  - `/service/scheduling` -> redirect
  - `/service/calendar` -> redirect
- **Öneri:** 3-6 ay sonra SİLİNEBİLİR (eski linklerin kullanılmadığından emin olunduktan sonra)

### 4.2 ServiceContractsRedirect.tsx
- **Konum:** `src/pages/service/ServiceContractsRedirect.tsx`
- **Durum:** ✅ Route'larda kullanılıyor (geçici)
- **Öneri:** 3-6 ay sonra SİLİNEBİLİR

### 4.3 ServiceAssetsRedirect.tsx
- **Konum:** `src/pages/service/ServiceAssetsRedirect.tsx`
- **Durum:** ✅ Route'larda kullanılıyor (geçici)
- **Öneri:** 3-6 ay sonra SİLİNEBİLİR

### 4.4 ServiceWarrantiesRedirect.tsx
- **Konum:** `src/pages/service/ServiceWarrantiesRedirect.tsx`
- **Durum:** ✅ Route'larda kullanılıyor (geçici)
- **Öneri:** 3-6 ay sonra SİLİNEBİLİR

### 4.5 ServiceMaintenanceRedirect.tsx
- **Konum:** `src/pages/service/ServiceMaintenanceRedirect.tsx`
- **Durum:** ✅ Route'larda kullanılıyor (geçici)
- **Öneri:** 3-6 ay sonra SİLİNEBİLİR

---

## 5. Öneri ve Aksiyon Planı

### Hemen Silinebilecek Dosyalar (8 adet)
1. ✅ `src/pages/CustomerNew.tsx`
2. ✅ `src/pages/BudgetManagement.tsx` (type'ları taşıdıktan sonra)
3. ✅ `src/pages/Finance.tsx`
4. ✅ `src/pages/service/ServiceListView.tsx`
5. ✅ `src/pages/service/ServiceKanbanView.tsx`
6. ✅ `src/pages/service/ServiceMapView.tsx`
7. ✅ `src/pages/service/ServiceCalendarView.tsx`
8. ✅ `src/pages/service/ServiceSchedulingView.tsx`
9. ✅ `src/pages/service/ServiceTemplatesView.tsx`

### Backup Dosyaları (3 adet)
1. ✅ `src/pages/BankAccountDetail.tsx.backup`
2. ✅ `src/pages/PartnerAccountDetail.tsx.backup`
3. ✅ `src/pages/Proposals.tsx.backup`

### Karar Verilmesi Gereken Dosyalar
1. ⚠️ `src/pages/EmbeddedAIDemo.tsx` - DEV amaçlı kullanılıyor mu?
2. ⚠️ `src/pages/AIWorkflows.tsx` - Geliştirilecek mi?
3. ⚠️ `src/pages/AIInsights.tsx` - Geliştirilecek mi?
4. ⚠️ `src/pages/ProductMapping.tsx` - Kullanılıyor mu?
5. ⚠️ `src/pages/Service.tsx` - Başka yerlerde import edilmiş mi?

### 3-6 Ay Sonra Silinecek (Redirect) Dosyalar
1. 📅 `src/pages/service/ServiceRedirect.tsx`
2. 📅 `src/pages/service/ServiceContractsRedirect.tsx`
3. 📅 `src/pages/service/ServiceAssetsRedirect.tsx`
4. 📅 `src/pages/service/ServiceWarrantiesRedirect.tsx`
5. 📅 `src/pages/service/ServiceMaintenanceRedirect.tsx`

---

## 6. Component Duplicate Analizi

### 6.1 ServiceMapView
- **Component:** `src/components/service/ServiceMapView.tsx` ✅ KULLANILIYOR
- **Page:** `src/pages/service/ServiceMapView.tsx` ❌ KULLANILMIYOR
- **Öneri:** Page versiyonunu SİL

### 6.2 ServiceCalendarView
- **Component:** `src/components/service/ServiceCalendarView.tsx` ✅ KULLANILIYOR
- **Page:** `src/pages/service/ServiceCalendarView.tsx` ❌ KULLANILMIYOR
- **Öneri:** Page versiyonunu SİL

---

## 7. Tahmini Kazanç

### Silinecek Dosya Sayısı
- **Kesin Silinebilir:** 11-12 dosya
- **Karar Sonrası:** +5 dosya (muhtemel)
- **Backup Dosyaları:** +3 dosya
- **Toplam:** ~20 dosya

### Kod Satırı Azalması
- Ortalama ~300-500 satır/dosya
- **Tahmini:** 6,000-10,000 satır kod azalması

### Faydalar
- ✅ Daha temiz codebase
- ✅ Daha hızlı build time
- ✅ Daha az karışıklık
- ✅ Daha kolay maintenance

---

## 8. Sonraki Adımlar

1. **Immediate Action (Bugün)**
   - Backup dosyalarını sil (.backup uzantılı)
   - BudgetManagement type'larını taşı ve sil
   - Finance.tsx'i sil

2. **This Week**
   - Service view component'lerini sil (list, kanban, map, calendar, scheduling, templates)
   - CustomerNew.tsx'i sil

3. **Decision Needed**
   - AI feature dosyaları için karar ver (kullanılacak mı?)
   - ProductMapping kullanımını kontrol et
   - Service.tsx'in başka yerlerde kullanımını kontrol et

4. **Long Term (3-6 months)**
   - Redirect component'lerinin kullanımını izle
   - Kullanılmadığından emin olunca sil

---

## 9. Dikkat Edilmesi Gerekenler

⚠️ **SİLMEDEN ÖNCE:**
1. Git commit yap (geri dönüş için)
2. Dosyaların import edilmediğinden emin ol:
   ```bash
   grep -r "from.*CustomerNew" src/
   grep -r "import.*CustomerNew" src/
   ```
3. Test et
4. Üretim ortamında link kullanımını kontrol et

⚠️ **RİSK YÖNETİMİ:**
- Dosyaları silmek yerine önce `_DEPRECATED` klasörüne taşı
- 1 ay bekle, sorun çıkmazsa sil
- Her adımı ayrı commit'te yap

---

**Hazırlayan:** AI Assistant  
**Son Güncelleme:** 11 Ocak 2026
