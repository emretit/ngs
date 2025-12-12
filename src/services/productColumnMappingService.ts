import { supabase } from '@/integrations/supabase/client';

/**
 * Product Column Mapping Service using Google Gemini AI
 */

// Sistemdeki beklenen alanlar ve açıklamaları
const SYSTEM_FIELDS = {
  name: {
    description: 'Ürün adı (zorunlu)',
    examples: ['ad', 'isim', 'ürün adı', 'product name', 'name', 'title', 'başlık'],
    required: true
  },
  description: {
    description: 'Ürün açıklaması (isteğe bağlı)',
    examples: ['açıklama', 'description', 'detay', 'detail', 'not', 'note'],
    required: false
  },
  sku: {
    description: 'Stok kodu (isteğe bağlı)',
    examples: ['stok kodu', 'sku', 'kod', 'code', 'ürün kodu', 'product code'],
    required: false
  },
  barcode: {
    description: 'Barkod (isteğe bağlı)',
    examples: ['barkod', 'barcode', 'gtin', 'ean'],
    required: false
  },
  price: {
    description: 'Satış fiyatı (zorunlu)',
    examples: ['fiyat', 'price', 'satış fiyatı', 'sale price', 'tutar', 'amount', 'cost'],
    required: true
  },
  discount_rate: {
    description: 'İndirim oranı % (isteğe bağlı)',
    examples: ['indirim oranı', 'discount rate', 'indirim', 'discount', 'iskonto'],
    required: false
  },
  stock_quantity: {
    description: 'Stok miktarı (isteğe bağlı)',
    examples: ['stok miktarı', 'stock quantity', 'stok', 'stock', 'miktar', 'quantity', 'qty'],
    required: false
  },
  min_stock_level: {
    description: 'Minimum stok seviyesi (isteğe bağlı)',
    examples: ['minimum stok', 'min stock level', 'min stok', 'minimum seviye'],
    required: false
  },
  stock_threshold: {
    description: 'Stok eşiği (isteğe bağlı)',
    examples: ['stok eşiği', 'stock threshold', 'eşik', 'threshold'],
    required: false
  },
  tax_rate: {
    description: 'Vergi oranı % (zorunlu, default: 20)',
    examples: ['vergi oranı', 'tax rate', 'kdv', 'kdv oranı', 'vat', 'vat rate'],
    required: true
  },
  unit: {
    description: 'Birim (zorunlu, default: piece)',
    examples: ['birim', 'unit', 'ölçü birimi', 'measurement unit'],
    required: true
  },
  currency: {
    description: 'Para birimi (zorunlu, default: TRY)',
    examples: ['para birimi', 'currency', 'döviz', 'para', 'money'],
    required: true
  },
  category_type: {
    description: 'Kategori tipi (isteğe bağlı, default: product)',
    examples: ['kategori tipi', 'category type', 'kategori', 'category'],
    required: false
  },
  product_type: {
    description: 'Ürün tipi (zorunlu, default: physical)',
    examples: ['ürün tipi', 'product type', 'tip', 'type'],
    required: true
  },
  status: {
    description: 'Durum (isteğe bağlı, default: active)',
    examples: ['durum', 'status', 'statu'],
    required: false
  },
  is_active: {
    description: 'Aktif mi? (isteğe bağlı, default: true)',
    examples: ['aktif', 'is active', 'aktif mi', 'active', 'enabled'],
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
 * AI ile Excel kolonlarını sistem alanlarına eşleştir
 */
export const mapExcelColumnsWithAI = async (
  excelColumns: string[]
): Promise<MappingResult> => {
  try {
    const targetFields = Object.entries(SYSTEM_FIELDS).map(([field, info]) => ({
      name: field,
      description: `${info.description} (Örnekler: ${info.examples.join(', ')}) ${info.required ? '[ZORUNLU]' : '[İSTEĞE BAĞLI]'}`
    }));

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        type: 'map-columns',
        sourceColumns: excelColumns,
        targetFields,
        model: 'gemini-2.5-flash-lite'
      }
    });

    if (error || data.error) {
      console.error('AI mapping error:', error || data.error);
      return fallbackMapping(excelColumns);
    }

    const result = data;

    const validatedMappings = (result.mappings || [])
      .filter((m: any) => m.confidence >= 50)
      .filter((m: any) => Object.keys(SYSTEM_FIELDS).includes(m.target || m.systemField))
      .map((m: any) => ({
        excelColumn: (m.source || m.excelColumn || '').trim(),
        systemField: (m.target || m.systemField || '').trim(),
        confidence: m.confidence || 80,
        description: `"${m.source || m.excelColumn}" → ${m.target || m.systemField}`
      }));

    const mappedExcelColumns = new Set(validatedMappings.map((m: any) => m.excelColumn.toLowerCase()));
    const unmappedColumns = excelColumns.filter(
      col => !mappedExcelColumns.has(col.toLowerCase())
    );

    const avgConfidence = validatedMappings.length > 0
      ? validatedMappings.reduce((sum: number, m: any) => sum + m.confidence, 0) / validatedMappings.length
      : 0;

    return {
      mappings: validatedMappings,
      unmappedColumns,
      confidence: Math.round(avgConfidence)
    };

  } catch (error: any) {
    console.error('AI mapping error:', error);
    return fallbackMapping(excelColumns);
  }
};

/**
 * Fallback: AI yoksa manuel mapping
 */
const fallbackMapping = (excelColumns: string[]): MappingResult => {
  const headerMap: { [key: string]: string } = {
    // name varyasyonları
    'ad': 'name', 'isim': 'name', 'ürün adı': 'name', 'ürün adi': 'name',
    'urun adi': 'name', 'urun adı': 'name', 'product name': 'name', 'name': 'name',
    'title': 'name', 'başlık': 'name', 'baslik': 'name', 'ürün': 'name', 'urun': 'name',
    'product': 'name', 'mal adı': 'name', 'mal adi': 'name',
    
    // description varyasyonları
    'açıklama': 'description', 'aciklama': 'description', 'description': 'description',
    'detay': 'description', 'detail': 'description', 'not': 'description', 'note': 'description',
    
    // sku varyasyonları
    'stok kodu': 'sku', 'sku': 'sku', 'kod': 'sku', 'code': 'sku',
    'ürün kodu': 'sku', 'urun kodu': 'sku', 'product code': 'sku',
    
    // barcode varyasyonları
    'barkod': 'barcode', 'barcode': 'barcode', 'gtin': 'barcode', 'ean': 'barcode',
    
    // price varyasyonları
    'fiyat': 'price', 'price': 'price', 'satış fiyatı': 'price', 'satis fiyati': 'price',
    'sale price': 'price', 'tutar': 'price', 'amount': 'price', 'cost': 'price',
    'birim fiyat': 'price', 'unit price': 'price',
    
    // discount_rate varyasyonları
    'indirim oranı': 'discount_rate', 'indirim orani': 'discount_rate',
    'discount rate': 'discount_rate', 'indirim': 'discount_rate', 'discount': 'discount_rate',
    'iskonto': 'discount_rate',
    
    // stock_quantity varyasyonları
    'stok miktarı': 'stock_quantity', 'stok miktari': 'stock_quantity',
    'stock quantity': 'stock_quantity', 'stok': 'stock_quantity', 'stock': 'stock_quantity',
    'miktar': 'stock_quantity', 'quantity': 'stock_quantity', 'qty': 'stock_quantity',
    'adet': 'stock_quantity',
    
    // min_stock_level varyasyonları
    'minimum stok': 'min_stock_level', 'min stock level': 'min_stock_level',
    'min stok': 'min_stock_level',
    
    // stock_threshold varyasyonları
    'stok eşiği': 'stock_threshold', 'stok esigi': 'stock_threshold',
    'stock threshold': 'stock_threshold',
    
    // tax_rate varyasyonları
    'vergi oranı': 'tax_rate', 'vergi orani': 'tax_rate', 'tax rate': 'tax_rate',
    'kdv': 'tax_rate', 'kdv oranı': 'tax_rate', 'kdv orani': 'tax_rate',
    'vat': 'tax_rate', 'vat rate': 'tax_rate',
    
    // unit varyasyonları
    'birim': 'unit', 'unit': 'unit', 'ölçü birimi': 'unit', 'olcu birimi': 'unit',
    
    // currency varyasyonları
    'para birimi': 'currency', 'currency': 'currency', 'döviz': 'currency', 'doviz': 'currency',
    
    // category_type varyasyonları
    'kategori tipi': 'category_type', 'category type': 'category_type',
    'kategori': 'category_type', 'category': 'category_type',
    
    // product_type varyasyonları
    'ürün tipi': 'product_type', 'urun tipi': 'product_type', 'product type': 'product_type',
    'tip': 'product_type', 'type': 'product_type',
    
    // status varyasyonları
    'durum': 'status', 'status': 'status', 'statu': 'status',
    
    // is_active varyasyonları
    'aktif': 'is_active', 'is active': 'is_active', 'active': 'is_active', 'enabled': 'is_active'
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

// Export individual mapping functions
export const mapProductColumnsWithAI = mapExcelColumnsWithAI;
