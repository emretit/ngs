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
  if (!GROQ_API_KEY || !groq) {
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

    const systemPrompt = `Sen bir veri eşleştirme uzmanısın. Excel dosyasındaki kolon isimlerini, Müşteri veritabanı alanlarına eşleştiriyorsun.

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
  "unmappedColumns": ["eşleşmeyen kolon 1"],
  "confidence": 85
}

KURALLAR:
- Aynı Excel kolonu birden fazla sistem alanına eşlenemez
- Zorunlu alanlar (name) varsa öncelikli eşleştir
- Confidence 50'den düşükse eşleştirme yapma`;

    const userPrompt = `Excel kolonlarını müşteri alanlarına eşleştir.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('AI\'dan yanıt alınamadı');

    const result = JSON.parse(response) as MappingResult;

    const validatedMappings = result.mappings
      .filter(m => m.confidence >= 50)
      .filter(m => Object.keys(SYSTEM_FIELDS).includes(m.systemField))
      .map(m => ({
        ...m,
        excelColumn: m.excelColumn.trim(),
        systemField: m.systemField.trim()
      }));

    const mappedExcelColumns = new Set(validatedMappings.map(m => m.excelColumn.toLowerCase()));
    const unmappedColumns = excelColumns.filter(
      col => !mappedExcelColumns.has(col.toLowerCase())
    );

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

