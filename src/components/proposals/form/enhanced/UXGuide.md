# B2B SaaS Teklif Oluşturma UX Rehberi

## 🎯 Genel UX Felsefesi

### Ana İlkeler
1. **Progresif Bilgi Toplama**: Kullanıcıyı küçük adımlarla ilerletme
2. **Bağlamsal Yardım**: Her adımda ilgili yardım ve ipuçları
3. **Gerçek Zamanlı Geri Bildirim**: Anında validasyon ve hesaplama
4. **Akıllı Varsayılanlar**: Önceki verilerden otomatik doldurma

---

## 📱 Tab-Based Navigation UX

### Tab Completion States
```
✅ Tamamlandı    - Yeşil arkaplan, check icon
⏳ İşlemde       - Mavi arkaplan, progress icon  
❌ Eksik/Hata    - Kırmızı nokta, error icon
⭕ Zorunlu       - Kırmızı badge, required indicator
```

### Progression Logic
- **Forward Navigation**: Sadece geçerli tab tamamlandığında
- **Backward Navigation**: Her zaman serbest
- **Progress Bar**: %tamamlanma göstergesi
- **Auto-save**: 30 saniyede bir otomatik kayıt

---

## 🎨 Microcopy Rehberi

### 1. Tab Başlıkları ve Açıklamalar

#### Tab 1: Temel Bilgiler
```
Başlık: "Temel Bilgiler"
Alt Başlık: "Teklif başlığı, müşteri seçimi ve temel detayları girin"
Yardım Metni: "Açıklayıcı bir başlık kullanın • Geçerlilik tarihini 30-60 gün arası tutun"
```

#### Tab 2: Adres Bilgileri  
```
Başlık: "Adres Bilgileri"
Alt Başlık: "Faturalandırma ve teslimat adres bilgilerini girin"
Checkbox: "Fatura adresi ile aynı"
```

#### Tab 3: Teklif Kalemleri
```
Başlık: "Teklif Kalemleri"
Alt Başlık: "Teklif kalemlerini ekleyin, ürün arayın ve fiyatları hesaplayın"
Placeholder: "Ürün/hizmet adı yazın ve Enter'a basın..."
```

### 2. Form Field Labels

#### Zorunlu Alanlar
```html
<Label>
  Teklif Başlığı <span className="text-red-500">*</span>
</Label>
```

#### Açıklayıcı Placeholders
```
"Örn: ABC Şirketi - Web Sitesi Geliştirme Teklifi"
"Sokak, mahalle, bina no"
"%30 peşin, %70 teslimat sonrası 30 gün vadeli"
"15 iş günü içinde, adresinize teslim"
```

### 3. Validation Messages

#### Error States
```
❌ "Teklif başlığı gereklidir"
❌ "Müşteri seçimi gereklidir"  
❌ "En az bir teklif kalemi eklenmelidir"
❌ "Geçerlilik tarihi gereklidir"
```

#### Success States
```
✅ "Müşteri bilgileri yüklendi: ABC Teknoloji"
✅ "Taslak otomatik kaydedildi"
✅ "Teklif başarıyla oluşturuldu ve gönderildi"
```

---

## 🔄 Auto-Population Patterns

### URL Parameter Support
```
/proposals/new?customer_id=123&opportunity_id=456&template_id=789
```

### Context Loading Messages
```
🔵 "Müşteri Yükleniyor..." → "Müşteri Yüklendi"
🎯 "Fırsat Yükleniyor..." → "Fırsat Yüklendi"  
📄 "Şablon Yükleniyor..." → "Şablon Yüklendi"
```

---

## 💡 Interactive Elements

### Status Indicators
```tsx
// Değişiklik durumu
<Badge className="bg-amber-50">Kaydedilmemiş Değişiklikler</Badge>

// Otomatik kayıt
<Badge className="bg-blue-50">Otomatik kaydediliyor...</Badge>

// Hata durumu  
<Badge className="bg-red-50 animate-pulse">3 Hata</Badge>

// Güncel durum
<Badge className="bg-green-50">Güncel</Badge>
```

### Progress Feedback
```tsx
<Progress value={completionProgress} className="w-24 h-2" />
<span className="text-xs">{Math.round(completionProgress)}% tamamlandı</span>
```

---

## 🛡️ Error Prevention

### Smart Defaults
- **Geçerlilik Tarihi**: +30 gün otomatik
- **Para Birimi**: Önceki teklif veya TRY
- **Vergi Oranı**: %18 varsayılan
- **Ödeme Şartları**: Şirket standartları

### Real-time Validation
- **Format Kontrolü**: E-posta, telefon, vergi no
- **Miktar Kontrolleri**: Negatif değer engelleme
- **Tarih Kontrolleri**: Geçmiş tarih engelleme

---

## 📊 Data Management

### Auto-save Strategy
```
⏱️ Trigger: 30 saniye inaktivite
💾 Scope: Tüm form verisi
🔄 Feedback: Toast notification
⚡ Recovery: Sayfa yenilendiğinde geri yükleme
```

### Currency Conversion
```
💱 Real-time: TCMB döviz kurları
🔄 Auto-convert: Para birimi değişikliğinde
💰 Display: Hem orijinal hem dönüştürülmüş
```

---

## 🎪 Empty States

### No Items Added
```
🛒 Büyük sepet ikonu
📝 "Henüz kalem eklenmedi"
💡 "Teklifinizi oluşturmak için ürün veya hizmet kalemleri ekleyin"
🎯 Primary CTA: "İlk Kalemi Ekle"
🔍 Secondary CTA: "Ürün Kataloğu"
```

### No Customer Selected
```
👥 "Müşteri seçimi gerekli"
➕ "Yeni müşteri ekle" link
🔍 "Mevcut müşteri ara" 
```

---

## ⌨️ Keyboard Navigation

### Shortcuts
```
Tab → Next field
Shift+Tab → Previous field
Enter → Quick add item (in search)
Ctrl+S → Save draft
Esc → Close dialogs
```

### Focus Management
- **Tab sequence**: Mantıklı sıralama
- **Focus traps**: Modal'larda odak kilidi  
- **Visual indicators**: Focus ring'ler

---

## 📱 Responsive Design

### Breakpoints
```scss
sm: 640px   // Mobile optimized tabs
md: 768px   // Tablet friendly layout  
lg: 1024px  // Desktop full experience
xl: 1280px  // Wide screen optimization
```

### Mobile Adaptations
- **Stacked Layout**: Yan yana grid'ler dikey
- **Simplified Navigation**: Tab overflow scroll
- **Touch Targets**: Minimum 44px
- **Thumb Zones**: Alt kısımda ana aksiyonlar

---

## 🔔 Notification Strategy

### Toast Types
```tsx
// Success
toast.success("Teklif başarıyla oluşturuldu", { duration: 3000 });

// Warning  
toast.warning("Bazı alanlar eksik", { duration: 5000 });

// Error
toast.error("Kayıt sırasında hata oluştu", { duration: 0 }); // Manuel kapatma

// Info
toast.info("Müşteri bilgileri yüklendi", { duration: 2000 });
```

### Timing Guidelines
- **Success**: 3 saniye
- **Info**: 2 saniye  
- **Warning**: 5 saniye
- **Error**: Manuel kapatma

---

## 🎨 Visual Hierarchy

### Color Coding
```scss
// Primary actions
.btn-primary { background: hsl(var(--primary)); }

// Success states  
.success { background: rgb(34, 197, 94); }

// Warning states
.warning { background: rgb(245, 158, 11); }

// Error states
.error { background: rgb(239, 68, 68); }

// Info states
.info { background: rgb(59, 130, 246); }
```

### Typography Scale
- **H1**: 1.875rem (30px) - Page title
- **H2**: 1.5rem (24px) - Section headers  
- **H3**: 1.25rem (20px) - Card titles
- **Body**: 0.875rem (14px) - Regular text
- **Caption**: 0.75rem (12px) - Helper text

---

## 🔄 State Management Patterns

### Form State
```tsx
// Dirty state tracking
const [hasChanges, setHasChanges] = useState(false);

// Auto-save trigger
useEffect(() => {
  if (hasChanges) {
    const timer = setTimeout(handleAutoSave, 30000);
    return () => clearTimeout(timer);
  }
}, [hasChanges, formData]);
```

### Loading States
```tsx
// Skeleton loading
{loading && <Skeleton className="h-10 w-full" />}

// Button loading  
<Button disabled={saving}>
  {saving ? <Loader2 className="animate-spin" /> : <Send />}
  {saving ? "Kaydediliyor..." : "Kaydet"}
</Button>
```

---

## 🧪 A/B Testing Opportunities

### Conversion Optimizations
1. **CTA Button Text**: "Kaydet" vs "Teklifi Gönder"
2. **Progress Indicator**: Percentage vs Step counter
3. **Auto-save Frequency**: 30s vs 60s vs On-change
4. **Required Field Indicators**: Red asterisk vs Badge
5. **Preview Access**: Always visible vs Final tab only

### User Experience Tests  
1. **Tab vs Accordion**: Navigation preference
2. **Field Grouping**: Logical vs Visual grouping
3. **Help Text Position**: Inline vs Tooltip vs Sidebar
4. **Currency Selection**: Dropdown vs Button group

---

## 📈 Success Metrics

### Primary KPIs
- **Completion Rate**: % teklif tamamlama
- **Time to Complete**: Ortalama tamamlama süresi
- **Error Rate**: Validasyon hata oranı
- **Abandonment Points**: Hangi tab'da bırakıyorlar

### Secondary Metrics
- **Auto-save Usage**: Kaç kez otomatik kayıt
- **Preview Usage**: Önizleme tıklama oranı
- **Template Usage**: Şablon kullanım oranı
- **Mobile vs Desktop**: Platform performansı

---

## 🔧 Technical Implementation Notes

### Performance Optimizations
- **Lazy Loading**: Tab içerikleri gerektiğinde yükle
- **Debounced Auto-save**: Çok sık kayıt engelleme
- **Virtual Scrolling**: Uzun ürün listeleri için
- **Memoization**: Hesaplama fonksiyonları cache

### Accessibility (a11y)
- **Screen Reader**: ARIA labels ve descriptions
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Logical tab order
- **Error Announcements**: Screen reader notifications

Bu rehber, enterprise-grade B2B SaaS uygulamaları için dünya standartlarında kullanıcı deneyimi sağlamak üzere tasarlanmıştır. 