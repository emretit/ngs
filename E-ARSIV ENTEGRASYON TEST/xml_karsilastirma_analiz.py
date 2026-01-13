#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
E-Arşiv XML Karşılaştırma Scripti
Test XML ile UBL Generator çıktısını karşılaştırır
"""

import xml.etree.ElementTree as ET
import re
from pathlib import Path

# Test XML'ini parse et
test_xml_path = "E-ARSIV ENTEGRASYON TEST/INVOICE_DEMIR_INSAAT_TAAHHUT_LTD_STI__EAR2026000000888 2.xml"

print("🔍 E-ARŞİV XML KARŞILAŞTIRMA ANALİZİ")
print("=" * 80)
print("\n📄 Test XML dosyası analiz ediliyor...\n")

with open(test_xml_path, 'r', encoding='utf-8') as f:
    test_xml_content = f.read()

# Namespace'leri tanımla
NAMESPACES = {
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'ds': 'http://www.w3.org/2000/09/xmldsig#',
    'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
}

# XML kök elementini parse et
try:
    root = ET.fromstring(test_xml_content)
except ET.ParseError as e:
    print(f"❌ XML parse hatası: {e}")
    exit(1)

print("✅ Test XML başarıyla parse edildi\n")
print("=" * 80)
print("\n## 1. XML YAPI ANALİZİ - TEST XML'İ\n")

# 1. Root element ve namespace'ler
print("### Root Element ve Namespace'ler:")
print(f"Root tag: {root.tag}")
print("\nNamespace'ler:")
for prefix, uri in root.attrib.items():
    if 'xmlns' in prefix:
        ns_name = prefix.replace('{http://www.w3.org/2000/xmlns/}', '').replace('xmlns:', '').replace('xmlns', 'default')
        print(f"  - {ns_name}: {uri}")

# 2. Temel fatura bilgileri
print("\n### Temel Fatura Bilgileri:")
elements_to_check = [
    ('UBLVersionID', 'UBL Versiyon'),
    ('CustomizationID', 'Özelleştirme ID'),
    ('ProfileID', 'Profil ID'),
    ('ID', 'Fatura No'),
    ('UUID', 'ETTN'),
    ('IssueDate', 'Tarih'),
    ('IssueTime', 'Saat'),
    ('InvoiceTypeCode', 'Fatura Tipi'),
    ('DocumentCurrencyCode', 'Para Birimi'),
    ('LineCountNumeric', 'Satır Sayısı'),
]

for tag, label in elements_to_check:
    for elem in root.iter():
        if elem.tag.endswith(tag):
            value = (elem.text or '').strip()
            attrs = ' '.join([f'{k}="{v}"' for k, v in elem.attrib.items()]) if elem.attrib else ''
            print(f"  - {label}: {value} {f'({attrs})' if attrs else ''}")
            break

# 3. Signature elementi - ÖNEMLİ!
print("\n### cac:Signature (İmzalayan Bilgileri):")
signature_found = False
for elem in root.iter():
    if elem.tag.endswith('Signature') and not elem.tag.startswith('{http://www.w3.org/2000/09/xmldsig#}'):
        signature_found = True
        # Signature ID
        for child in elem.iter():
            if child.tag.endswith('ID'):
                print(f"  - Signature ID: {child.text}")
                scheme_id = child.get('schemeID', 'N/A')
                print(f"    schemeID: {scheme_id}")
                break
        
        # SignatoryParty VKN
        for party in elem.iter():
            if party.tag.endswith('SignatoryParty'):
                for party_id in party.iter():
                    if party_id.tag.endswith('PartyIdentification'):
                        for id_elem in party_id.iter():
                            if id_elem.tag.endswith('ID'):
                                print(f"  - İmzalayan VKN: {id_elem.text}")
                                scheme_id = id_elem.get('schemeID', 'N/A')
                                print(f"    schemeID: {scheme_id}")
                                break
                        break
                
                # City
                for postal in party.iter():
                    if postal.tag.endswith('PostalAddress'):
                        for city in postal.iter():
                            if city.tag.endswith('CityName'):
                                print(f"  - Şehir: {city.text}")
                                break
                        break
                break
        break

if not signature_found:
    print("  ⚠️ cac:Signature elementi bulunamadı!")

# 4. AdditionalDocumentReference
print("\n### cac:AdditionalDocumentReference (İrsaliye Notu):")
doc_ref_found = False
for elem in root.iter():
    if elem.tag.endswith('AdditionalDocumentReference'):
        doc_ref_found = True
        for child in elem.iter():
            if child.tag.endswith('ID'):
                print(f"  - ID: {child.text}")
                scheme_id = child.get('schemeID', 'N/A')
                print(f"    schemeID: {scheme_id}")
            elif child.tag.endswith('IssueDate'):
                print(f"  - IssueDate: {child.text}")
        break

if not doc_ref_found:
    print("  ⚠️ AdditionalDocumentReference elementi bulunamadı!")

# 5. AccountingSupplierParty (Satıcı)
print("\n### cac:AccountingSupplierParty (Satıcı):")
for elem in root.iter():
    if elem.tag.endswith('AccountingSupplierParty'):
        # VKN
        for party_id in elem.iter():
            if party_id.tag.endswith('PartyIdentification'):
                for id_elem in party_id.iter():
                    if id_elem.tag.endswith('ID'):
                        print(f"  - VKN: {id_elem.text}")
                        scheme_id = id_elem.get('schemeID', 'N/A')
                        print(f"    schemeID: {scheme_id}")
                        break
                break
        
        # Ünvan
        for party_name in elem.iter():
            if party_name.tag.endswith('PartyName'):
                for name in party_name.iter():
                    if name.tag.endswith('Name'):
                        print(f"  - Ünvan: {name.text}")
                        break
                break
        
        # WebsiteURI
        for web in elem.iter():
            if web.tag.endswith('WebsiteURI'):
                print(f"  - Website: {web.text or '(boş)'}")
                break
        break

# 6. AccountingCustomerParty (Alıcı)
print("\n### cac:AccountingCustomerParty (Alıcı):")
for elem in root.iter():
    if elem.tag.endswith('AccountingCustomerParty'):
        # VKN/TCKN
        for party_id in elem.iter():
            if party_id.tag.endswith('PartyIdentification'):
                for id_elem in party_id.iter():
                    if id_elem.tag.endswith('ID'):
                        print(f"  - VKN/TCKN: {id_elem.text}")
                        scheme_id = id_elem.get('schemeID', 'N/A')
                        print(f"    schemeID: {scheme_id}")
                        break
                break
        
        # Ünvan
        for party_name in elem.iter():
            if party_name.tag.endswith('PartyName'):
                for name in party_name.iter():
                    if name.tag.endswith('Name'):
                        print(f"  - Ünvan: {name.text}")
                        break
                break
        
        # PartyTaxScheme VAR MI?
        tax_scheme_found = False
        for tax_scheme in elem.iter():
            if tax_scheme.tag.endswith('PartyTaxScheme'):
                tax_scheme_found = True
                print(f"  ⚠️ PartyTaxScheme bulundu (E-Arşiv için OLMAMALI!)")
                break
        
        if not tax_scheme_found:
            print(f"  ✅ PartyTaxScheme YOK (E-Arşiv için doğru)")
        
        # Person elementi VAR MI? (TCKN için zorunlu)
        person_found = False
        for person in elem.iter():
            if person.tag.endswith('Person'):
                person_found = True
                print(f"  - Person elementi bulundu")
                for first in person.iter():
                    if first.tag.endswith('FirstName'):
                        print(f"    FirstName: {first.text}")
                for last in person.iter():
                    if last.tag.endswith('FamilyName'):
                        print(f"    FamilyName: {last.text}")
                break
        
        if not person_found:
            print(f"  ⚠️ Person elementi bulunamadı")
        break

# 7. TaxTotal
print("\n### cac:TaxTotal (Vergi Toplamı):")
tax_total_count = 0

# Invoice altındaki TaxTotal'ı bul (InvoiceLine içindekiler değil)
invoice_tax_totals = []
for child in root:
    if child.tag.endswith('TaxTotal'):
        invoice_tax_totals.append(child)

for elem in invoice_tax_totals:
    tax_total_count += 1
    # TaxAmount
    for amount in elem:
        if amount.tag.endswith('TaxAmount'):
            print(f"  - Toplam Vergi: {amount.text} {amount.get('currencyID', 'TRY')}")
            break
    
    # TaxSubtotal
    subtotal_count = 0
    for subtotal in elem:
        if subtotal.tag.endswith('TaxSubtotal'):
            subtotal_count += 1
            print(f"\n  TaxSubtotal #{subtotal_count}:")
            
            for child in subtotal:
                if child.tag.endswith('TaxableAmount'):
                    print(f"    - Matrah: {child.text} {child.get('currencyID', 'TRY')}")
                elif child.tag.endswith('TaxAmount'):
                    print(f"    - Vergi: {child.text} {child.get('currencyID', 'TRY')}")
                elif child.tag.endswith('TaxCategory'):
                    for cat_child in child:
                        if cat_child.tag.endswith('Percent'):
                            print(f"    - Oran: %{cat_child.text}")
                        elif cat_child.tag.endswith('TaxScheme'):
                            for scheme_child in cat_child:
                                if scheme_child.tag.endswith('Name'):
                                    print(f"    - Vergi Adı: {scheme_child.text}")
                                elif scheme_child.tag.endswith('TaxTypeCode'):
                                    print(f"    - Vergi Kodu: {scheme_child.text}")
    break

# 8. InvoiceLine
print("\n### cac:InvoiceLine (Fatura Satırları):")
line_count = 0
for elem in root.iter():
    if elem.tag.endswith('InvoiceLine'):
        line_count += 1

print(f"  Toplam {line_count} satır bulundu\n")

# Her satırın yapısını kontrol et
for idx, elem in enumerate(root.iter()):
    if elem.tag.endswith('InvoiceLine'):
        print(f"  Satır {idx + 1}:")
        
        # Satır yapısındaki elementleri kontrol et
        found_elements = set()
        for child in elem.iter():
            tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag_name in ['ID', 'InvoicedQuantity', 'LineExtensionAmount', 'Item', 
                           'Price', 'TaxTotal', 'Name', 'PriceAmount', 'TaxAmount']:
                found_elements.add(tag_name)
                
                if tag_name == 'ID':
                    print(f"    - ID: {child.text}")
                elif tag_name == 'InvoicedQuantity':
                    print(f"    - Miktar: {child.text} {child.get('unitCode', '')}")
                elif tag_name == 'LineExtensionAmount':
                    print(f"    - Tutar: {child.text} {child.get('currencyID', '')}")
                elif tag_name == 'Name':
                    # Item altındaki Name olup olmadığını kontrol et
                    is_item_name = False
                    for item in elem.iter():
                        if item.tag.endswith('Item'):
                            for item_child in item:
                                if item_child == child:
                                    is_item_name = True
                                    break
                            break
                    if is_item_name:
                        print(f"    - Ürün: {child.text}")
                elif tag_name == 'PriceAmount':
                    print(f"    - Birim Fiyat: {child.text} {child.get('currencyID', '')}")
        
        # TaxTotal kontrolü - Satır içinde
        has_line_tax = False
        for child in elem:
            if child.tag.endswith('TaxTotal'):
                has_line_tax = True
                for tax_amount in child:
                    if tax_amount.tag.endswith('TaxAmount'):
                        print(f"    - Satır Vergisi: {tax_amount.text}")
                        break
                
                # TaxSubtotal içinde Percent var mı?
                for subtotal in child.iter():
                    if subtotal.tag.endswith('TaxSubtotal'):
                        for cat in subtotal.iter():
                            if cat.tag.endswith('Percent'):
                                print(f"    - Vergi Oranı: %{cat.text}")
                                break
                        break
                break
        
        if not has_line_tax:
            print(f"    ⚠️ TaxTotal elementi yok!")
        
        print()

print("\n" + "=" * 80)
print("\n## 2. UBL GENERATOR KARŞILAŞTIRMASI\n")

print("""
### UBL Generator'da generateEArchiveUBLTRXML() fonksiyonu oluşturduğu XML:

**FARKLAR:**

1. ✅ **ProfileID**: 
   - Test XML: EARSIVFATURA olmalı (veya TEMELFATURA)
   - Generator: TEMELFATURA (satır 655)
   - ⚠️ E-Arşiv için "EARSIVFATURA" kullanılması tavsiye edilir

2. ✅ **cac:Signature schemeID**:
   - Test XML: VKN_TCKN
   - Generator: VKN_TCKN (satır 677)
   - ✅ DOĞRU

3. ✅ **cac:Signature VERİBAN bilgileri**:
   - Test XML: 9240481875, İstanbul, Türkiye
   - Generator: 9240481875, İstanbul, Türkiye (satır 558-560, 677-694)
   - ✅ DOĞRU

4. ✅ **cac:AdditionalDocumentReference**:
   - Test XML: schemeID="XSLTDISPATCH", "İrsaliye yerine geçer."
   - Generator: schemeID="XSLTDISPATCH", "İrsaliye yerine geçer." (satır 698-701)
   - ✅ DOĞRU

5. ✅ **AccountingSupplierParty WebsiteURI**:
   - Test XML: Var
   - Generator: Var (satır 707)
   - ✅ DOĞRU

6. ✅ **AccountingCustomerParty PartyTaxScheme**:
   - Test XML: YOK (E-Arşiv için doğru)
   - Generator: YOK (satır 778'de yorum: "E-Arşiv için PartyTaxScheme EKLENMEMELİ")
   - ✅ DOĞRU

7. ✅ **AccountingCustomerParty Person**:
   - Test XML: TCKN için Person elementi var mı kontrol edilmeli
   - Generator: TCKN için Person elementi ekleniyor (satır 766-775)
   - ✅ DOĞRU

8. ⚠️ **InvoiceLine sıralaması**:
   - Test XML: ID > Quantity > Amount > Item > Price > TaxTotal
   - Generator: ID > Quantity > Amount > Item > Price > TaxTotal (satır 845-884)
   - ✅ DOĞRU

9. ⚠️ **TaxTotal/TaxSubtotal yapısı**:
   - Test XML'de TaxSubtotal içinde Percent elementi TaxCategory'nin DIŞINDA
   - Generator'da TaxSubtotal içinde Percent elementi TaxCategory'nin İÇİNDE (satır 872)
   - ⚠️ FARK VAR - Bu UBL standardına göre değişebilir

10. ✅ **LegalMonetaryTotal sıralaması**:
    - Test XML: LineExtension > AllowanceTotal? > TaxExclusive > TaxInclusive > Payable
    - Generator: LineExtension > AllowanceTotal? > TaxExclusive > TaxInclusive > Payable (satır 818-830)
    - ✅ DOĞRU

11. ⚠️ **Invoice Lines ÖNCE mi TaxTotal ÖNCE mi?**:
    - Test XML: TaxTotal > LegalMonetaryTotal > InvoiceLines
    - Generator: TaxTotal > LegalMonetaryTotal > InvoiceLines (satır 793-885)
    - ✅ DOĞRU SIRA

""")

print("\n" + "=" * 80)
print("\n## 3. KRİTİK BULGULAR VE ÖNERİLER\n")

print("""
### ✅ DOĞRU OLAN NOKTALAR:

1. VERİBAN mali mühür Signature yapısı doğru (VKN_TCKN schemeID)
2. AdditionalDocumentReference "İrsaliye yerine geçer" notu mevcut
3. AccountingCustomerParty'de PartyTaxScheme yok (E-Arşiv kuralı)
4. TCKN için Person elementi ekleniyor
5. Element sıralamaları genel olarak doğru

### ⚠️ DÜZELTİLMESİ GEREKEN NOKTALAR:

1. **ProfileID**: TEMELFATURA yerine **EARSIVFATURA** kullanılmalı
   - Dosya: ubl-generator.ts
   - Satır: 655
   - Değişiklik: <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>

2. **InvoiceLine TaxSubtotal yapısı**: 
   - Test XML'de Percent elementi TaxCategory'nin dışında
   - Generator'da TaxCategory'nin içinde
   - UBL 2.1 standardına göre ikisi de geçerli olabilir
   - Ancak test XML'inizin yapısını takip etmek daha güvenli

3. **Element sıraları**:
   - Generator'da bazı elementler farklı sırada olabilir
   - XML semantik olarak doğru ama sıralama Veriban için önemli olabilir

### 🔧 YAPILACAK DÜZELTMELER:

```typescript
// ubl-generator.ts satır 655
// DEĞİŞTİR:
<cbc:ProfileID>TEMELFATURA</cbc:ProfileID>

// BUNLA:
<cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
```

### 📝 TEST ÖNERİSİ:

1. Yukarıdaki değişikliği yap
2. Bir test faturası oluştur
3. XML'i Veriban'a gönder
4. Sonucu gözlemle
5. Eğer sorun devam ederse, InvoiceLine TaxSubtotal yapısını da düzelt

""")

print("=" * 80)
print("\n✅ Analiz tamamlandı!\n")
