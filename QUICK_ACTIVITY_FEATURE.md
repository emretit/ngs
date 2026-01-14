# Hızlı Aktivite Ekleme Özelliği

## Özet

Fırsatlar sayfasındaki detay sheet'inde, dialog açmadan hızlı bir şekilde aktivite ekleyebilme özelliği eklendi.

## Yapılan Değişiklikler

### 1. Yeni Component: `QuickActivityForm.tsx`

**Dosya:** `/src/components/activities/QuickActivityForm.tsx`

Hızlı aktivite ekleme için minimal form bileşeni oluşturuldu. Bu form sadece temel bilgileri içerir:

- ✅ **Başlık** (zorunlu)
- ✅ **Durum** (todo, in_progress, completed, cancelled)
- ✅ **Önemli** (switch ile işaretleme)

**Otomatik Olarak Doldurular:**
- Fırsat ID (opportunityId)
- Müşteri ID ve ismi (varsa)
- Aktivite tipi: "opportunity"
- Öncelik: Önemli işaretliyse "high", değilse "medium"
- Company ID: Mevcut kullanıcıdan alınır

### 2. Güncelleme: `OpportunityDetailSheet.tsx`

**Dosya:** `/src/components/crm/OpportunityDetailSheet.tsx`

#### Eklenen Özellikler:

1. **Aktiviteleri Çekme:**
   - `useQuery` ile fırsata ait aktiviteler sorgulanıyor
   - Aktiviteler, görevli kişi bilgileriyle birlikte getiriliyor
   - Aktiviteler oluşturulma tarihine göre sıralanıyor (en yeni önce)

2. **Hızlı Form Entegrasyonu:**
   - "Yeni" butonu ile form açılıp kapanıyor
   - Form görünürken buton "İptal" olarak değişiyor
   - Aktivite başarıyla eklendiğinde form otomatik kapanıyor

3. **Aktivite Listesi:**
   - Her aktivite için durum badge'i
   - Önemli aktiviteler için yıldız ikonu
   - Oluşturulma tarihi ve görevli kişi bilgisi
   - Hover efekti ile kullanıcı deneyimi

4. **Boş Durum:**
   - Aktivite yoksa bilgilendirici mesaj gösteriliyor
   - Form açık değilse "Henüz aktivite bulunmuyor" mesajı

## Kullanıcı Deneyimi

### Aktivite Ekleme Akışı:

1. Fırsat detay sheet'i açılır
2. "Aktiviteler" bölümünde "Yeni" butonuna tıklanır
3. Hızlı form açılır (sheet içinde, dialog açılmaz)
4. Sadece başlık, durum ve önemli bilgisi girilir
5. "Oluştur" butonuna basılır
6. Aktivite eklenir ve form kapanır
7. Yeni aktivite listede görünür

### Avantajlar:

- ❌ Dialog açılmaz, sheet içinde kalınır
- ✅ Minimum alan girilir (sadece başlık zorunlu)
- ✅ Fırsat ve müşteri bilgisi otomatik atanır
- ✅ Hızlı ve kullanışlı
- ✅ Anında geri bildirim

## Teknik Detaylar

### State Yönetimi:
- `showQuickActivityForm`: Form görünürlüğünü kontrol eder
- `activities`: Fırsata ait aktiviteler listesi

### Query Invalidation:
Yeni aktivite eklendiğinde şu query'ler yenilenir:
- `['activities']`: Genel aktiviteler listesi
- `['opportunity-activities', opportunityId]`: İlgili fırsatın aktiviteleri

### Stil ve Tasarım:
- Gradient arka plan (blue-50 to indigo-50)
- Badge'ler ile durum gösterimi
- Hover efektleri
- Responsive tasarım
- Tutarlı spacing ve padding

## Test Önerileri

1. Fırsat detay sheet'ini açın
2. "Yeni" butonuna tıklayın
3. Sadece başlık girerek aktivite oluşturun
4. Aktivitenin listede göründüğünü kontrol edin
5. Farklı durum ve önemli kombinasyonları deneyin
6. Form iptal etme işlevini test edin

## İleride Eklenebilecek Özellikler

- [ ] Açıklama alanı (opsiyonel)
- [ ] Son tarih seçimi
- [ ] Görevli atama
- [ ] Aktivite tipi seçimi
- [ ] Aktivite düzenleme
- [ ] Aktivite silme
- [ ] Aktivite detay görüntüleme (tıklanınca)
