# 📋 SKR2026000000187 Fatura Detaylı Analiz Raporu

## 🔷 TEMEL FATURA BİLGİLERİ

| Özellik | Değer |
|---------|-------|
| **Fatura No** | SKR2026000000187 |
| **UUID (ETTN)** | 33449D41-7D1B-4665-94BE-32A90114ED01 |
| **Fatura Tarihi** | 2026-01-13 |
| **Fatura Saati** | 09:20:49 |
| **Fatura Tipi** | SATIS |
| **Fatura Profili** | TICARIFATURA |
| **Para Birimi** | USD (Dövizli Fatura) |
| **UBL Versiyonu** | 2.1 |
| **Özelleştirme ID** | TR1.2 |
| **Kalem Sayısı** | 3 |

---

## 🏢 TEDARİKÇİ BİLGİLERİ (Şirket Faturası)

### ✅ PartyName DOLU - Şirket Faturası

Bu fatura **gerçek kişi değil, şirket faturası**. PartyName dolu olduğu için Person bilgileri yok.

### 1️⃣ PARTY IDENTIFICATION (Kimlik Bilgileri)

#### VKN
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN']`
- **Değer:** `8150407196`
- **Açıklama:** Tedarikçi VKN

#### MERSISNO
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='MERSISNO']`
- **Değer:** `0815040719600012`
- **Açıklama:** Mersis Numarası

#### TICARETSICILNO
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TICARETSICILNO']`
- **Değer:** `572955`
- **Açıklama:** Ticaret Sicil Numarası

### 2️⃣ PARTY NAME (Şirket Adı)
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name`
- **Değer:** `ŞÜKÜR ELEKTRONİK BİLİŞİM GÜV. DIŞ TİC. LTD. ŞTİ.`
- **Durum:** ✅ DOLU (Şirket faturası)

### 3️⃣ ADRES BİLGİLERİ

| Alan | XPath | Değer |
|------|-------|-------|
| **Sokak** | `.//cac:AccountingSupplierParty/.../PostalAddress/cbc:StreetName` | PERPA TİC. MER. A BLOK K:8 N:812 |
| **İlçe** | `.//cac:AccountingSupplierParty/.../PostalAddress/cbc:CitySubdivisionName` | ŞİŞLİ |
| **Şehir** | `.//cac:AccountingSupplierParty/.../PostalAddress/cbc:CityName` | İSTANBUL |
| **Posta Kodu** | `.//cac:AccountingSupplierParty/.../PostalAddress/cbc:PostalZone` | (BOŞ) |
| **Ülke** | `.//cac:AccountingSupplierParty/.../PostalAddress/cac:Country/cbc:Name` | Türkiye |

### 4️⃣ VERGİ BİLGİLERİ

| Alan | XPath | Değer |
|------|-------|-------|
| **Vergi Dairesi** | `.//cac:AccountingSupplierParty/.../TaxScheme/cbc:Name` | ŞİŞLİ |

### 5️⃣ İLETİŞİM BİLGİLERİ

| Alan | XPath | Değer |
|------|-------|-------|
| **Telefon** | `.//cac:AccountingSupplierParty/.../Contact/cbc:Telephone` | 4449928 |
| **E-posta** | `.//cac:AccountingSupplierParty/.../Contact/cbc:ElectronicMail` | merkezmuhasebe@sukurelektronik.com.tr |
| **Faks** | `.//cac:AccountingSupplierParty/.../Contact/cbc:Fax` | (BOŞ) |

---

## 👤 MÜŞTERİ BİLGİLERİ

### 1️⃣ PARTY IDENTIFICATION

#### VKN
- **Değer:** `6311835942`
- **Scheme ID:** VKN

#### MUSTERINO
- **Değer:** `120.01.08424`
- **Scheme ID:** MUSTERINO

### 2️⃣ PARTY NAME
- **Değer:** `NGS İLETİŞİM TEKNOLOJİLERİ VE GÜVENLİK SİSTEMLERİ LİMİTED ŞİRKETİ`

### 3️⃣ ADRES
- **Sokak:** HASANPAŞA MAH. MANDIRA CAD. KONAK İŞ MERKEZ B BLOK NO: 4/39
- **Şehir:** İSTANBUL
- **Posta Kodu:** 34758
- **Ülke:** TÜRKİYE

### 4️⃣ VERGİ DAİRESİ
- **Değer:** KADIKÖY VERGİ DAİRESİ MÜD.

### 5️⃣ İLETİŞİM
- **E-posta:** info@ngsteknoloji.com

---

## 💰 FİNANSAL BİLGİLER

| Alan | Değer |
|------|-------|
| **Para Birimi** | USD |
| **KDV Hariç Tutar** | 28.50 TRY |
| **KDV Dahil Tutar** | 34.20 TRY |
| **Ödenecek Tutar** | 34.20 TRY |
| **KDV Oranı** | %20 |
| **KDV Tutarı** | 5.70 TRY |

**⚠️ NOT:** Para birimi USD ama tutarlar TRY olarak gösterilmiş. Döviz kuru bilgisi kontrol edilmeli.

---

## 📦 FATURA KALEMLERİ (3 Adet)

### Kalem 1
- **ID:** 1
- **Miktar:** 1 adet
- **Birim Fiyat:** 13.000 USD
- **Kalem Tutarı:** 13.000 TRY
- **KDV:** %20 (2.600 TRY)

### Kalem 2
- **ID:** 2
- **Miktar:** 1 adet
- **Birim Fiyat:** 11.500 USD
- **Kalem Tutarı:** 11.500 TRY
- **KDV:** %20 (2.300 TRY)

### Kalem 3
- **ID:** 3
- **Miktar:** 1 adet
- **Birim Fiyat:** 4.000 USD
- **Kalem Tutarı:** 4.000 TRY
- **KDV:** %20 (0.800 TRY)

---

## 💳 ÖDEME BİLGİLERİ

- **Ödeme Şekli:** 1
- **Vade Tarihi:** (BOŞ)

---

## ✍️ İMZA BİLGİLERİ

- **İmzalı:** ✅ Evet
- **İmza Zamanı:** 2026-01-13T09:21:28.519+03:00

---

## 🔑 ÖNEMLİ FARKLAR (ESG2026000000115 ile Karşılaştırma)

| Özellik | ESG2026000000115 | SKR2026000000187 |
|---------|------------------|------------------|
| **Fatura Tipi** | Gerçek Kişi | Şirket |
| **PartyName** | ❌ BOŞ | ✅ DOLU |
| **Person Bilgileri** | ✅ VAR | ❌ YOK |
| **VKN** | TCKN: 50347758874 | VKN: 8150407196 |
| **Para Birimi** | TRY | USD |
| **Fatura Profili** | TEMELFATURA | TICARIFATURA |
| **Kalem Sayısı** | 2 | 3 |

---

## 📊 MAPPING ÖNERİLERİ

### Tedarikçi Adı İçin:
```python
# Bu faturada PartyName dolu, direkt kullanılabilir
supplier_name = party_name  # "ŞÜKÜR ELEKTRONİK BİLİŞİM GÜV. DIŞ TİC. LTD. ŞTİ."
```

### VKN İçin:
```python
# PartyIdentification'dan VKN çek (schemeID='VKN')
for party_id in party_identifications:
    if party_id.schemeID == 'VKN':
        supplier_vkn = party_id.value  # "8150407196"
```

### Tüm Kimlik Bilgileri:
- VKN: `8150407196`
- MERSISNO: `0815040719600012`
- TICARETSICILNO: `572955`

---

## ✅ SONUÇ

Bu fatura **şirket faturası** olduğu için:
- ✅ PartyName dolu → Direkt kullanılabilir
- ✅ Person bilgileri yok → Person kontrolüne gerek yok
- ✅ VKN, MERSISNO, TICARETSICILNO hepsi mevcut
- ✅ Tüm adres ve iletişim bilgileri dolu
- ⚠️ Para birimi USD ama tutarlar TRY - Döviz kuru kontrolü gerekli

**Parser'ımız bu faturayı doğru şekilde parse edecek!** ✅
