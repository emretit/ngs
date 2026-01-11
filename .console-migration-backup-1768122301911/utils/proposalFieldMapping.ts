import { Proposal } from "@/types/proposal";

/**
 * Teklifler için Standart Field List Tanımları
 * Bu field'lar her template'te bulunmalı ki veriler doğru eşlenebilsin
 */

export interface StandardProposalFields {
  // 1. TEKLİF BİLGİLERİ
  proposalNumber: string;        // Teklif numarası
  proposalTitle: string;         // Teklif başlığı
  proposalDate: string;          // Teklif tarihi
  proposalValidUntil: string;    // Geçerlilik tarihi
  proposalStatus: string;        // Teklif durumu
  
  // 2. ŞİRKET BİLGİLERİ
  companyName: string;           // Şirket adı
  companyLogo: string;           // Şirket logosu
  companyAddress: string;        // Şirket adresi
  companyPhone: string;          // Şirket telefonu
  companyEmail: string;          // Şirket e-mail
  
  // 3. MÜŞTERİ BİLGİLERİ
  customerName: string;          // Müşteri adı
  customerCompany: string;       // Müşteri şirketi
  customerEmail: string;         // Müşteri e-mail
  customerPhone: string;         // Müşteri telefon
  customerAddress: string;       // Müşteri adresi
  
  // 4. SATIŞ TEMSİLCİSİ BİLGİLERİ
  employeeName: string;          // Satış temsilcisi adı
  employeeTitle: string;         // Satış temsilcisi ünvanı
  employeePhone: string;         // Satış temsilcisi telefon
  employeeEmail: string;         // Satış temsilcisi e-mail
  
  // 5. FİNANSAL BİLGİLER
  subtotal: string;              // Ara toplam
  subtotalLabel: string;         // Ara toplam etiketi
  taxAmount: string;             // KDV tutarı
  taxLabel: string;              // KDV etiketi
  totalAmount: string;           // Genel toplam
  totalLabel: string;            // Genel toplam etiketi
  currency: string;              // Para birimi
  
  // 6. ÜRÜN/HİZMET BİLGİLERİ
  itemsTable: any;               // Ürün tablosu (can be string[][] or string)
  itemCount: string;             // Toplam kalem sayısı
  
  // 7. ŞART VE KOŞULLAR
  paymentTerms: string;          // Ödeme şartları
  deliveryTerms: string;         // Teslimat şartları
  warrantyTerms: string;         // Garanti şartları
  
  // 8. EK BİLGİLER
  notes: string;                 // Notlar
  internalNotes: string;         // İç notlar
  description: string;           // Açıklama
}

/**
 * Field Key Mapping - Template field adları ile proposal verilerini eşler
 */
export const STANDARD_FIELD_MAPPING: Record<keyof StandardProposalFields, {
  templateKeys: string[];        // Template'te kullanılabilecek field adları
  dataPath: string;             // Proposal object'indeki veri yolu
  formatter?: (value: any, proposal?: Proposal) => any; // Veri formatı - any type for table support
}> = {
  // 1. TEKLİF BİLGİLERİ
  proposalNumber: {
    templateKeys: ['proposalNumber', 'proposal_number', 'teklifNo', 'number', 'no'],
    dataPath: 'number',
    formatter: (value) => value || 'TEK-001'
  },
  proposalTitle: {
    templateKeys: ['proposalTitle', 'proposal_title', 'teklifBaslik', 'title', 'baslik'],
    dataPath: 'title',
    formatter: (value) => value || 'Teklif'
  },
  proposalDate: {
    templateKeys: ['proposalDate', 'proposal_date', 'teklifTarih', 'date', 'tarih'],
    dataPath: 'offer_date',
    formatter: (value, proposal) => {
      // Önce offer_date'i kontrol et, yoksa created_at'i kullan (fallback)
      const dateValue = value || (proposal?.created_at);
      return dateValue ? new Date(dateValue).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
    }
  },
  proposalValidUntil: {
    templateKeys: ['proposalValidUntil', 'valid_until', 'gecerlilik', 'validUntil', 'gecerli'],
    dataPath: 'valid_until',
    formatter: (value) => value ? new Date(value).toLocaleDateString('tr-TR') : 'Belirtilmemiş'
  },
  proposalStatus: {
    templateKeys: ['proposalStatus', 'proposal_status', 'durum', 'status'],
    dataPath: 'status',
    formatter: (value) => {
      const statusMap = {
        'draft': 'Taslak',
        'pending_approval': 'Onay Bekliyor',
        'sent': 'Gönderildi',
        'accepted': 'Kabul Edildi',
        'rejected': 'Reddedildi',
        'expired': 'Süresi Doldu'
      };
      return statusMap[value as keyof typeof statusMap] || value || 'Bilinmiyor';
    }
  },

  // 2. ŞİRKET BİLGİLERİ
  companyName: {
    templateKeys: ['companyName', 'company_name', 'sirketAd', 'sirket', 'company'],
    dataPath: 'static',
    formatter: () => 'PAFTA TEKNOLOJİ'
  },
  companyLogo: {
    templateKeys: ['companyLogo', 'company_logo', 'sirketLogo', 'logo'],
    dataPath: 'static',
    formatter: () => '' // Logo base64 veya URL
  },
  companyAddress: {
    templateKeys: ['companyAddress', 'company_address', 'sirketAdres', 'address'],
    dataPath: 'static',
    formatter: () => 'İstanbul, Türkiye'
  },
  companyPhone: {
    templateKeys: ['companyPhone', 'company_phone', 'sirketTelefon', 'phone'],
    dataPath: 'static',
    formatter: () => '+90 555 123 45 67'
  },
  companyEmail: {
    templateKeys: ['companyEmail', 'company_email', 'sirketEmail', 'email'],
    dataPath: 'static',
    formatter: () => 'info@pafta.app'
  },

  // 3. MÜŞTERİ BİLGİLERİ
  customerName: {
    templateKeys: ['customerName', 'customer_name', 'musteriAd', 'musteri', 'customer'],
    dataPath: 'customer.name || customer_name',
    formatter: (value, proposal) => proposal?.customer?.name || proposal?.customer_name || 'Belirtilmemiş'
  },
  customerCompany: {
    templateKeys: ['customerCompany', 'customer_company', 'musteriSirket', 'customerSirket'],
    dataPath: 'customer.company',
    formatter: (value, proposal) => proposal?.customer?.company || ''
  },
  customerEmail: {
    templateKeys: ['customerEmail', 'customer_email', 'musteriEmail'],
    dataPath: 'customer.email',
    formatter: (value, proposal) => proposal?.customer?.email || ''
  },
  customerPhone: {
    templateKeys: ['customerPhone', 'customer_phone', 'musteriTelefon'],
    dataPath: 'customer.phone',
    formatter: (value, proposal) => proposal?.customer?.phone || ''
  },
  customerAddress: {
    templateKeys: ['customerAddress', 'customer_address', 'musteriAdres'],
    dataPath: 'customer.address',
    formatter: (value, proposal) => proposal?.customer?.address || ''
  },

  // 4. SATIŞ TEMSİLCİSİ BİLGİLERİ
  employeeName: {
    templateKeys: ['employeeName', 'employee_name', 'satisTemsilci', 'employee', 'temsilci'],
    dataPath: 'employee',
    formatter: (value, proposal) => {
      const emp = proposal?.employee;
      return emp ? `${emp.first_name} ${emp.last_name}` : 'Belirtilmemiş';
    }
  },
  employeeTitle: {
    templateKeys: ['employeeTitle', 'employee_title', 'temsilciUnvan'],
    dataPath: 'employee.title',
    formatter: (value, proposal) => proposal?.employee?.position || 'Satış Danışmanı'
  },
  employeePhone: {
    templateKeys: ['employeePhone', 'employee_phone', 'temsilciTelefon'],
    dataPath: 'employee.phone',
    formatter: (value, proposal) => proposal?.employee?.phone || ''
  },
  employeeEmail: {
    templateKeys: ['employeeEmail', 'employee_email', 'temsilciEmail'],
    dataPath: 'employee.email',
    formatter: (value, proposal) => proposal?.employee?.email || ''
  },

  // 5. FİNANSAL BİLGİLER
  subtotal: {
    templateKeys: ['subtotal', 'ara_toplam', 'araToplam', 'subTotal'],
    dataPath: 'calculated',
    formatter: (value, proposal) => {
      const items = proposal?.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
      return `${subtotal.toLocaleString('tr-TR')} ₺`;
    }
  },
  subtotalLabel: {
    templateKeys: ['subtotalLabel', 'subtotal_label', 'araToplamLabel'],
    dataPath: 'static',
    formatter: () => 'Ara Toplam:'
  },
  taxAmount: {
    templateKeys: ['taxAmount', 'tax_amount', 'kdvTutar', 'kdv', 'vergi'],
    dataPath: 'calculated',
    formatter: (value, proposal) => {
      const items = proposal?.items || [];
      const taxTotal = items.reduce((sum, item) => {
        const itemTotal = item.total_price || 0;
        const taxRate = item.tax_rate || 0;
        return sum + (itemTotal * taxRate / 100);
      }, 0);
      return `${taxTotal.toLocaleString('tr-TR')} ₺`;
    }
  },
  taxLabel: {
    templateKeys: ['taxLabel', 'tax_label', 'kdvLabel'],
    dataPath: 'static',
    formatter: () => 'KDV:'
  },
  totalAmount: {
    templateKeys: ['totalAmount', 'total_amount', 'genelToplam', 'toplam', 'total', 'tutar'],
    dataPath: 'total_amount',
    formatter: (value, proposal) => {
      const total = proposal?.total_amount || 0;
      const currency = proposal?.currency || 'TRY';
      return `${total.toLocaleString('tr-TR')} ${currency === 'TRY' ? 'TRY' : currency}`;
    }
  },
  totalLabel: {
    templateKeys: ['totalLabel', 'total_label', 'genelToplamLabel', 'toplamLabel'],
    dataPath: 'static',
    formatter: () => 'GENEL TOPLAM:'
  },
  currency: {
    templateKeys: ['currency', 'para_birimi', 'paraBirimi', 'doviz'],
    dataPath: 'currency',
    formatter: (value) => value || 'TRY'
  },

  // 6. ÜRÜN/HİZMET BİLGİLERİ - Basit tablo verisi
  itemsTable: {
    templateKeys: ['itemsTable', 'items_table', 'urunTablo', 'kalemler', 'items', 'products', 'orders'],
    dataPath: 'items',
    formatter: (value, proposal) => {
      const items = proposal?.items || [];
      
      // Her teklif için dinamik satır sayısı
      if (items.length === 0) {
        return [['Ürün/Hizmet', 'Açıklama', 'Miktar', 'Birim', 'Birim Fiyat', 'KDV %', 'Toplam']];
      }
      
      const tableData: string[][] = [];
      
      items.forEach(item => {
        tableData.push([
          item.name || '',
          item.description || '',
          item.quantity?.toString() || '1',
          item.unit || 'adet',
          `${(item.unit_price || 0).toLocaleString('tr-TR')} ₺`,
          `%${item.tax_rate || 20}`,
          `${(item.total_price || 0).toLocaleString('tr-TR')} ₺`
        ]);
      });
      
      return tableData;
    }
  },
  itemCount: {
    templateKeys: ['itemCount', 'item_count', 'kalemSayisi', 'urunSayisi'],
    dataPath: 'items.length',
    formatter: (value, proposal) => `${proposal?.items?.length || 0} kalem`
  },

  // 7. ŞART VE KOŞULLAR
  paymentTerms: {
    templateKeys: ['paymentTerms', 'payment_terms', 'odemeSart', 'odemeKosul'],
    dataPath: 'payment_terms',
    formatter: (value) => value || '30 gün vadeli'
  },
  deliveryTerms: {
    templateKeys: ['deliveryTerms', 'delivery_terms', 'teslimatSart', 'teslimat'],
    dataPath: 'delivery_terms',
    formatter: (value) => value || 'Standart teslimat'
  },
  warrantyTerms: {
    templateKeys: ['warrantyTerms', 'warranty_terms', 'garantiSart', 'garanti'],
    dataPath: 'warranty_terms',
    formatter: (value) => value || '1 yıl garanti'
  },

  // 8. EK BİLGİLER
  notes: {
    templateKeys: ['notes', 'notlar', 'aciklama'],
    dataPath: 'notes',
    formatter: (value) => value || ''
  },
  internalNotes: {
    templateKeys: ['internalNotes', 'internal_notes', 'icNotlar'],
    dataPath: 'internal_notes',
    formatter: (value) => value || ''
  },
  description: {
    templateKeys: ['description', 'aciklama', 'detay'],
    dataPath: 'description',
    formatter: (value) => value || ''
  }
};

/**
 * Proposal verilerini basit template input formatına dönüştürür
 */
export function mapProposalToTemplateInputs(
  proposal: Proposal,
  templateSchema: any
): Record<string, any> {
  const inputs: Record<string, any> = {};
  
  console.log('🔄 Template Schema Debug:', {
    rawSchema: templateSchema,
    schemasLength: templateSchema?.schemas?.length,
    schemasFirstItem: templateSchema?.schemas?.[0],
    isFirstItemArray: Array.isArray(templateSchema?.schemas?.[0])
  });
  
  // Template yapısını kontrol et
  if (!templateSchema?.schemas?.[0]) {
    console.warn('Template schemas bulunamadı:', templateSchema);
    return inputs;
  }
  
  // Template fields'ı al
  let templateFields = templateSchema.schemas[0];
  
  // Eğer schemas[0] array ise, ilk elemanı al (nested array durumu)
  if (Array.isArray(templateFields)) {
    // Schema yapısı [[field1, field2, ...]] şeklinde
    const fieldsObject = {};
    templateFields.forEach(field => {
      if (field.name) {
        fieldsObject[field.name] = field;
      }
    });
    templateFields = fieldsObject;
  }
  
  // Template'teki her field için uygun veriyi bul
  Object.keys(templateFields).forEach(fieldKey => {
    const fieldConfig = templateFields[fieldKey];
    const fieldName = fieldConfig.name || fieldKey; // name yoksa key'i kullan
    
    console.log(`🔍 Field mapping: ${fieldKey} (name: ${fieldName})`);
    
    // Standard mapping'te eşleşen field'ı bul
    const mappingEntry = findFieldMappingByName(fieldName);
    
    if (mappingEntry) {
      const [standardKey, mapping] = mappingEntry;
      // Veriyi al ve formatla
      const rawValue = getNestedValue(proposal, mapping.dataPath);
      inputs[fieldName] = mapping.formatter 
        ? mapping.formatter(rawValue, proposal)
        : rawValue || `Örnek ${fieldName}`;
      
      console.log(`✅ Mapped ${fieldName}: ${inputs[fieldName]}`);
    } else {
      // Eşleşme bulunamazsa genel fallback
      inputs[fieldName] = `Örnek ${fieldName}`;
      console.log(`⚠️ Fallback for ${fieldName}: ${inputs[fieldName]}`);
    }
  });
  
  console.log('📋 Final Template Fields:', templateFields);
  console.log('🎯 Generated Inputs:', inputs);
  
  return inputs;
}

/**
 * Field adına göre mapping bulur (case-insensitive)
 */
function findFieldMappingByName(fieldName: string): [string, typeof STANDARD_FIELD_MAPPING[keyof typeof STANDARD_FIELD_MAPPING]] | null {
  const lowerFieldName = fieldName.toLowerCase();
  
  for (const [standardKey, mapping] of Object.entries(STANDARD_FIELD_MAPPING)) {
    // Ana field adını kontrol et
    if (standardKey.toLowerCase() === lowerFieldName) {
      return [standardKey, mapping];
    }
    
    // Alternatif isimleri kontrol et
    const matchedKey = mapping.templateKeys.find(key => 
      key.toLowerCase() === lowerFieldName ||
      lowerFieldName.includes(key.toLowerCase()) || 
      key.toLowerCase().includes(lowerFieldName)
    );
    
    if (matchedKey) {
      return [standardKey, mapping];
    }
  }
  
  return null;
}

/**
 * Nested object path'ten değer alır (örn: "customer.name")
 */
function getNestedValue(obj: any, path: string): any {
  if (path === 'static') return null;
  if (path === 'calculated') return null;
  
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Template field'larını doğrular
 */
export function validateTemplateFields(templateSchema: any): {
  valid: boolean;
  missingFields: string[];
  recommendations: string[];
  templateFields: string[];
  matchedFields: Array<{ fieldKey: string; fieldName: string; standard: string }>;
} {
  const recommendations: string[] = [];
  const missingFields: string[] = [];
  const matchedFields: Array<{ fieldKey: string; fieldName: string; standard: string }> = [];
  
  if (!templateSchema?.schemas?.[0]) {
    return {
      valid: false,
      missingFields: ['Template schemas bulunamadı'],
      recommendations: ['Template yapısını kontrol edin - schemas[0] gerekli'],
      templateFields: [],
      matchedFields: []
    };
  }
  
  // Template field'larını al
  const templateFields = templateSchema.schemas[0];
  const templateFieldKeys = Object.keys(templateFields);
  
  console.log('🔍 Template fields:', templateFieldKeys);
  
  // Her template field'ının hangi standart field'a eşlendiğini kontrol et
  templateFieldKeys.forEach(fieldKey => {
    const fieldConfig = templateFields[fieldKey];
    const fieldName = fieldConfig.name || fieldKey;
    
    const mappingEntry = findFieldMappingByName(fieldName);
    if (mappingEntry) {
      const [standardKey] = mappingEntry;
      matchedFields.push({
        fieldKey,
        fieldName,
        standard: standardKey
      });
    }
  });
  
  // Önemli field'ların eksik olup olmadığını kontrol et
  const criticalFields = [
    'proposalNumber', 'proposalTitle', 'customerName', 
    'totalAmount', 'itemsTable', 'proposalDate'
  ];
  
  criticalFields.forEach(criticalField => {
    const hasMatchingField = matchedFields.some(matched => 
      matched.standard === criticalField
    );
    
    if (!hasMatchingField) {
      const mapping = STANDARD_FIELD_MAPPING[criticalField as keyof StandardProposalFields];
      missingFields.push(criticalField);
      recommendations.push(
        `${criticalField} için field ekleyin. Önerilen isimler: ${mapping.templateKeys.join(', ')}`
      );
    }
  });
  
  // İyi örnekler ver
  if (recommendations.length > 0) {
    recommendations.push('');
    recommendations.push('Template Örneği:');
    recommendations.push('{');
    recommendations.push('  "schemas": [');
    recommendations.push('    [');
    recommendations.push('      {');
    recommendations.push('        "name": "proposalNumber",');
    recommendations.push('        "type": "text",');
    recommendations.push('        "position": { "x": 20, "y": 20 },');
    recommendations.push('        "width": 100, "height": 12');
    recommendations.push('      }');
    recommendations.push('    ]');
    recommendations.push('  ]');
    recommendations.push('}');
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    recommendations,
    templateFields: templateFieldKeys,
    matchedFields
  };
}
