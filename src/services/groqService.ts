import Groq from 'groq-sdk';

// Groq API Key - .env dosyasında olmalı: VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn('Groq API key not found. Set VITE_GROQ_API_KEY in your .env file');
}

let groq: Groq | null = null;

if (GROQ_API_KEY) {
  groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Client-side kullanım için
  });
}

export interface SQLGenerationResult {
  sql: string;
  explanation: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie';
  error?: string;
}

export interface DatabaseSchema {
  tables: {
    [tableName: string]: {
      columns: string[];
      description: string;
    };
  };
}

// Supabase schema - gerçek tablolarınıza göre güncellendi
const DATABASE_SCHEMA: DatabaseSchema = {
  tables: {
    proposals: {
      columns: ['id', 'customer_id', 'total_amount', 'status', 'created_at', 'updated_at', 'title', 'due_date', 'currency', 'tax_rate'],
      description: 'Teklifler tablosu - müşteri teklifleri ve onay durumları'
    },
    customers: {
      columns: ['id', 'name', 'email', 'phone', 'company', 'created_at', 'address', 'city', 'tax_number', 'type'],
      description: 'Müşteriler tablosu - müşteri bilgileri'
    },
    products: {
      columns: ['id', 'name', 'price', 'stock_quantity', 'category', 'created_at', 'description', 'sku', 'unit'],
      description: 'Ürünler tablosu - stok ve fiyat bilgileri'
    },
    employees: {
      columns: ['id', 'first_name', 'last_name', 'email', 'department', 'salary', 'created_at', 'position', 'hire_date', 'status'],
      description: 'Çalışanlar tablosu - personel bilgileri'
    },
    opportunities: {
      columns: ['id', 'customer_id', 'title', 'value', 'status', 'created_at', 'priority', 'expected_close_date', 'description'],
      description: 'Fırsatlar tablosu - satış fırsatları'
    },
    service_requests: {
      columns: ['id', 'customer_id', 'title', 'status', 'created_at', 'priority', 'description', 'employee_id'],
      description: 'Servis talepleri - müşteri hizmet kayıtları'
    },
    bank_accounts: {
      columns: ['id', 'bank_name', 'account_name', 'account_number', 'current_balance', 'created_at', 'currency', 'account_type'],
      description: 'Banka hesapları - mali durum takibi'
    },
    tasks: {
      columns: ['id', 'title', 'description', 'status', 'created_at', 'due_date', 'employee_id', 'priority'],
      description: 'Görevler tablosu - iş takibi'
    },
    service_slips: {
      columns: ['id', 'service_request_id', 'description', 'created_at', 'status', 'technician_notes'],
      description: 'Servis fişleri - detaylı servis kayıtları'
    }
  }
};

const createSystemPrompt = (): string => {
  const schemaText = Object.entries(DATABASE_SCHEMA.tables)
    .map(([tableName, info]) => {
      return `${tableName}: ${info.columns.join(', ')} - ${info.description}`;
    })
    .join('\n');

  return `Sen bir SQL uzmanısın. Türkçe doğal dil sorgularını PostgreSQL sorgularına çeviriyorsun.

VERİTABANI ŞEMASI:
${schemaText}

KURALLAR:
1. Sadece yukarıdaki tablolardan SQL üret
2. PostgreSQL syntax kullan
3. Tarih işlemleri için DATE_TRUNC, CURRENT_DATE kullan
4. Para birimi için Türk Lirası (₺) formatı
5. Eğer sorgu belirsizse, en mantıklı yorumu yap
6. Güvenlik için sadece SELECT sorguları oluştur
7. JSON formatında yanıt ver

ÇIKTI FORMATI:
{
  "sql": "SQL sorgusu",
  "explanation": "Sorgunun Türkçe açıklaması",
  "chartType": "table|bar|line|pie",
  "error": null
}

ÖRNEK SORGULAR:
- "Bu ayın satış toplamı" → proposals tablosundan bu ay kabul edilen teklifler
- "En çok satan ürünler" → products tablosundan en yüksek stock_quantity'li ürünler
- "Müşteri bazında gelir" → customers + proposals join
- "Eylül ayının ilk 10 günü" → proposals veya service_requests tablosunda DATE_TRUNC kullanarak
- "Toplam satış tutarı" → proposals tablosundan total_amount toplamı
- "Çalışan maaş raporu" → employees tablosundan department ve salary bilgileri`;
};

export const generateSQLFromQuery = async (
  userQuery: string
): Promise<SQLGenerationResult> => {
  if (!GROQ_API_KEY || !groq) {
    return {
      sql: '',
      explanation: 'Groq API key bulunamadı. Lütfen VITE_GROQ_API_KEY environment variable\'ını ayarlayın.',
      error: 'API_KEY_MISSING'
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: createSystemPrompt()
        },
        {
          role: 'user',
          content: `Türkçe sorgu: "${userQuery}"`
        }
      ],
      model: 'llama-3.1-8b-instant', // Güncel hızlı model
      temperature: 0.1, // Tutarlı sonuçlar için düşük
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('Groq API\'den yanıt alınamadı');
    }

    const result = JSON.parse(response) as SQLGenerationResult;

    // Güvenlik kontrolü - sadece SELECT'e izin ver
    if (!result.sql.trim().toLowerCase().startsWith('select')) {
      throw new Error('Güvenlik: Sadece SELECT sorguları desteklenir');
    }

    return result;

  } catch (error: any) {
    console.error('Groq API Error:', error);

    return {
      sql: '',
      explanation: `Sorgu işlenirken hata oluştu: ${error.message}`,
      error: error.message,
      chartType: 'table'
    };
  }
};

// Test fonksiyonu - development için
export const testGroqConnection = async (): Promise<boolean> => {
  console.log('Testing Groq connection...');
  console.log('API Key available:', !!GROQ_API_KEY);
  console.log('API Key prefix:', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 8) + '...' : 'none');

  if (!GROQ_API_KEY || !groq) {
    console.error('No Groq API key found or Groq client not initialized');
    return false;
  }

  try {
    console.log('Making test request to Groq...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello, just testing connection'
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 10,
      temperature: 0.1
    });

    console.log('Groq test response:', completion.choices[0]?.message?.content);
    return !!completion.choices[0]?.message?.content;
  } catch (error: any) {
    console.error('Groq connection test failed:', error);
    console.error('Error details:', error.message, error.status);
    return false;
  }
};

// Database execution service - Supabase ile güvenli SQL çalıştırma
export const executeSQLQuery = async (sql: string): Promise<any[]> => {
  const { supabase } = await import('@/integrations/supabase/client');

  console.log('Executing SQL:', sql);

  try {
    // Güvenlik kontrolü - sadece SELECT sorgularına izin ver
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql.startsWith('select')) {
      throw new Error('Güvenlik: Sadece SELECT sorguları desteklenir');
    }

    // SQL'i parse ederek tablo adını al (alias desteği ile)
    const tableMatch = sql.match(/from\s+(\w+)(?:\s+\w+)?/i);
    if (!tableMatch) {
      throw new Error('Tablo adı bulunamadı');
    }

    const tableName = tableMatch[1].toLowerCase();
    console.log('Parsed table name:', tableName);

    // İzin verilen tablolar
    const allowedTables = [
      'proposals', 'customers', 'products', 'employees',
      'opportunities', 'service_requests', 'bank_accounts',
      'tasks', 'service_slips'
    ];

    if (!allowedTables.includes(tableName)) {
      throw new Error(`Tablo '${tableName}' erişime kapalı`);
    }

    // Tablo varlığını test et ve basit SELECT sorguları destekle
    console.log(`Attempting to query table: ${tableName}`);
    let query = supabase.from(tableName).select('*');

    // WHERE koşullarını parse et (basit implementation)
    const whereMatch = sql.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      // Basit eşitlik kontrolü
      const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
      if (eqMatch) {
        query = query.eq(eqMatch[1], eqMatch[2]);
      }
    }

    // LIMIT kontrolü
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    } else {
      query = query.limit(100); // Varsayılan limit
    }

    const { data, error } = await query;

    if (error) {
      console.error('SQL execution error:', error);
      throw new Error(`SQL Error: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Database query failed:', error);

    // Hata durumunda demo data döndür
    return [
      {
        error: true,
        message: `Veritabanı sorgusu başarısız: ${error.message}`,
        demo_data: true,
        sql: sql,
        suggestion: 'Basit SELECT sorgularını deneyin: "SELECT * FROM proposals" gibi'
      }
    ];
  }
};

// Debug: Mevcut tabloları test et
export const testDatabaseTables = async (): Promise<string[]> => {
  const { supabase } = await import('@/integrations/supabase/client');
  const testTables = ['proposals', 'customers', 'employees', 'opportunities', 'products', 'bank_accounts', 'service_requests', 'tasks', 'service_slips'];
  const availableTables: string[] = [];

  for (const table of testTables) {
    try {
      console.log(`Testing table: ${table}`);
      const { data, error } = await supabase.from(table).select('id').limit(1);

      if (!error) {
        availableTables.push(table);
        console.log(`✅ Table ${table} exists`);
      } else {
        console.log(`❌ Table ${table} not found:`, error.message);
      }
    } catch (err) {
      console.log(`❌ Table ${table} error:`, err);
    }
  }

  console.log('Available tables:', availableTables);
  return availableTables;
};