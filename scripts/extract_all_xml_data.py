#!/usr/bin/env python3
"""
XML'deki TÜM verileri çıkar ve mapping için liste oluştur
"""

import xml.etree.ElementTree as ET
import json
from collections import defaultdict

# Namespace'ler
NAMESPACES = {
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'ds': 'http://www.w3.org/2000/09/xmldsig#',
    'xades': 'http://uri.etsi.org/01903/v1.3.2#',
}

def get_all_elements(root, path='', elements_dict=None):
    """Tüm elementleri recursive olarak topla"""
    if elements_dict is None:
        elements_dict = defaultdict(list)
    
    # Mevcut element bilgilerini kaydet
    tag = root.tag
    # Namespace'i temizle
    clean_tag = tag.split('}')[-1] if '}' in tag else tag
    namespace = tag.split('}')[0][1:] if '}' in tag else ''
    
    full_path = f"{path}/{clean_tag}" if path else clean_tag
    
    # Text içeriği varsa kaydet
    if root.text and root.text.strip():
        elements_dict[full_path].append({
            'value': root.text.strip(),
            'namespace': namespace,
            'attributes': dict(root.attrib),
            'full_tag': tag
        })
    
    # Alt elementleri recursive olarak işle
    for child in root:
        get_all_elements(child, full_path, elements_dict)
    
    return elements_dict

def extract_all_data(xml_file):
    """XML'deki tüm verileri çıkar"""
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    all_data = get_all_elements(root)
    
    # Kategorilere ayır
    categories = {
        'invoice_basic': [],
        'supplier': [],
        'customer': [],
        'financial': [],
        'lines': [],
        'taxes': [],
        'payment': [],
        'delivery': [],
        'signature': [],
        'other': []
    }
    
    for path, values in all_data.items():
        path_lower = path.lower()
        
        if any(x in path_lower for x in ['supplier', 'accountingsupplier']):
            categories['supplier'].append((path, values))
        elif any(x in path_lower for x in ['customer', 'accountingcustomer']):
            categories['customer'].append((path, values))
        elif any(x in path_lower for x in ['line', 'invoiceline']):
            categories['lines'].append((path, values))
        elif any(x in path_lower for x in ['tax', 'taxable', 'taxamount']):
            categories['taxes'].append((path, values))
        elif any(x in path_lower for x in ['payment', 'payable', 'monetary']):
            categories['payment'].append((path, values))
        elif any(x in path_lower for x in ['delivery', 'deliveryterms']):
            categories['delivery'].append((path, values))
        elif any(x in path_lower for x in ['signature', 'signing']):
            categories['signature'].append((path, values))
        elif any(x in path_lower for x in ['id', 'uuid', 'number', 'date', 'time', 'type', 'currency', 'profile']):
            categories['invoice_basic'].append((path, values))
        else:
            categories['other'].append((path, values))
    
    return categories, all_data

def print_category(category_name, items):
    """Kategoriyi yazdır"""
    print(f"\n{'='*80}")
    print(f"📋 {category_name.upper().replace('_', ' ')}")
    print('='*80)
    
    for path, values in items:
        print(f"\n📍 Path: {path}")
        for i, val in enumerate(values, 1):
            print(f"  [{i}] Değer: {val['value']}")
            if val.get('attributes'):
                print(f"      Attributes: {val['attributes']}")
            if val.get('namespace'):
                print(f"      Namespace: {val['namespace']}")

def main():
    xml_file = 'scripts/invoice_esg2026000000115.xml'
    
    print("🔍 XML'deki TÜM veriler çıkarılıyor...")
    print()
    
    categories, all_data = extract_all_data(xml_file)
    
    # Kategorilere göre yazdır
    for cat_name, items in categories.items():
        if items:
            print_category(cat_name, items)
    
    # Tüm path'leri JSON'a kaydet
    output = {
        'total_paths': len(all_data),
        'categories': {},
        'all_paths': {}
    }
    
    for cat_name, items in categories.items():
        if items:
            output['categories'][cat_name] = {
                'count': len(items),
                'paths': [{'path': path, 'values': values} for path, values in items]
            }
    
    # Tüm path'leri de kaydet
    for path, values in all_data.items():
        output['all_paths'][path] = [v['value'] for v in values]
    
    # JSON'a kaydet
    with open('scripts/xml_all_data_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*80}")
    print("✅ Tüm veriler çıkarıldı!")
    print(f"📊 Toplam {len(all_data)} farklı path bulundu")
    print(f"💾 Detaylı mapping JSON'a kaydedildi: scripts/xml_all_data_mapping.json")
    print('='*80)
    
    # Özet tablo
    print("\n📊 KATEGORİ ÖZETİ:")
    print("-" * 80)
    for cat_name, items in categories.items():
        if items:
            print(f"  {cat_name:20s}: {len(items):3d} path")

if __name__ == '__main__':
    main()
