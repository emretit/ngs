#!/usr/bin/env python3
"""
XML Mapping Rehberi - Tüm verileri mapping için hazır format
"""

import xml.etree.ElementTree as ET
import json

NAMESPACES = {
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
}

def find_text(root, xpath, default=""):
    """XPath ile text bul"""
    result = root.find(xpath, NAMESPACES)
    return result.text if result is not None and result.text else default

def find_all(root, xpath):
    """Tüm elementleri bul"""
    return root.findall(xpath, NAMESPACES)

def extract_complete_data(xml_file):
    """Tüm verileri detaylı çıkar"""
    
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    data = {
        'invoice_basic': {},
        'supplier': {},
        'customer': {},
        'financial': {},
        'lines': [],
        'taxes': [],
        'payment': {},
        'delivery': {},
        'signature': {}
    }
    
    # ============ TEMEL FATURA BİLGİLERİ ============
    data['invoice_basic'] = {
        'id': {
            'xpath': './/cbc:ID',
            'value': find_text(root, './/cbc:ID'),
            'description': 'Fatura ID (Fatura Numarası)'
        },
        'uuid': {
            'xpath': './/cbc:UUID',
            'value': find_text(root, './/cbc:UUID'),
            'description': 'Fatura UUID (ETTN)'
        },
        'invoice_number': {
            'xpath': './/cbc:InvoiceNumber',
            'value': find_text(root, './/cbc:InvoiceNumber'),
            'description': 'Fatura Numarası (alternatif)'
        },
        'issue_date': {
            'xpath': './/cbc:IssueDate',
            'value': find_text(root, './/cbc:IssueDate'),
            'description': 'Fatura Tarihi'
        },
        'issue_time': {
            'xpath': './/cbc:IssueTime',
            'value': find_text(root, './/cbc:IssueTime'),
            'description': 'Fatura Saati'
        },
        'invoice_type_code': {
            'xpath': './/cbc:InvoiceTypeCode',
            'value': find_text(root, './/cbc:InvoiceTypeCode'),
            'description': 'Fatura Tipi (SATIS, IADE, vb.)'
        },
        'profile_id': {
            'xpath': './/cbc:ProfileID',
            'value': find_text(root, './/cbc:ProfileID'),
            'description': 'Fatura Profili (TEMELFATURA, TICARIFATURA, vb.)'
        },
        'document_currency_code': {
            'xpath': './/cbc:DocumentCurrencyCode',
            'value': find_text(root, './/cbc:DocumentCurrencyCode'),
            'description': 'Para Birimi'
        },
        'ubl_version': {
            'xpath': './/cbc:UBLVersionID',
            'value': find_text(root, './/cbc:UBLVersionID'),
            'description': 'UBL Versiyonu'
        },
        'customization_id': {
            'xpath': './/cbc:CustomizationID',
            'value': find_text(root, './/cbc:CustomizationID'),
            'description': 'Özelleştirme ID (TR1.2)'
        }
    }
    
    # ============ TEDARİKÇİ BİLGİLERİ (DETAYLI) ============
    supplier_party = root.find('.//cac:AccountingSupplierParty/cac:Party', NAMESPACES)
    if supplier_party is not None:
        # Party Identification (VKN/TCKN/MERSISNO)
        identifications = []
        for party_id in find_all(supplier_party, './/cac:PartyIdentification'):
            id_elem = party_id.find('cbc:ID', NAMESPACES)
            if id_elem is not None:
                identifications.append({
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID',
                    'value': id_elem.text,
                    'scheme_id': id_elem.get('schemeID', ''),
                    'description': f"Tedarikçi Kimlik No ({id_elem.get('schemeID', 'Bilinmiyor')})"
                })
        
        # Party Name
        party_name_elem = supplier_party.find('.//cac:PartyName/cbc:Name', NAMESPACES)
        
        # Postal Address
        address = supplier_party.find('.//cac:PostalAddress', NAMESPACES)
        address_data = {}
        if address is not None:
            address_data = {
                'street_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:StreetName',
                    'value': find_text(address, 'cbc:StreetName'),
                    'description': 'Sokak Adı'
                },
                'building_number': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:BuildingNumber',
                    'value': find_text(address, 'cbc:BuildingNumber'),
                    'description': 'Bina Numarası'
                },
                'city_subdivision': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CitySubdivisionName',
                    'value': find_text(address, 'cbc:CitySubdivisionName'),
                    'description': 'İlçe'
                },
                'city_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CityName',
                    'value': find_text(address, 'cbc:CityName'),
                    'description': 'Şehir'
                },
                'postal_zone': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:PostalZone',
                    'value': find_text(address, 'cbc:PostalZone'),
                    'description': 'Posta Kodu'
                },
                'country_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cac:Country/cbc:Name',
                    'value': find_text(address, 'cac:Country/cbc:Name'),
                    'description': 'Ülke'
                }
            }
        
        # Party Tax Scheme (Vergi Dairesi)
        tax_scheme = supplier_party.find('.//cac:PartyTaxScheme', NAMESPACES)
        tax_scheme_data = {}
        if tax_scheme is not None:
            company_id = tax_scheme.find('cbc:CompanyID', NAMESPACES)
            tax_scheme_data = {
                'company_id': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID',
                    'value': company_id.text if company_id is not None else '',
                    'description': 'VKN/TCKN (Tax Scheme içinde)'
                },
                'tax_scheme_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name',
                    'value': find_text(tax_scheme, 'cac:TaxScheme/cbc:Name'),
                    'description': 'Vergi Dairesi Adı'
                },
                'tax_scheme_id': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:TaxSchemeID',
                    'value': find_text(tax_scheme, 'cac:TaxScheme/cbc:TaxSchemeID'),
                    'description': 'Vergi Dairesi Kodu'
                }
            }
        
        # Contact
        contact = supplier_party.find('.//cac:Contact', NAMESPACES)
        contact_data = {}
        if contact is not None:
            contact_data = {
                'telephone': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Telephone',
                    'value': find_text(contact, 'cbc:Telephone'),
                    'description': 'Telefon'
                },
                'email': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:ElectronicMail',
                    'value': find_text(contact, 'cbc:ElectronicMail'),
                    'description': 'E-posta'
                },
                'fax': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Fax',
                    'value': find_text(contact, 'cbc:Fax'),
                    'description': 'Faks'
                }
            }
        
        # Person (Gerçek Kişi ise)
        person = supplier_party.find('.//cac:Person', NAMESPACES)
        person_data = {}
        if person is not None:
            person_data = {
                'first_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Person/cbc:FirstName',
                    'value': find_text(person, 'cbc:FirstName'),
                    'description': 'Ad'
                },
                'family_name': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Person/cbc:FamilyName',
                    'value': find_text(person, 'cbc:FamilyName'),
                    'description': 'Soyad'
                },
                'title': {
                    'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:Person/cbc:Title',
                    'value': find_text(person, 'cbc:Title'),
                    'description': 'Ünvan'
                }
            }
        
        data['supplier'] = {
            'identifications': identifications,
            'party_name': {
                'xpath': './/cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name',
                'value': party_name_elem.text if party_name_elem is not None else '',
                'description': 'Tedarikçi Şirket Adı'
            },
            'address': address_data,
            'tax_scheme': tax_scheme_data,
            'contact': contact_data,
            'person': person_data
        }
    
    # ============ MÜŞTERİ BİLGİLERİ (Aynı yapı) ============
    customer_party = root.find('.//cac:AccountingCustomerParty/cac:Party', NAMESPACES)
    if customer_party is not None:
        # Party Identification
        customer_ids = []
        for party_id in find_all(customer_party, './/cac:PartyIdentification'):
            id_elem = party_id.find('cbc:ID', NAMESPACES)
            if id_elem is not None:
                customer_ids.append({
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID',
                    'value': id_elem.text,
                    'scheme_id': id_elem.get('schemeID', ''),
                    'description': f"Müşteri Kimlik No ({id_elem.get('schemeID', 'Bilinmiyor')})"
                })
        
        party_name_elem = customer_party.find('.//cac:PartyName/cbc:Name', NAMESPACES)
        
        # Address, Tax Scheme, Contact (supplier ile aynı yapı)
        address = customer_party.find('.//cac:PostalAddress', NAMESPACES)
        customer_address = {}
        if address is not None:
            customer_address = {
                'street_name': {
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:StreetName',
                    'value': find_text(address, 'cbc:StreetName'),
                    'description': 'Sokak Adı'
                },
                'city_name': {
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:CityName',
                    'value': find_text(address, 'cbc:CityName'),
                    'description': 'Şehir'
                },
                'country_name': {
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cac:Country/cbc:Name',
                    'value': find_text(address, 'cac:Country/cbc:Name'),
                    'description': 'Ülke'
                }
            }
        
        tax_scheme = customer_party.find('.//cac:PartyTaxScheme', NAMESPACES)
        customer_tax = {}
        if tax_scheme is not None:
            customer_tax = {
                'tax_scheme_name': {
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name',
                    'value': find_text(tax_scheme, 'cac:TaxScheme/cbc:Name'),
                    'description': 'Vergi Dairesi Adı'
                }
            }
        
        contact = customer_party.find('.//cac:Contact', NAMESPACES)
        customer_contact = {}
        if contact is not None:
            customer_contact = {
                'email': {
                    'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:Contact/cbc:ElectronicMail',
                    'value': find_text(contact, 'cbc:ElectronicMail'),
                    'description': 'E-posta'
                }
            }
        
        data['customer'] = {
            'identifications': customer_ids,
            'party_name': {
                'xpath': './/cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name',
                'value': party_name_elem.text if party_name_elem is not None else '',
                'description': 'Müşteri Şirket Adı'
            },
            'address': customer_address,
            'tax_scheme': customer_tax,
            'contact': customer_contact
        }
    
    # ============ FİNANSAL BİLGİLER ============
    monetary = root.find('.//cac:LegalMonetaryTotal', NAMESPACES)
    if monetary is not None:
        data['financial'] = {
            'line_extension_amount': {
                'xpath': './/cac:LegalMonetaryTotal/cbc:LineExtensionAmount',
                'value': find_text(monetary, 'cbc:LineExtensionAmount'),
                'currency': monetary.find('cbc:LineExtensionAmount', NAMESPACES).get('currencyID', '') if monetary.find('cbc:LineExtensionAmount', NAMESPACES) is not None else '',
                'description': 'KDV Hariç Toplam'
            },
            'tax_exclusive_amount': {
                'xpath': './/cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount',
                'value': find_text(monetary, 'cbc:TaxExclusiveAmount'),
                'currency': monetary.find('cbc:TaxExclusiveAmount', NAMESPACES).get('currencyID', '') if monetary.find('cbc:TaxExclusiveAmount', NAMESPACES) is not None else '',
                'description': 'KDV Hariç Tutar'
            },
            'tax_inclusive_amount': {
                'xpath': './/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount',
                'value': find_text(monetary, 'cbc:TaxInclusiveAmount'),
                'currency': monetary.find('cbc:TaxInclusiveAmount', NAMESPACES).get('currencyID', '') if monetary.find('cbc:TaxInclusiveAmount', NAMESPACES) is not None else '',
                'description': 'KDV Dahil Tutar'
            },
            'payable_amount': {
                'xpath': './/cac:LegalMonetaryTotal/cbc:PayableAmount',
                'value': find_text(monetary, 'cbc:PayableAmount'),
                'currency': monetary.find('cbc:PayableAmount', NAMESPACES).get('currencyID', '') if monetary.find('cbc:PayableAmount', NAMESPACES) is not None else '',
                'description': 'Ödenecek Tutar'
            }
        }
    
    # ============ FATURA KALEMLERİ ============
    for line in find_all(root, './/cac:InvoiceLine'):
        line_id = find_text(line, 'cbc:ID')
        
        # Item Description
        item = line.find('.//cac:Item', NAMESPACES)
        item_desc = {}
        if item is not None:
            item_desc = {
                'name': {
                    'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:Item/cbc:Name',
                    'value': find_text(item, 'cbc:Name'),
                    'description': 'Ürün/Hizmet Adı'
                },
                'description': {
                    'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:Item/cbc:Description',
                    'value': find_text(item, 'cbc:Description'),
                    'description': 'Açıklama'
                }
            }
        
        # Quantity
        quantity = line.find('.//cbc:InvoicedQuantity', NAMESPACES)
        quantity_data = {}
        if quantity is not None:
            quantity_data = {
                'xpath': f'.//cac:InvoiceLine[{line_id}]/cbc:InvoicedQuantity',
                'value': quantity.text,
                'unit_code': quantity.get('unitCode', ''),
                'description': 'Miktar'
            }
        
        # Price
        price = line.find('.//cac:Price', NAMESPACES)
        price_data = {}
        if price is not None:
            price_amount = price.find('cbc:PriceAmount', NAMESPACES)
            price_data = {
                'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:Price/cbc:PriceAmount',
                'value': price_amount.text if price_amount is not None else '',
                'currency': price_amount.get('currencyID', '') if price_amount is not None else '',
                'description': 'Birim Fiyat'
            }
        
        # Line Extension Amount
        line_ext = line.find('.//cbc:LineExtensionAmount', NAMESPACES)
        
        # Tax
        tax_total = line.find('.//cac:TaxTotal', NAMESPACES)
        tax_data = {}
        if tax_total is not None:
            tax_subtotal = tax_total.find('.//cac:TaxSubtotal', NAMESPACES)
            if tax_subtotal is not None:
                tax_data = {
                    'taxable_amount': {
                        'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount',
                        'value': find_text(tax_subtotal, 'cbc:TaxableAmount'),
                        'description': 'KDV Matrahı'
                    },
                    'tax_amount': {
                        'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:TaxTotal/cbc:TaxAmount',
                        'value': find_text(tax_total, 'cbc:TaxAmount'),
                        'description': 'KDV Tutarı'
                    },
                    'percent': {
                        'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent',
                        'value': find_text(tax_subtotal, 'cbc:Percent'),
                        'description': 'KDV Oranı (%)'
                    },
                    'tax_scheme_id': {
                        'xpath': f'.//cac:InvoiceLine[{line_id}]/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:TaxSchemeID',
                        'value': find_text(tax_subtotal, 'cac:TaxCategory/cac:TaxScheme/cbc:TaxSchemeID'),
                        'description': 'KDV Kategorisi'
                    }
                }
        
        data['lines'].append({
            'line_id': line_id,
            'item': item_desc,
            'quantity': quantity_data,
            'price': price_data,
            'line_extension_amount': {
                'xpath': f'.//cac:InvoiceLine[{line_id}]/cbc:LineExtensionAmount',
                'value': line_ext.text if line_ext is not None else '',
                'currency': line_ext.get('currencyID', '') if line_ext is not None else '',
                'description': 'Kalem Tutarı'
            },
            'tax': tax_data
        })
    
    return data

def print_mapping_guide(data):
    """Mapping rehberini yazdır"""
    print("="*80)
    print("📋 XML MAPPING REHBERİ - TÜM VERİLER")
    print("="*80)
    
    # TEDARİKÇİ
    print("\n" + "="*80)
    print("🏢 TEDARİKÇİ BİLGİLERİ - TÜM ALANLAR")
    print("="*80)
    
    supplier = data['supplier']
    
    print("\n1️⃣ PARTY IDENTIFICATION (Kimlik Bilgileri):")
    for i, ident in enumerate(supplier.get('identifications', []), 1):
        print(f"   [{i}] {ident['description']}")
        print(f"       XPath: {ident['xpath']}")
        print(f"       Değer: {ident['value']}")
        print(f"       Scheme ID: {ident['scheme_id']}")
        print()
    
    print("2️⃣ PARTY NAME (Şirket Adı):")
    if supplier.get('party_name'):
        pn = supplier['party_name']
        print(f"   XPath: {pn['xpath']}")
        print(f"   Değer: {pn['value']}")
        print()
    
    print("3️⃣ ADRES BİLGİLERİ:")
    for key, addr_info in supplier.get('address', {}).items():
        print(f"   [{key}] {addr_info['description']}")
        print(f"       XPath: {addr_info['xpath']}")
        print(f"       Değer: {addr_info['value']}")
        print()
    
    print("4️⃣ VERGİ BİLGİLERİ:")
    for key, tax_info in supplier.get('tax_scheme', {}).items():
        print(f"   [{key}] {tax_info['description']}")
        print(f"       XPath: {tax_info['xpath']}")
        print(f"       Değer: {tax_info['value']}")
        print()
    
    print("5️⃣ İLETİŞİM BİLGİLERİ:")
    for key, contact_info in supplier.get('contact', {}).items():
        print(f"   [{key}] {contact_info['description']}")
        print(f"       XPath: {contact_info['xpath']}")
        print(f"       Değer: {contact_info['value']}")
        print()
    
    print("6️⃣ KİŞİ BİLGİLERİ (Gerçek Kişi ise):")
    for key, person_info in supplier.get('person', {}).items():
        print(f"   [{key}] {person_info['description']}")
        print(f"       XPath: {person_info['xpath']}")
        print(f"       Değer: {person_info['value']}")
        print()
    
    # JSON'a kaydet
    with open('scripts/xml_mapping_complete.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*80)
    print("✅ Tüm mapping bilgileri JSON'a kaydedildi: scripts/xml_mapping_complete.json")
    print("="*80)

def main():
    xml_file = 'scripts/invoice_skr2026000000187.xml'
    data = extract_complete_data(xml_file)
    print_mapping_guide(data)

if __name__ == '__main__':
    main()
