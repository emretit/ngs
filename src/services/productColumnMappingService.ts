import Groq from 'groq-sdk';

// Groq API Key - .env dosyasında olmalı: VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groq: Groq | null = null;

if (GROQ_API_KEY) {
  groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });
}

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
  if (!GROQ_API_KEY || !groq) {
    // AI yoksa fallback olarak manuel mapping kullan
    return fallbackMapping(excelColumns);
  }

  try {
    const systemFieldsDescription = Object.entries(SYSTEM_FIELDS)
      .map(([field, info]) => {
        const examples = info.examples.join(', ');
        return `- ${field}: ${info.description} (Örnekler: ${examples}) ${info.required ? '[ZORUNLU]' : '[İSTEĞE BAĞLI]'}`;
      })
      .join('\n');

    const excelColumnsList = excelColumns.map((col, idx) => `${idx + 1}. "${col}"`).join('\n');

    const systemPrompt = `Sen bir veri eşleştirme uzmanısın. Excel dosyasındaki kolon isimlerini, sistemdeki alanlara eşleştiriyorsun.

SİSTEM ALANLARI:
${systemFieldsDescription}

EXCEL KOLONLARI:
${excelColumnsList}

GÖREVİN:
1. Her Excel kolonunu en uygun sistem alanına eşleştir
2. Eşleştirme güvenilirliğini 0-100 arası puanla (confidence)
3. Eşleşmeyen kolonları belirt
4. Türkçe ve İngilizce kolon isimlerini destekle

ÇIKTI FORMATI (JSON):
{
  "mappings": [
    {
      "excelColumn": "Excel kolon adı",
      "systemField": "sistem_alanı",
      "confidence": 95,
      "description": "Eşleştirme açıklaması"
    }
  ],
  "unmappedColumns": ["eşleşmeyen kolon 1", "eşleşmeyen kolon 2"],
  "confidence": 85
}

KURALLAR:
- Aynı Excel kolonu birden fazla sistem alanına eşlenemez
- Aynı sistem alanı birden fazla Excel kolonuna eşlenebilir (en yüksek confidence olanı seç)
- Zorunlu alanlar (name, price, tax_rate, unit, currency, product_type) mutlaka eşlenmeli
- Confidence 50'den düşükse eşleştirme yapma
- Türkçe karakterleri dikkate al (ı, İ, ş, Ş, ğ, Ğ, ü, Ü, ö, Ö, ç, Ç)`;

    const userPrompt = `Excel kolonlarını sistem alanlarına eşleştir. Türkçe ve İngilizce kolon isimlerini destekle.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('AI\'dan yanıt alınamadı');
    }

    const result = JSON.parse(response) as MappingResult;

    // Validasyon ve temizlik
    const validatedMappings = result.mappings
      .filter(m => m.confidence >= 50)
      .filter(m => Object.keys(SYSTEM_FIELDS).includes(m.systemField))
      .map(m => ({
        ...m,
        excelColumn: m.excelColumn.trim(),
        systemField: m.systemField.trim()
      }));

    // Eşlenmeyen kolonları bul
    const mappedExcelColumns = new Set(validatedMappings.map(m => m.excelColumn.toLowerCase()));
    const unmappedColumns = excelColumns.filter(
      col => !mappedExcelColumns.has(col.toLowerCase())
    );

    // Ortalama confidence hesapla
    const avgConfidence = validatedMappings.length > 0
      ? validatedMappings.reduce((sum, m) => sum + m.confidence, 0) / validatedMappings.length
      : 0;

    return {
      mappings: validatedMappings,
      unmappedColumns,
      confidence: Math.round(avgConfidence)
    };

  } catch (error: any) {
    console.error('AI mapping error:', error);
    // Hata durumunda fallback mapping kullan
    return fallbackMapping(excelColumns);
  }
};

/**
 * Fallback: AI yoksa manuel mapping (geliştirilmiş headerMap mantığı)
 */
const fallbackMapping = (excelColumns: string[]): MappingResult => {
  // Genişletilmiş mapping tablosu - tüm olası varyasyonlar
  const headerMap: { [key: string]: string } = {
    // name varyasyonları
    'ad': 'name',
    'isim': 'name',
    'ürün adı': 'name',
    'ürün adi': 'name',
    'urun adi': 'name',
    'urun adı': 'name',
    'product name': 'name',
    'name': 'name',
    'title': 'name',
    'başlık': 'name',
    'baslik': 'name',
    'ürün ismi': 'name',
    'urun ismi': 'name',
    'ürün': 'name',
    'urun': 'name',
    'product': 'name',
    'mal adı': 'name',
    'mal adi': 'name',
    'item name': 'name',
    'item': 'name',
    
    // description varyasyonları
    'açıklama': 'description',
    'aciklama': 'description',
    'description': 'description',
    'detay': 'description',
    'detail': 'description',
    'not': 'description',
    'note': 'description',
    'açıklama metni': 'description',
    'aciklama metni': 'description',
    'ürün açıklaması': 'description',
    'urun aciklamasi': 'description',
    'desc': 'description',
    'notes': 'description',
    'bilgi': 'description',
    'info': 'description',
    
    // sku varyasyonları
    'stok kodu': 'sku',
    'sku': 'sku',
    'kod': 'sku',
    'code': 'sku',
    'ürün kodu': 'sku',
    'urun kodu': 'sku',
    'product code': 'sku',
    'ürün no': 'sku',
    'urun no': 'sku',
    'product no': 'sku',
    'item code': 'sku',
    'mal kodu': 'sku',
    'part number': 'sku',
    'part no': 'sku',
    
    // barcode varyasyonları
    'barkod': 'barcode',
    'barcode': 'barcode',
    'gtin': 'barcode',
    'ean': 'barcode',
    'ean-13': 'barcode',
    'ean13': 'barcode',
    'upc': 'barcode',
    'barkod no': 'barcode',
    'barcode no': 'barcode',
    
    // price varyasyonları
    'fiyat': 'price',
    'price': 'price',
    'satış fiyatı': 'price',
    'satis fiyati': 'price',
    'sale price': 'price',
    'tutar': 'price',
    'amount': 'price',
    'cost': 'price',
    'birim fiyat': 'price',
    'unit price': 'price',
    'fiyat (tl)': 'price',
    'fiyat (try)': 'price',
    'price (try)': 'price',
    'satış tutarı': 'price',
    'satis tutari': 'price',
    'sales price': 'price',
    'list price': 'price',
    'liste fiyatı': 'price',
    'liste fiyati': 'price',
    
    // discount_rate varyasyonları
    'indirim oranı': 'discount_rate',
    'indirim orani': 'discount_rate',
    'discount rate': 'discount_rate',
    'indirim': 'discount_rate',
    'discount': 'discount_rate',
    'iskonto': 'discount_rate',
    'iskonto oranı': 'discount_rate',
    'iskonto orani': 'discount_rate',
    'indirim %': 'discount_rate',
    'discount %': 'discount_rate',
    'indirim yüzdesi': 'discount_rate',
    'indirim yuzdesi': 'discount_rate',
    'discount percentage': 'discount_rate',
    
    // stock_quantity varyasyonları
    'stok miktarı': 'stock_quantity',
    'stok miktari': 'stock_quantity',
    'stock quantity': 'stock_quantity',
    'stok': 'stock_quantity',
    'stock': 'stock_quantity',
    'miktar': 'stock_quantity',
    'quantity': 'stock_quantity',
    'qty': 'stock_quantity',
    'adet': 'stock_quantity',
    'stok adedi': 'stock_quantity',
    'stok adet': 'stock_quantity',
    'mevcut stok': 'stock_quantity',
    'available stock': 'stock_quantity',
    'in stock': 'stock_quantity',
    'envanter': 'stock_quantity',
    'inventory': 'stock_quantity',
    
    // min_stock_level varyasyonları
    'minimum stok': 'min_stock_level',
    'min stock level': 'min_stock_level',
    'min stok': 'min_stock_level',
    'minimum seviye': 'min_stock_level',
    'min seviye': 'min_stock_level',
    'minimum stok seviyesi': 'min_stock_level',
    'min stock': 'min_stock_level',
    'minimum envanter': 'min_stock_level',
    'min inventory': 'min_stock_level',
    'reorder level': 'min_stock_level',
    'yeniden sipariş seviyesi': 'min_stock_level',
    
    // stock_threshold varyasyonları
    'stok eşiği': 'stock_threshold',
    'stok esigi': 'stock_threshold',
    'stock threshold': 'stock_threshold',
    'eşik': 'stock_threshold',
    'esik': 'stock_threshold',
    'threshold': 'stock_threshold',
    'stok uyarı seviyesi': 'stock_threshold',
    'stock alert level': 'stock_threshold',
    
    // tax_rate varyasyonları
    'vergi oranı': 'tax_rate',
    'vergi orani': 'tax_rate',
    'tax rate': 'tax_rate',
    'kdv': 'tax_rate',
    'kdv oranı': 'tax_rate',
    'kdv orani': 'tax_rate',
    'vat': 'tax_rate',
    'vat rate': 'tax_rate',
    'kdv %': 'tax_rate',
    'vat %': 'tax_rate',
    'vergi %': 'tax_rate',
    'tax %': 'tax_rate',
    'kdv oranı (%)': 'tax_rate',
    'kdv orani (%)': 'tax_rate',
    'vergi yüzdesi': 'tax_rate',
    'vergi yuzdesi': 'tax_rate',
    'tax percentage': 'tax_rate',
    
    // unit varyasyonları
    'birim': 'unit',
    'unit': 'unit',
    'ölçü birimi': 'unit',
    'olcu birimi': 'unit',
    'measurement unit': 'unit',
    'unit of measure': 'unit',
    'uom': 'unit',
    'birim tipi': 'unit',
    'unit type': 'unit',
    'piece': 'unit',
    'kg': 'unit',
    'kilogram': 'unit',
    'gram': 'unit',
    'g': 'unit',
    'litre': 'unit',
    'lt': 'unit',
    'l': 'unit',
    'metre': 'unit',
    'm': 'unit',
    'cm': 'unit',
    'paket': 'unit',
    'kutu': 'unit',
    'koli': 'unit',
    
    // currency varyasyonları
    'para birimi': 'currency',
    'currency': 'currency',
    'döviz': 'currency',
    'doviz': 'currency',
    'para': 'currency',
    'money': 'currency',
    'tl': 'currency',
    'try': 'currency',
    'usd': 'currency',
    'eur': 'currency',
    'gbp': 'currency',
    'türk lirası': 'currency',
    'turk lirasi': 'currency',
    'dollar': 'currency',
    'euro': 'currency',
    'pound': 'currency',
    
    // category_type varyasyonları
    'kategori tipi': 'category_type',
    'category type': 'category_type',
    'kategori': 'category_type',
    'category': 'category_type',
    'kategori adı': 'category_type',
    'kategori adi': 'category_type',
    'category name': 'category_type',
    'ürün kategorisi': 'category_type',
    'urun kategorisi': 'category_type',
    'product category': 'category_type',
    
    // product_type varyasyonları
    'ürün tipi': 'product_type',
    'urun tipi': 'product_type',
    'product type': 'product_type',
    'tip': 'product_type',
    'type': 'product_type',
    'ürün türü': 'product_type',
    'urun turu': 'product_type',
    'product kind': 'product_type',
    'fiziksel': 'product_type',
    'physical': 'product_type',
    'hizmet': 'product_type',
    'service': 'product_type',
    'mal': 'product_type',
    'item type': 'product_type',
    
    // status varyasyonları
    'durum': 'status',
    'status': 'status',
    'statu': 'status',
    'state': 'status',
    'aktif durum': 'status',
    'active status': 'status',
    'ürün durumu': 'status',
    'urun durumu': 'status',
    'product status': 'status',
    
    // is_active varyasyonları
    'aktif': 'is_active',
    'is active': 'is_active',
    'aktif mi': 'is_active',
    'active': 'is_active',
    'enabled': 'is_active',
    'aktif/pasif': 'is_active',
    'active/inactive': 'is_active',
    'durum (aktif)': 'is_active',
    'status (active)': 'is_active',
    'yayında': 'is_active',
    'yayinda': 'is_active',
    'published': 'is_active',
    'yayın durumu': 'is_active',
    'yayin durumu': 'is_active'
  };

  const mappings: ColumnMapping[] = [];
  const unmappedColumns: string[] = [];

  // Normalize fonksiyonu - Türkçe karakterleri ve boşlukları normalize eder
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
      .replace(/[ıİ]/g, 'i')
      .replace(/[şŞ]/g, 's')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/[()]/g, '') // Parantezleri kaldır
      .replace(/[%]/g, '') // Yüzde işaretini kaldır
      .replace(/[_-]/g, ' '); // Alt çizgi ve tire'yi boşluğa çevir
  };

  excelColumns.forEach(col => {
    const originalCol = col?.toString().trim() || '';
    if (!originalCol) return;

    // Önce tam eşleşme dene
    const normalized = normalize(originalCol);
    let systemField = headerMap[normalized];

    // Tam eşleşme yoksa, kısmi eşleşme dene
    if (!systemField) {
      let bestMatch: { key: string; value: string; length: number } | null = null;
      
      // Her bir mapping key'ini kontrol et
      for (const [key, value] of Object.entries(headerMap)) {
        const normalizedKey = normalize(key);
        
        // Kolon ismi key'i içeriyorsa veya key kolon ismini içeriyorsa
        if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
          // Öncelik kontrolü - daha uzun eşleşmeleri tercih et
          if (!bestMatch || key.length > bestMatch.length) {
            bestMatch = { key, value, length: key.length };
          }
        }
      }
      
      if (bestMatch) {
        systemField = bestMatch.value;
      }
    }

    if (systemField) {
      mappings.push({
        excelColumn: originalCol,
        systemField,
        confidence: 90,
        description: `"${originalCol}" → ${systemField}`
      });
    } else {
      unmappedColumns.push(originalCol);
    }
  });

  return {
    mappings,
    unmappedColumns,
    confidence: mappings.length > 0 ? 85 : 0
  };
};

