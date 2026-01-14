#!/usr/bin/env python3
"""
E-Fatura XML Analiz Scripti
ESG2026000000115 numaralı faturanın XML içeriğini detaylı analiz eder
"""

import xml.etree.ElementTree as ET
from datetime import datetime
import json
from typing import Dict, List, Any
import sys
import os

# Namespace'ler
NAMESPACES = {
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'ds': 'http://www.w3.org/2000/09/xmldsig#',
    'xades': 'http://uri.etsi.org/01903/v1.3.2#',
}

def find_text(element, xpath: str, default: str = "") -> str:
    """XPath ile text bul"""
    result = element.find(xpath, NAMESPACES)
    return result.text if result is not None and result.text else default

def find_all(element, xpath: str) -> List:
    """XPath ile tüm elementleri bul"""
    return element.findall(xpath, NAMESPACES)

def parse_party_info(party_element) -> Dict[str, Any]:
    """Tedarikçi/Müşteri bilgilerini parse et"""
    info = {}
    
    # Şirket adı
    party_name = party_element.find('.//cac:PartyName/cbc:Name', NAMESPACES)
    if party_name is not None:
        info['name'] = party_name.text
    
    # VKN/TCKN
    tax_scheme = party_element.find('.//cac:PartyTaxScheme/cbc:CompanyID', NAMESPACES)
    if tax_scheme is not None:
        info['tax_number'] = tax_scheme.text
        scheme_id = party_element.find('.//cac:PartyTaxScheme/cac:TaxScheme/cbc:TaxSchemeID', NAMESPACES)
        if scheme_id is not None:
            info['tax_scheme'] = scheme_id.text
    
    # Adres
    address = party_element.find('.//cac:PostalAddress', NAMESPACES)
    if address is not None:
        info['address'] = {
            'street': find_text(address, 'cbc:StreetName'),
            'building': find_text(address, 'cbc:BuildingNumber'),
            'city': find_text(address, 'cbc:CityName'),
            'postal_code': find_text(address, 'cbc:PostalZone'),
            'country': find_text(address, 'cac:Country/cbc:Name'),
        }
    
    # İletişim
    contact = party_element.find('.//cac:Contact', NAMESPACES)
    if contact is not None:
        info['contact'] = {
            'phone': find_text(contact, 'cbc:Telephone'),
            'email': find_text(contact, 'cbc:ElectronicMail'),
            'fax': find_text(contact, 'cbc:Fax'),
        }
    
    return info

def parse_tax_info(tax_element) -> Dict[str, Any]:
    """KDV bilgilerini parse et"""
    tax = {}
    tax['category'] = find_text(tax_element, 'cac:TaxScheme/cbc:TaxSchemeID')
    tax['name'] = find_text(tax_element, 'cac:TaxScheme/cbc:Name')
    tax['percent'] = find_text(tax_element, 'cbc:Percent')
    tax['taxable_amount'] = find_text(tax_element, 'cbc:TaxableAmount')
    tax['tax_amount'] = find_text(tax_element, 'cbc:TaxAmount')
    return tax

def parse_invoice_line(line_element, line_number: int) -> Dict[str, Any]:
    """Fatura kalemini parse et"""
    line = {'line_number': line_number}
    
    # Kalem ID
    line['id'] = find_text(line_element, 'cbc:ID')
    
    # Açıklama
    line['description'] = find_text(line_element, 'cbc:InvoicedQuantity', '')
    note = line_element.find('.//cbc:Note', NAMESPACES)
    if note is not None:
        line['note'] = note.text
    
    # Miktar
    quantity = line_element.find('.//cbc:InvoicedQuantity', NAMESPACES)
    if quantity is not None:
        line['quantity'] = {
            'value': quantity.text,
            'unit': quantity.get('unitCode', ''),
        }
    
    # Birim fiyat
    price = line_element.find('.//cac:Price', NAMESPACES)
    if price is not None:
        line['price'] = {
            'amount': find_text(price, 'cbc:PriceAmount'),
            'currency': price.find('cbc:PriceAmount', NAMESPACES).get('currencyID', '') if price.find('cbc:PriceAmount', NAMESPACES) is not None else '',
        }
    
    # Tutar
    line['line_extension_amount'] = find_text(line_element, 'cbc:LineExtensionAmount')
    
    # KDV
    taxes = []
    for tax in find_all(line_element, './/cac:TaxTotal/cac:TaxSubtotal'):
        taxes.append(parse_tax_info(tax))
    line['taxes'] = taxes
    
    return line

def analyze_invoice_xml(xml_content: str) -> Dict[str, Any]:
    """XML'i parse edip analiz et"""
    root = ET.fromstring(xml_content)
    
    analysis = {
        'invoice_basic': {},
        'supplier': {},
        'customer': {},
        'financial': {},
        'lines': [],
        'taxes': [],
        'payment': {},
        'signature': {},
    }
    
    # ============ TEMEL FATURA BİLGİLERİ ============
    analysis['invoice_basic'] = {
        'id': find_text(root, 'cbc:ID'),
        'uuid': find_text(root, 'cbc:UUID'),
        'invoice_number': find_text(root, 'cbc:InvoiceNumber'),
        'issue_date': find_text(root, 'cbc:IssueDate'),
        'issue_time': find_text(root, 'cbc:IssueTime'),
        'invoice_type_code': find_text(root, 'cbc:InvoiceTypeCode'),
        'document_currency_code': find_text(root, 'cbc:DocumentCurrencyCode'),
        'line_count_numeric': find_text(root, 'cbc:LineCountNumeric'),
        'profile_id': find_text(root, 'cbc:ProfileID'),
    }
    
    # ============ TEDARİKÇİ BİLGİLERİ ============
    supplier_party = root.find('.//cac:AccountingSupplierParty/cac:Party', NAMESPACES)
    if supplier_party is not None:
        analysis['supplier'] = parse_party_info(supplier_party)
    
    # ============ MÜŞTERİ BİLGİLERİ ============
    customer_party = root.find('.//cac:AccountingCustomerParty/cac:Party', NAMESPACES)
    if customer_party is not None:
        analysis['customer'] = parse_party_info(customer_party)
    
    # ============ FİNANSAL BİLGİLER ============
    analysis['financial'] = {
        'tax_exclusive_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount'),
        'tax_inclusive_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount'),
        'payable_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:PayableAmount'),
        'allowance_total_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount'),
        'charge_total_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:ChargeTotalAmount'),
        'prepaid_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:PrepaidAmount'),
        'payable_rounding_amount': find_text(root, 'cac:LegalMonetaryTotal/cbc:PayableRoundingAmount'),
    }
    
    # ============ FATURA KALEMLERİ ============
    line_number = 1
    for line_element in find_all(root, 'cac:InvoiceLine'):
        line_data = parse_invoice_line(line_element, line_number)
        analysis['lines'].append(line_data)
        line_number += 1
    
    # ============ KDV TOPLAM ============
    for tax_total in find_all(root, 'cac:TaxTotal'):
        tax_subtotals = find_all(tax_total, 'cac:TaxSubtotal')
        for tax_subtotal in tax_subtotals:
            tax_info = parse_tax_info(tax_subtotal)
            if tax_info.get('tax_amount'):
                analysis['taxes'].append(tax_info)
    
    # ============ ÖDEME BİLGİLERİ ============
    payment_means = root.find('.//cac:PaymentMeans', NAMESPACES)
    if payment_means is not None:
        analysis['payment'] = {
            'payment_means_code': find_text(payment_means, 'cbc:PaymentMeansCode'),
            'payment_due_date': find_text(payment_means, 'cbc:PaymentDueDate'),
            'instruction_note': find_text(payment_means, 'cbc:InstructionNote'),
        }
        
        # Finansal hesap
        financial_account = payment_means.find('.//cac:PayeeFinancialAccount', NAMESPACES)
        if financial_account is not None:
            analysis['payment']['financial_account'] = {
                'id': find_text(financial_account, 'cbc:ID'),
                'currency_code': find_text(financial_account, 'cbc:CurrencyCode'),
            }
    
    # ============ İMZA BİLGİLERİ ============
    signature = root.find('.//ds:Signature', NAMESPACES)
    if signature is not None:
        signing_time = signature.find('.//xades:SigningTime', NAMESPACES)
        if signing_time is not None:
            analysis['signature'] = {
                'signing_time': signing_time.text,
                'signed': True,
            }
        else:
            analysis['signature'] = {'signed': False}
    
    return analysis

def print_analysis(analysis: Dict[str, Any]):
    """Analiz sonuçlarını güzel formatta yazdır"""
    print("=" * 80)
    print("📄 E-FATURA XML DETAYLI ANALİZ RAPORU")
    print("=" * 80)
    print()
    
    # Temel Bilgiler
    print("🔷 TEMEL FATURA BİLGİLERİ")
    print("-" * 80)
    basic = analysis['invoice_basic']
    print(f"  Fatura No: {basic.get('invoice_number', 'N/A')}")
    print(f"  Fatura ID: {basic.get('id', 'N/A')}")
    print(f"  UUID (ETTN): {basic.get('uuid', 'N/A')}")
    print(f"  Fatura Tarihi: {basic.get('issue_date', 'N/A')}")
    print(f"  Fatura Saati: {basic.get('issue_time', 'N/A')}")
    print(f"  Fatura Tipi: {basic.get('invoice_type_code', 'N/A')}")
    print(f"  Para Birimi: {basic.get('document_currency_code', 'N/A')}")
    print(f"  Kalem Sayısı: {basic.get('line_count_numeric', 'N/A')}")
    print(f"  Profil ID: {basic.get('profile_id', 'N/A')}")
    print()
    
    # Tedarikçi
    print("🏢 TEDARİKÇİ BİLGİLERİ")
    print("-" * 80)
    supplier = analysis['supplier']
    print(f"  Şirket Adı: {supplier.get('name', 'N/A')}")
    print(f"  VKN/TCKN: {supplier.get('tax_number', 'N/A')} ({supplier.get('tax_scheme', 'N/A')})")
    if 'address' in supplier:
        addr = supplier['address']
        print(f"  Adres: {addr.get('street', '')} {addr.get('building', '')}")
        print(f"         {addr.get('city', '')} {addr.get('postal_code', '')}")
        print(f"         {addr.get('country', '')}")
    if 'contact' in supplier:
        contact = supplier['contact']
        print(f"  Telefon: {contact.get('phone', 'N/A')}")
        print(f"  E-posta: {contact.get('email', 'N/A')}")
        print(f"  Faks: {contact.get('fax', 'N/A')}")
    print()
    
    # Müşteri
    print("👤 MÜŞTERİ BİLGİLERİ")
    print("-" * 80)
    customer = analysis['customer']
    print(f"  Şirket Adı: {customer.get('name', 'N/A')}")
    print(f"  VKN/TCKN: {customer.get('tax_number', 'N/A')} ({customer.get('tax_scheme', 'N/A')})")
    if 'address' in customer:
        addr = customer['address']
        print(f"  Adres: {addr.get('street', '')} {addr.get('building', '')}")
        print(f"         {addr.get('city', '')} {addr.get('postal_code', '')}")
        print(f"         {addr.get('country', '')}")
    if 'contact' in customer:
        contact = customer['contact']
        print(f"  Telefon: {contact.get('phone', 'N/A')}")
        print(f"  E-posta: {contact.get('email', 'N/A')}")
    print()
    
    # Finansal
    print("💰 FİNANSAL BİLGİLER")
    print("-" * 80)
    financial = analysis['financial']
    print(f"  KDV Hariç Tutar: {financial.get('tax_exclusive_amount', '0')} TRY")
    print(f"  KDV Dahil Tutar: {financial.get('tax_inclusive_amount', '0')} TRY")
    print(f"  Ödenecek Tutar: {financial.get('payable_amount', '0')} TRY")
    if financial.get('allowance_total_amount'):
        print(f"  İndirim Toplamı: {financial.get('allowance_total_amount')} TRY")
    if financial.get('charge_total_amount'):
        print(f"  Ek Ücret Toplamı: {financial.get('charge_total_amount')} TRY")
    print()
    
    # KDV Detayları
    print("📊 KDV DETAYLARI")
    print("-" * 80)
    for i, tax in enumerate(analysis['taxes'], 1):
        print(f"  KDV {i}:")
        print(f"    Kategori: {tax.get('category', 'N/A')}")
        print(f"    Adı: {tax.get('name', 'N/A')}")
        print(f"    Oran: %{tax.get('percent', '0')}")
        print(f"    Matrah: {tax.get('taxable_amount', '0')} TRY")
        print(f"    KDV Tutarı: {tax.get('tax_amount', '0')} TRY")
    print()
    
    # Fatura Kalemleri
    print("📦 FATURA KALEMLERİ")
    print("-" * 80)
    for line in analysis['lines']:
        print(f"  Kalem {line['line_number']}:")
        print(f"    ID: {line.get('id', 'N/A')}")
        if line.get('note'):
            print(f"    Açıklama: {line.get('note', 'N/A')}")
        if line.get('quantity'):
            qty = line['quantity']
            print(f"    Miktar: {qty.get('value', '0')} {qty.get('unit', '')}")
        if line.get('price'):
            price = line['price']
            print(f"    Birim Fiyat: {price.get('amount', '0')} {price.get('currency', 'TRY')}")
        print(f"    Kalem Tutarı: {line.get('line_extension_amount', '0')} TRY")
        if line.get('taxes'):
            for tax in line['taxes']:
                print(f"      KDV: %{tax.get('percent', '0')} - {tax.get('tax_amount', '0')} TRY")
        print()
    
    # Ödeme
    if analysis['payment']:
        print("💳 ÖDEME BİLGİLERİ")
        print("-" * 80)
        payment = analysis['payment']
        print(f"  Ödeme Şekli: {payment.get('payment_means_code', 'N/A')}")
        print(f"  Vade Tarihi: {payment.get('payment_due_date', 'N/A')}")
        if 'financial_account' in payment:
            acc = payment['financial_account']
            print(f"  Hesap No: {acc.get('id', 'N/A')}")
        print()
    
    # İmza
    print("✍️ İMZA BİLGİLERİ")
    print("-" * 80)
    signature = analysis['signature']
    if signature.get('signed'):
        print(f"  İmzalı: ✅ Evet")
        print(f"  İmza Zamanı: {signature.get('signing_time', 'N/A')}")
    else:
        print(f"  İmzalı: ❌ Hayır")
    print()
    
    print("=" * 80)
    print("✅ Analiz tamamlandı!")
    print("=" * 80)

def main():
    """Ana fonksiyon"""
    # XML dosyasını oku
    xml_file = 'scripts/invoice_skr2026000000187.xml'
    invoice_id = 'SKR2026000000187'
    
    print(f"🔍 Fatura XML'i okunuyor: {invoice_id}...")
    
    try:
        with open(xml_file, 'r', encoding='utf-8') as f:
            xml_content = f.read().strip()
    except FileNotFoundError:
        print(f"❌ Hata: XML dosyası bulunamadı: {xml_file}")
        print("💡 Alternatif: XML içeriğini direkt parametre olarak geçebilirsiniz.")
        sys.exit(1)
    
    if not xml_content:
        print(f"❌ Hata: XML içeriği boş!")
        sys.exit(1)
    
    print(f"✅ XML içeriği okundu ({len(xml_content)} karakter)")
    print()
    
    # XML'i analiz et
    print("📊 XML analiz ediliyor...")
    analysis = analyze_invoice_xml(xml_content)
    
    # Sonuçları yazdır
    print_analysis(analysis)
    
    # JSON olarak da kaydet
    output_file = f'invoice_analysis_{invoice_id}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"💾 Detaylı analiz JSON olarak kaydedildi: {output_file}")

if __name__ == '__main__':
    main()
