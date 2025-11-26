import Groq from 'groq-sdk';

// Groq API Key - .env dosyasında olmalı: VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  // Groq API key not configured - AI reporting features will be disabled
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

ÖNEMLİ KURALLAR:
1. Sadece yukarıdaki tablolardan SQL üret
2. PostgreSQL syntax kullan
3. Tarih işlemleri için DATE_TRUNC, CURRENT_DATE kullan
4. Para birimi için Türk Lirası (₺) formatı
5. Güvenlik için sadece SELECT sorguları oluştur
6. JSON formatında yanıt ver

SORGU TİPLERİNİ AYIRT ET:

A) SAYISAL SORGULAR (COUNT, SUM, AVG):
   - "kaç", "adet", "sayı", "toplam", "miktar", "ne kadar" kelimeleri varsa
   - SADECE SAYI DÖNDÜR, liste getirme!
   - COUNT(*) veya SUM() kullan
   - Örnek: "kaç ürün var" → SELECT COUNT(*) FROM products
   - Örnek: "toplam satış" → SELECT SUM(total_amount) FROM proposals

B) LİSTE SORGULARI (SELECT *):
   - "listele", "göster", "sırala", "hangi" kelimeleri varsa
   - Tüm kayıtları getir
   - Örnek: "tüm ürünleri göster" → SELECT * FROM products

C) AGGREGATE SORGULAR (GROUP BY):
   - "bazında", "göre", "grupla" kelimeleri varsa
   - GROUP BY kullan
   - Örnek: "müşteri bazında gelir" → SELECT customer_id, SUM(total_amount) FROM proposals GROUP BY customer_id

ÇIKTI FORMATI:
{
  "sql": "SQL sorgusu",
  "explanation": "Sorgunun Türkçe açıklaması",
  "chartType": "table|bar|line|pie",
  "error": null
}

ÖRNEK SORGULAR VE ÇÖZÜMLERİ:

1. SAYISAL SORGULAR (SADECE SAYI DÖNDÜR):
   - "Kaç ürün var?" → SELECT COUNT(*) as toplam_urun FROM products
   - "Toplam kaç müşteri var?" → SELECT COUNT(*) as toplam_musteri FROM customers
   - "Bu ay kaç teklif yapıldı?" → SELECT COUNT(*) as toplam_teklif FROM proposals WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
   - "Toplam satış tutarı nedir?" → SELECT SUM(total_amount) as toplam_satis FROM proposals WHERE status = 'accepted'
   - "Ortalama maaş ne kadar?" → SELECT AVG(salary) as ortalama_maas FROM employees

2. LİSTE SORGULARI (TÜM KAYITLARI GETİR):
   - "Tüm ürünleri göster" → SELECT * FROM products ORDER BY created_at DESC LIMIT 100
   - "Müşterileri listele" → SELECT * FROM customers ORDER BY name LIMIT 100
   - "En çok satan ürünler" → SELECT * FROM products ORDER BY stock_quantity DESC LIMIT 10

3. AGGREGATE SORGULAR (GRUPLAMA):
   - "Müşteri bazında gelir" → SELECT c.name, SUM(p.total_amount) as gelir FROM customers c JOIN proposals p ON c.id = p.customer_id GROUP BY c.id, c.name
   - "Departman bazında çalışan sayısı" → SELECT department, COUNT(*) as calisan_sayisi FROM employees GROUP BY department

KRİTİK: Eğer kullanıcı "kaç", "adet", "sayı", "toplam" gibi kelimeler kullanıyorsa, MUTLAKA COUNT(*) veya SUM() kullan ve sadece sayı döndür. Tüm kayıtları getirme!`;
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
    // Sorgu tipini analiz et
    const lowerQuery = userQuery.toLowerCase();
    const isCountQuery = /kaç|adet|sayı|toplam|miktar|ne kadar|kaç tane|kaç adet/.test(lowerQuery);
    const isListQuery = /listele|göster|sırala|hangi|tüm|hepsi|bütün/.test(lowerQuery);
    
    // User prompt'unu sorgu tipine göre özelleştir
    let userPrompt = `Türkçe sorgu: "${userQuery}"`;
    
    if (isCountQuery) {
      userPrompt += `\n\nÖNEMLİ: Bu bir SAYISAL sorgu. Sadece COUNT(*) veya SUM() kullan ve sadece sayı döndür. Tüm kayıtları getirme!`;
    } else if (isListQuery) {
      userPrompt += `\n\nÖNEMLİ: Bu bir LİSTE sorgusu. SELECT * kullan ve tüm kayıtları getir.`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: createSystemPrompt()
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Güncel büyük model - daha iyi anlama
      temperature: 0.2, // Tutarlı ama anlayışlı
      max_tokens: 1500,
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
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
      temperature: 0.2
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

    // COUNT(*) veya COUNT(column) sorgularını özel olarak işle
    const isCountQuery = /count\s*\(\s*\*|count\s*\(/i.test(sql);
    const isSumQuery = /sum\s*\(/i.test(sql);
    const isAvgQuery = /avg\s*\(/i.test(sql);
    const isAggregateQuery = isCountQuery || isSumQuery || isAvgQuery;

    if (isAggregateQuery) {
      // Aggregate sorgular için özel işleme
      const tableMatch = sql.match(/from\s+(\w+)(?:\s+\w+)?/i);
      if (!tableMatch) {
        throw new Error('Tablo adı bulunamadı');
      }

      const tableName = tableMatch[1].toLowerCase();
      console.log('Aggregate query detected for table:', tableName);

      // İzin verilen tablolar
      const allowedTables = [
        'proposals', 'customers', 'products', 'employees',
        'opportunities', 'service_requests', 'bank_accounts',
        'tasks', 'service_slips'
      ];

      if (!allowedTables.includes(tableName)) {
        throw new Error(`Tablo '${tableName}' erişime kapalı`);
      }

      // WHERE koşullarını parse et
      let query = supabase.from(tableName).select('*', { count: 'exact', head: false });
      
      const whereMatch = sql.match(/where\s+(.+?)(?:\s+group|\s+order|\s+limit|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        
        // Basit eşitlik kontrolü
        const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
        if (eqMatch) {
          query = query.eq(eqMatch[1], eqMatch[2]);
        }
        
        // DATE_TRUNC kontrolü (basit)
        const dateMatch = whereClause.match(/date_trunc\s*\(\s*'month'\s*,\s*(\w+)\s*\)\s*=\s*date_trunc\s*\(\s*'month'\s*,\s*current_date\s*\)/i);
        if (dateMatch) {
          const dateColumn = dateMatch[1];
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          query = query.gte(dateColumn, startOfMonth.toISOString())
                      .lte(dateColumn, endOfMonth.toISOString());
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('SQL execution error:', error);
        throw new Error(`SQL Error: ${error.message}`);
      }

      // COUNT(*) için sadece sayı döndür
      if (isCountQuery) {
        return [{ count: count || (data ? data.length : 0) }];
      }

      // SUM veya AVG için manuel hesaplama (basit)
      if (isSumQuery || isAvgQuery) {
        const columnMatch = sql.match(/(?:sum|avg)\s*\(\s*(\w+)\s*\)/i);
        if (columnMatch && data) {
          const column = columnMatch[1];
          const values = data.map((row: any) => parseFloat(row[column]) || 0).filter((v: number) => !isNaN(v));
          if (isSumQuery) {
            return [{ sum: values.reduce((a: number, b: number) => a + b, 0) }];
          } else {
            return [{ avg: values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0 }];
          }
        }
      }

      return data || [];
    }

    // Normal SELECT sorguları için mevcut mantık
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

    // ORDER BY kontrolü
    const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const orderColumn = orderMatch[1];
      const orderDirection = (orderMatch[2] || 'asc').toLowerCase() as 'asc' | 'desc';
      query = query.order(orderColumn, { ascending: orderDirection === 'asc' });
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