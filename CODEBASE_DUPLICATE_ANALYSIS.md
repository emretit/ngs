# Codebase Tekrarlanan Kod Analizi

**Tarih:** 2025-01-27  
**Amaç:** 6 aylık geliştirme sürecinde oluşan tekrarlanan kodları tespit etmek ve temizleme planı oluşturmak

---

## 🔍 TESPİT EDİLEN TEKRARLAR

### 1. **formatCurrency Fonksiyonu - 5+ Farklı Yerde**

#### Mevcut Implementasyonlar:

1. **`src/lib/utils.ts`** (Satır 8-19)
   ```typescript
   export function formatCurrency(amount: number, currency: string = 'TRY'): string {
     const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
     const formatter = new Intl.NumberFormat('tr-TR', {
       style: 'currency',
       currency: currencyCode,
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     });
     return formatter.format(amount);
   }
   ```

2. **`src/utils/formatters.ts`** (Satır 40-50)
   - `normalizeCurrency` kullanıyor
   - NaN/undefined kontrolü var
   - Daha gelişmiş

3. **`src/components/proposals/form/items/utils/currencyUtils.ts`** (Satır 28-42)
   - `formatCurrencyValue` adında
   - Aynı mantık

4. **`src/components/products/utils/priceUtils.ts`** (Satır 20-27)
   - `formatCurrency` adında
   - Aynı mantık

5. **`src/components/proposals/form/items/hooks/currency/useCurrencyFormatter.ts`** (Satır 6-21)
   - Hook içinde
   - Aynı mantık

#### Öneri:
- **Tek kaynak:** `src/utils/formatters.ts` içindeki versiyonu kullan (NaN kontrolü var)
- Diğerlerini kaldır ve import'ları güncelle

---

### 2. **formatDate Fonksiyonu - 4+ Farklı Yerde**

#### Mevcut Implementasyonlar:

1. **`src/lib/utils.ts`** (Satır 21-31)
   ```typescript
   export function formatDate(date: string | Date | null | undefined): string {
     if (!date) return "-";
     const d = new Date(date);
     const lang = typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || 'tr') : 'tr';
     const locale = lang === 'en' ? 'en-US' : 'tr-TR';
     return d.toLocaleDateString(locale, {
       year: "numeric",
       month: "short",
       day: "numeric",
     });
   }
   ```

2. **`src/utils/dateUtils.ts`** (Satır 21-25)
   - `date-fns` kullanıyor
   - `getLocale()` fonksiyonu var
   - Daha esnek (format string parametresi alıyor)

3. **`src/utils/pdfHelpers.ts`** (Satır 25-35)
   - `date-fns` kullanıyor
   - Sadece 'dd.MM.yyyy' formatı
   - PDF için özel

4. **`src/components/employees/details/utils/formatDate.ts`** (Satır 2-9)
   - Basit versiyon
   - Sadece `toLocaleDateString` kullanıyor

#### Öneri:
- **Tek kaynak:** `src/utils/dateUtils.ts` içindeki versiyonu kullan (en esnek)
- Diğerlerini kaldır ve import'ları güncelle
- PDF için özel format gerekirse `dateUtils.ts`'den import et

---

### 3. **normalizeCurrency Fonksiyonu - 2 Yerde**

1. **`src/utils/formatters.ts`** (Satır 7-10)
2. **`src/components/proposals/form/items/utils/currencyUtils.ts`** (Satır 10-13)

**Öneri:** `src/utils/formatters.ts` içindekini kullan, diğerini kaldır.

---

### 4. **Supabase Query Pattern'leri - 630+ Kullanım**

#### Tekrarlanan Pattern:
```typescript
// Her hook'ta aynı pattern:
const { userData } = useCurrentUser();
if (!userData?.company_id) {
  return [];
}
let query = supabase
  .from("table_name")
  .select("...")
  .eq("company_id", userData.company_id);
```

#### Etkilenen Dosyalar (Örnekler):
- `src/hooks/useOpportunities.ts`
- `src/hooks/useProposals.ts`
- `src/hooks/useOrders.ts`
- `src/hooks/useDeliveries.ts`
- `src/hooks/useActivities.ts`
- ... ve 200+ dosya daha

#### Öneri:
**Merkezi Query Builder Oluştur:**
```typescript
// src/utils/supabaseQueryBuilder.ts
export const buildCompanyQuery = (
  table: string,
  select: string,
  companyId: string | null | undefined
) => {
  if (!companyId) {
    throw new Error('Company ID is required');
  }
  return supabase
    .from(table)
    .select(select)
    .eq('company_id', companyId);
};
```

---

### 5. **Currency Symbol Fonksiyonları**

#### Tekrarlanan:
- `getCurrencySymbol` - `currencyUtils.ts` içinde
- `addCurrencySymbol` - `currencyUtils.ts` içinde
- Benzer mantık birçok yerde

**Öneri:** `src/utils/formatters.ts` içinde merkezileştir.

---

## 📊 İSTATİSTİKLER

- **formatCurrency kullanımı:** 152 dosyada
- **formatDate kullanımı:** 75 dosyada
- **company_id filtresi:** 630+ yerde
- **normalizeCurrency:** 2 yerde (aynı kod)

---

## 🎯 ÖNCELİKLENDİRİLMİŞ TEMİZLEME PLANI

### Faz 1: Utility Fonksiyonları (Yüksek Öncelik)
1. ✅ `formatCurrency` → `src/utils/formatters.ts`'e birleştir
2. ✅ `formatDate` → `src/utils/dateUtils.ts`'e birleştir
3. ✅ `normalizeCurrency` → `src/utils/formatters.ts`'e birleştir

**Tahmini Süre:** 2-3 saat  
**Etki:** 200+ dosyada import değişikliği

### Faz 2: Supabase Query Pattern'leri (Orta Öncelik)
1. ✅ Merkezi query builder oluştur
2. ✅ Hook'ları yavaş yavaş migrate et
3. ✅ Test et

**Tahmini Süre:** 1-2 gün  
**Etki:** 200+ hook dosyası

### Faz 3: Kullanılmayan Kod Temizliği (Düşük Öncelik)
1. ✅ Kullanılmayan import'ları bul
2. ✅ Kullanılmayan fonksiyonları tespit et
3. ✅ Dead code'u temizle

**Tahmini Süre:** 1 gün  
**Etki:** Kod boyutunu azaltır

---

## 🔧 UYGULAMA ADIMLARI

### Adım 1: formatCurrency Birleştirme
```bash
# 1. src/utils/formatters.ts içindeki versiyonu güncelle (en iyi versiyonu seç)
# 2. Diğer dosyalardaki formatCurrency'leri kaldır
# 3. Import'ları güncelle: import { formatCurrency } from '@/utils/formatters'
```

### Adım 2: formatDate Birleştirme
```bash
# 1. src/utils/dateUtils.ts içindeki versiyonu güncelle
# 2. Diğer dosyalardaki formatDate'leri kaldır
# 3. Import'ları güncelle: import { formatDate } from '@/utils/dateUtils'
```

### Adım 3: Query Builder Oluşturma
```bash
# 1. src/utils/supabaseQueryBuilder.ts oluştur
# 2. Yeni hook'larda kullan
# 3. Eski hook'ları yavaş yavaş migrate et
```

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

1. **Breaking Changes:** Import değişiklikleri yaparken tüm dosyaları güncelle
2. **Test:** Her değişiklikten sonra test et
3. **Git:** Her faz için ayrı commit yap
4. **Backup:** Büyük değişikliklerden önce branch oluştur

---

## 📝 SONRAKI ADIMLAR

1. Bu raporu gözden geçir
2. Öncelikleri belirle
3. Faz 1'den başla (utility fonksiyonları)
4. Her fazı tamamladıkça buraya işaretle

---

## 🔍 EK ANALİZ GEREKTİREN ALANLAR

1. **Hook Pattern'leri:** `useXXXInfiniteScroll` hook'ları çok benzer
2. **Error Handling:** Supabase error handling tekrarlanıyor
3. **Toast Messages:** Hata mesajları tekrarlanıyor
4. **Type Definitions:** Benzer type'lar farklı dosyalarda

---

**Not:** Bu analiz ilk aşama. Daha detaylı analiz için codebase'i daha derinlemesine incelemek gerekebilir.

