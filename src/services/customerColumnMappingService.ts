import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Customer Column Mapping Service using Google Gemini AI
 */

// Sistemdeki beklenen Müşteri alanları ve açıklamaları
const SYSTEM_FIELDS = {
  name: {
    description: 'Müşteri adı / Ünvanı (zorunlu)',
    examples: ['ad', 'isim', 'müşteri adı', 'name', 'title', 'ünvan', 'firma adı'],
    required: true
  },
  company: {
    description: 'Şirket adı (kurumsal müşteriler için zorunlu)',
    examples: ['şirket', 'sirket', 'firma adı', 'company', 'firm', 'company name'],
    required: false
  },
  email: {
    description: 'E-posta adresi',
    examples: ['email', 'e-posta', 'mail', 'posta'],
    required: false
  },
  mobile_phone: {
    description: 'Cep telefonu',
    examples: ['cep', 'cep telefonu', 'mobile', 'gsm', 'telefon'],
    required: false
  },
  office_phone: {
    description: 'İş telefonu',
    examples: ['iş telefonu', 'office phone', 'tel', 'sabit telefon'],
    required: false
  },
  type: {
    description: 'Müşteri tipi (bireysel/kurumsal - default: kurumsal)',
    examples: ['tip', 'type', 'tür', 'müşteri tipi'],
    required: false
  },
  tax_number: {
    description: 'Vergi numarası / TC Kimlik No',
    examples: ['vergi no', 'vkn', 'tckn', 'tax id', 'tc no'],
    required: false
  },
  tax_office: {
    description: 'Vergi dairesi',
    examples: ['vergi dairesi', 'tax office', 'vd'],
    required: false
  },
  address: {
    description: 'Adres',
    examples: ['adres', 'address', 'açık adres'],
    required: false
  },
  city: {
    description: 'Şehir / İl',
    examples: ['şehir', 'il', 'city', 'province'],
    required: false
  },
  district: {
    description: 'İlçe',
    examples: ['ilçe', 'district', 'town'],
    required: false
  },
  country: {
    description: 'Ülke',
    examples: ['ülke', 'country'],
    required: false
  },
  postal_code: {
    description: 'Posta kodu',
    examples: ['posta kodu', 'zip', 'zip code'],
    required: false
  },
  status: {
    description: 'Durum (aktif/pasif - default: aktif)',
    examples: ['durum', 'status'],
    required: false
  }
};

export interface ColumnMapping {
  excelColumn: string;
  systemField: string;
  confidence: number;
  description: string;
}

export interface MappingResult {
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  confidence: number;
}

/**
 * AI ile Excel kolonlarını Müşteri sistem alanlarına eşleştir
 */
export const mapCustomerColumnsWithAI = async (
  excelColumns: string[]
): Promise<MappingResult> => {
  try {
    logger.debug('🔍 AI Mapping başlatılıyor...', { 
      excelColumnsCount: excelColumns.length,
      excelColumns: excelColumns 
    });

    const targetFields = Object.entries(SYSTEM_FIELDS).map(([field, info]) => ({
      name: field,
      description: `${info.description} (Örnekler: ${info.examples.join(', ')}) ${info.required ? '[ZORUNLU]' : '[İSTEĞE BAĞLI]'}`
    }));

    logger.debug('📤 Gemini API\'ye gönderiliyor...', { 
      sourceColumns: excelColumns,
      targetFieldsCount: targetFields.length 
    });

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'map-columns',
        sourceColumns: excelColumns,
        targetFields,
        model: 'gemini-2.0-flash-exp'
      }
    });

    if (error) {
      logger.error('❌ Supabase function error:', error);
      return fallbackMapping(excelColumns);
    }

    if (data?.error) {
      logger.error('❌ AI mapping error:', data.error);
      logger.error('📋 Raw response:', data);
      return fallbackMapping(excelColumns);
    }

    logger.debug('✅ AI Response alındı:', data);

    const result = data;

    // Validate and parse mappings
    if (!result || !result.mappings || !Array.isArray(result.mappings)) {
      logger.warn('⚠️ Invalid response structure, fallback kullanılıyor:', result);
      return fallbackMapping(excelColumns);
    }

    logger.debug(`📊 AI'dan ${result.mappings.length} eşleştirme geldi`);

    const validatedMappings = (result.mappings || [])
      .filter((m: any) => {
        // Confidence kontrolü - AI 0-1 arası gönderebilir, 0-100'e normalize et
        let confidence = typeof m.confidence === 'number' ? m.confidence : 
                         typeof m.confidence === 'string' ? parseFloat(m.confidence) : 0;
        
        // Eğer confidence 1'den küçükse (0-1 arası), 100 ile çarp (0.95 → 95)
        if (confidence > 0 && confidence <= 1) {
          confidence = confidence * 100;
        }
        
        if (confidence < 50) {
          logger.debug(`⏭️ Düşük confidence, atlanıyor:`, { ...m, normalizedConfidence: confidence });
          return false;
        }
        return true;
      })
      .filter((m: any) => {
        // Target field kontrolü
        const targetField = (m.target || m.systemField || '').trim();
        const isValid = Object.keys(SYSTEM_FIELDS).includes(targetField);
        if (!isValid) {
          logger.debug(`⏭️ Geçersiz target field, atlanıyor:`, m);
        }
        return isValid;
      })
      .map((m: any) => {
        const excelColumn = (m.source || m.excelColumn || '').trim();
        const systemField = (m.target || m.systemField || '').trim();
        let confidence = typeof m.confidence === 'number' ? m.confidence : 
                        typeof m.confidence === 'string' ? parseFloat(m.confidence) : 80;
        
        // Eğer confidence 1'den küçükse (0-1 arası), 100 ile çarp (0.95 → 95)
        if (confidence > 0 && confidence <= 1) {
          confidence = confidence * 100;
        }
        
        logger.debug(`✅ Eşleştirme: "${excelColumn}" → ${systemField} (confidence: ${Math.round(confidence)})`);
        
        return {
          excelColumn,
          systemField,
          confidence: Math.round(confidence),
          description: `"${excelColumn}" → ${systemField}`
        };
      });

    // Aynı sistem alanına birden fazla kolon eşleştirilmişse, sadece en yüksek confidence'lı olanı tut
    const systemFieldMap = new Map<string, ColumnMapping>();
    validatedMappings.forEach((mapping) => {
      const existing = systemFieldMap.get(mapping.systemField);
      if (!existing || mapping.confidence > existing.confidence) {
        if (existing) {
          logger.debug(`⚠️ Duplicate system field "${mapping.systemField}": "${existing.excelColumn}" (${existing.confidence}%) yerine "${mapping.excelColumn}" (${mapping.confidence}%) seçildi`);
        }
        systemFieldMap.set(mapping.systemField, mapping);
      } else {
        logger.debug(`⚠️ Duplicate system field "${mapping.systemField}": "${mapping.excelColumn}" (${mapping.confidence}%) atlandı, "${existing.excelColumn}" (${existing.confidence}%) tutuldu`);
      }
    });

    const finalMappings = Array.from(systemFieldMap.values());

    logger.debug(`✅ ${finalMappings.length} geçerli eşleştirme oluşturuldu (duplicate'ler temizlendi)`);

    const mappedExcelColumns = new Set(finalMappings.map((m: any) => m.excelColumn.toLowerCase()));
    const unmappedColumns = excelColumns.filter(
      col => !mappedExcelColumns.has(col.toLowerCase())
    );

    if (unmappedColumns.length > 0) {
      logger.debug(`⚠️ Eşleştirilemeyen kolonlar:`, unmappedColumns);
    }

    const avgConfidence = finalMappings.length > 0
      ? finalMappings.reduce((sum: number, m: any) => sum + m.confidence, 0) / finalMappings.length
      : 0;

    const finalResult = {
      mappings: finalMappings,
      unmappedColumns,
      confidence: Math.round(avgConfidence)
    };

    logger.debug('📋 Final mapping result:', finalResult);

    return finalResult;

  } catch (error: any) {
    logger.error('❌ AI mapping exception:', error);
    logger.error('Stack:', error.stack);
    return fallbackMapping(excelColumns);
  }
};

/**
 * Fallback: Manuel Müşteri Eşleştirme
 */
const fallbackMapping = (excelColumns: string[]): MappingResult => {
  const headerMap: { [key: string]: string } = {
    'ad': 'name',
    'isim': 'name',
    'ünvan': 'name',
    'unvan': 'name',
    'firma': 'name',
    'müşteri': 'name',
    'name': 'name',
    'title': 'name',
    
    'şirket': 'company',
    'sirket': 'company',
    'firma adı': 'company',
    'firma adi': 'company',
    'company': 'company',
    'firm': 'company',
    
    'email': 'email',
    'e-posta': 'email',
    'mail': 'email',
    
    'telefon': 'mobile_phone',
    'cep': 'mobile_phone',
    'gsm': 'mobile_phone',
    'mobile': 'mobile_phone',
    
    'iş': 'office_phone',
    'tel': 'office_phone',
    'sabit': 'office_phone',
    'office': 'office_phone',
    
    'vergi no': 'tax_number',
    'vkn': 'tax_number',
    'tc': 'tax_number',
    'tckn': 'tax_number',
    'tax id': 'tax_number',
    
    'vergi dairesi': 'tax_office',
    'vd': 'tax_office',
    'tax office': 'tax_office',
    
    'adres': 'address',
    'address': 'address',
    
    'şehir': 'city',
    'il': 'city',
    'city': 'city',
    
    'ilçe': 'district',
    'district': 'district',
    
    'ülke': 'country',
    'country': 'country',
    
    'tip': 'type',
    'tür': 'type',
    'type': 'type',
    
    'durum': 'status',
    'status': 'status'
  };

  const mappings: ColumnMapping[] = [];
  const unmappedColumns: string[] = [];

  const normalize = (str: string): string => {
    return str.toLowerCase().trim().replace(/[_-]/g, ' ');
  };

  excelColumns.forEach(col => {
    const originalCol = col?.toString().trim() || '';
    if (!originalCol) return;

    const normalized = normalize(originalCol);
    let systemField = headerMap[normalized];

    // Kısmi eşleşme
    if (!systemField) {
      for (const [key, value] of Object.entries(headerMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
           systemField = value;
           break;
        }
      }
    }

    if (systemField) {
      mappings.push({
        excelColumn: originalCol,
        systemField,
        confidence: 80,
        description: `"${originalCol}" → ${systemField}`
      });
    } else {
      unmappedColumns.push(originalCol);
    }
  });

  return {
    mappings,
    unmappedColumns,
    confidence: mappings.length > 0 ? 80 : 0
  };
};
