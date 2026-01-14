# 📋 E-Fatura XML Mapping Rehberi

Bu doküman, ESG2026000000115 numaralı faturanın XML'inden çıkarılan **TÜM** verileri ve mapping bilgilerini içerir.

---

## 🏢 TEDARİKÇİ BİLGİLERİ

### 1️⃣ Party Identification (Kimlik Bilgileri)

**ÖNEMLİ:** Tedarikçi bilgileri için **PartyName boş** ama **Person** bilgileri dolu. Bu bir **gerçek kişi** faturası.

#### TCKN
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TCKN']`
- **Değer:** `50347758874`
- **Açıklama:** Tedarikçi TC Kimlik No

#### MERSISNO
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='MERSISNO']`
- **Değer:** `5034775887400001`
- **Açıklama:** Mersis Numarası

### 2️⃣ Party Name (Şirket Adı)
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name`
- **Değer:** `""` (BOŞ - Gerçek kişi faturası)
- **Açıklama:** Şirket adı yok, gerçek kişi

### 3️⃣ Person (Gerçek Kişi Bilgileri)

#### First Name
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:Person/cbc:FirstName`
- **Değer:** `ESA SİSTEM GÜVENLİK TEKNOLOJİLERİ -`
- **Açıklama:** Ad/İş Unvanı

#### Family Name
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:Person/cbc:FamilyName`
- **Değer:** `ÜMİT ERDOĞAN`
- **Açıklama:** Soyad

**⚠️ MAPPING ÖNERİSİ:** 
- Eğer `PartyName` boşsa → `Person/FirstName + Person/FamilyName` kullan
- Veya `Person/FirstName` içinde şirket adı olabilir

### 4️⃣ Adres Bilgileri

#### Street Name
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:StreetName`
- **Değer:** `HALİL RIFAT PAŞA MAHALLESİ YÜZER HAVUZ SOKAK PERPA TİCARET MERKEZİ B BLOK KAT:11 NO:1747`

#### City Subdivision (İlçe)
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CitySubdivisionName`
- **Değer:** `ŞİŞLİ/`

#### City Name
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CityName`
- **Değer:** `İSTANBUL`

#### Country
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cac:Country/cbc:Name`
- **Değer:** `Türkiye`

### 5️⃣ Vergi Bilgileri

#### Tax Scheme Name (Vergi Dairesi)
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name`
- **Değer:** `ŞİŞLİ`

### 6️⃣ İletişim Bilgileri

#### Telephone
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Telephone`
- **Değer:** `5426644692`

#### Email
- **XPath:** `.//cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:ElectronicMail`
- **Değer:** `umiterdogan@outlook.com.tr`

---

## 👤 MÜŞTERİ BİLGİLERİ

### 1️⃣ Party Identification

#### VKN
- **XPath:** `.//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN']`
- **Değer:** `6311835942`
- **Açıklama:** Müşteri VKN

### 2️⃣ Party Name
- **XPath:** `.//cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name`
- **Değer:** `NGS İLETİŞİM TEKNOLOJİLERİ VE GÜVENLİK SİSTEMLERİ LTD.ŞTİ.`

### 3️⃣ Adres
- **Street:** `.//cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:StreetName`
- **Değer:** `EĞİTİM MAH. MURATPAŞA CAD. NURTAŞ İŞ MERKEZI  NO: 1/1 İÇ KAPI NO: 29 KADIKÖY/ İSTANBUL`

### 4️⃣ Vergi Dairesi
- **XPath:** `.//cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name`
- **Değer:** `KADIKÖY`

### 5️⃣ İletişim
- **Email:** `.//cac:AccountingCustomerParty/cac:Party/cac:Contact/cbc:ElectronicMail`
- **Değer:** `info@ngsteknoloji.com`

---

## 💰 FİNANSAL BİLGİLER

### Tutarlar
- **Line Extension Amount (KDV Hariç):** `.//cac:LegalMonetaryTotal/cbc:LineExtensionAmount` → `5382.19`
- **Tax Exclusive Amount:** `.//cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount` → `5382.19`
- **Tax Inclusive Amount:** `.//cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount` → `6458.63`
- **Payable Amount:** `.//cac:LegalMonetaryTotal/cbc:PayableAmount` → `6458.63`

---

## 📦 FATURA KALEMLERİ

### Kalem 1
- **ID:** `.//cac:InvoiceLine[1]/cbc:ID` → `1`
- **Item Name:** `.//cac:InvoiceLine[1]/cac:Item/cbc:Name` → (boş olabilir)
- **Quantity:** `.//cac:InvoiceLine[1]/cbc:InvoicedQuantity` → `2` (unitCode: C62)
- **Price:** `.//cac:InvoiceLine[1]/cac:Price/cbc:PriceAmount` → `775.07`
- **Line Extension:** `.//cac:InvoiceLine[1]/cbc:LineExtensionAmount` → `1550.14`
- **Tax Amount:** `.//cac:InvoiceLine[1]/cac:TaxTotal/cbc:TaxAmount` → `310.0280`
- **Tax Percent:** `.//cac:InvoiceLine[1]/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` → `20.00`

### Kalem 2
- **ID:** `.//cac:InvoiceLine[2]/cbc:ID` → `2`
- **Quantity:** `3`
- **Price:** `1277.35`
- **Line Extension:** `3832.05`
- **Tax Amount:** `766.41`

---

## 🔑 ÖNEMLİ MAPPING NOTLARI

### Tedarikçi Adı İçin:
```python
# Eğer PartyName boşsa
if not party_name:
    # Person bilgilerini kullan
    supplier_name = f"{person_first_name} {person_family_name}"
    # VEYA sadece FirstName (içinde şirket adı olabilir)
    supplier_name = person_first_name
```

### XPath Kullanımı:
```python
# Namespace'ler ile
root.find('.//cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name', NAMESPACES)

# Scheme ID ile filtreleme
for party_id in root.findall('.//cac:PartyIdentification', NAMESPACES):
    id_elem = party_id.find('cbc:ID', NAMESPACES)
    if id_elem.get('schemeID') == 'TCKN':
        tckn = id_elem.text
```

---

## 📄 TÜM VERİLER

Detaylı JSON mapping dosyası: `scripts/xml_mapping_complete.json`

Bu dosyada tüm XPath'ler, değerler ve açıklamalar bulunmaktadır.
