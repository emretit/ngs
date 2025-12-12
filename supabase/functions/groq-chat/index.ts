import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  type: 'chat' | 'sql' | 'analyze' | 'map-columns' | 'status' | 'report';
  messages?: ChatMessage[];
  query?: string;
  data?: any;
  model?: string;
  tableName?: string;
  summary?: Record<string, any>;
  sourceColumns?: string[];
  targetFields?: Array<{ name: string; description: string }>;
  stream?: boolean;
  context?: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  };
}

// Database schema for SQL generation
const DATABASE_SCHEMA = `
TABLOLAR VE İLİŞKİLER:

1. proposals (Teklifler)
   - id, customer_id, status, total_amount, currency, created_at, valid_until
   - status: 'draft', 'sent', 'accepted', 'rejected', 'expired'

2. proposal_items (Teklif Kalemleri)
   - id, proposal_id, product_id, product_name, quantity, unit_price, total_price

3. customers (Müşteriler)
   - id, name, email, phone, address, city, balance, type, status, created_at

4. products (Ürünler)
   - id, name, code, price, quantity (stok), category_id, unit, created_at

5. orders (Siparişler)
   - id, customer_id, status, total_amount, created_at

6. sales_invoices (Satış Faturaları)
   - id, customer_id, total_amount, status, invoice_date, due_date

7. einvoices (Alış Faturaları)
   - id, supplier_id, total_amount, status, invoice_date

8. suppliers (Tedarikçiler)
   - id, name, email, phone, balance, created_at

9. service_requests (Servis Talepleri)
   - id, customer_id, service_status, priority, created_at, completed_at, assigned_to

10. employees (Çalışanlar)
    - id, first_name, last_name, email, department_id, is_active, hire_date

11. vehicles (Araçlar)
    - id, plate_number, brand, model, year, status

12. vehicle_fuel (Yakıt Kayıtları)
    - id, vehicle_id, fuel_date, liters, total_cost, odometer

13. opportunities (Satış Fırsatları)
    - id, customer_id, value, status, stage, probability, expected_close_date

14. activities (Aktiviteler/Görevler)
    - id, title, type, status, due_date, assignee_id
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  
  try {
    const body: GroqRequest = await req.json();
    const { type, model = 'llama-3.3-70b-versatile', stream = false } = body;

    // Status check
    if (type === 'status') {
      return new Response(JSON.stringify({ 
        configured: !!GROQ_API_KEY,
        message: GROQ_API_KEY ? 'Groq API yapılandırıldı' : 'GROQ_API_KEY ayarlanmadı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'GROQ_API_KEY is not configured',
        configured: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let messages: ChatMessage[] = [];

    switch (type) {
      case 'chat':
        messages = body.messages || [];
        break;

      case 'report':
        // Enhanced report query with full schema context
        const contextInfo = body.context ? 
          `\nFİLTRELER:\n- Başlangıç: ${body.context.startDate || 'Belirtilmedi'}\n- Bitiş: ${body.context.endDate || 'Belirtilmedi'}\n- Para Birimi: ${body.context.currency || 'TRY'}` : '';
        
        messages = [
          {
            role: 'system',
            content: `Sen bir iş analizi ve raporlama uzmanısın. Kullanıcının Türkçe sorularını analiz edip:
1. Uygun PostgreSQL SELECT sorgusu oluştur
2. Sonuçların nasıl görselleştirileceğini öner
3. Kısa bir açıklama yaz

${DATABASE_SCHEMA}

KURALLAR:
- SADECE SELECT sorguları oluştur, veri değiştiren sorgular YASAK
- Tarih filtrelerini WHERE clause'a ekle
- Aggregate fonksiyonları (SUM, COUNT, AVG) kullan
- Anlamlı alias'lar kullan

YANIT FORMATI (JSON):
{
  "sql": "SELECT sorgusu",
  "explanation": "Türkçe kısa açıklama",
  "chartType": "table|bar|line|pie|area",
  "chartConfig": {
    "xKey": "x ekseni alan adı",
    "yKey": "y ekseni alan adı",
    "title": "Grafik başlığı"
  }
}`
          },
          {
            role: 'user',
            content: `${body.query}${contextInfo}`
          }
        ];
        break;

      case 'sql':
        messages = [
          {
            role: 'system',
            content: `Sen bir SQL uzmanısın. Kullanıcının doğal dil sorgularını PostgreSQL SELECT sorgularına çeviriyorsun.

${DATABASE_SCHEMA}
            
KURALLAR:
- SADECE SELECT sorguları oluştur
- INSERT, UPDATE, DELETE, DROP, ALTER, CREATE gibi değiştirici ifadeler YASAK
- Sorguyu düz metin olarak döndür, markdown formatı kullanma
- Sadece SQL sorgusunu döndür, açıklama ekleme
- Tablo ve sütun adlarını doğru kullan`
          },
          {
            role: 'user',
            content: body.query || ''
          }
        ];
        break;

      case 'analyze':
        const sampleData = JSON.stringify(body.data?.slice(0, 10), null, 2);
        const summaryText = JSON.stringify(body.summary, null, 2);
        
        messages = [
          {
            role: 'system',
            content: `Sen bir veri analiz uzmanısın. Verileri analiz edip Türkçe olarak içgörüler sunuyorsun.
Kısa, öz ve aksiyon odaklı analizler yap.`
          },
          {
            role: 'user',
            content: `Aşağıdaki verileri analiz et:

TABLO: ${body.tableName}
KAYIT SAYISI: ${body.data?.length || 0}

VERİ ÖZETİ:
${summaryText}

ÖRNEK VERİLER:
${sampleData}

JSON formatında yanıt ver:
{
  "summary": "2-3 cümlelik özet",
  "insights": ["önemli bulgu 1", "bulgu 2", "bulgu 3"],
  "recommendations": ["öneri 1", "öneri 2"],
  "alerts": ["dikkat edilmesi gereken durum"]
}`
          }
        ];
        break;

      case 'map-columns':
        messages = [
          {
            role: 'system',
            content: `Sen bir veri eşleştirme uzmanısın. Excel/CSV kolon isimlerini veritabanı alanlarıyla eşleştiriyorsun.
            
Yanıtını JSON formatında ver:
{
  "mappings": [
    { "source": "kaynak_kolon", "target": "hedef_alan", "confidence": 0.95 }
  ]
}`
          },
          {
            role: 'user',
            content: `Kaynak kolonlar: ${JSON.stringify(body.sourceColumns)}
Hedef alanlar: ${JSON.stringify(body.targetFields)}

Bu kolonları en uygun hedef alanlarla eşleştir.`
          }
        ];
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`Groq API call - Type: ${type}, Model: ${model}, Stream: ${stream}`);

    // Handle streaming for chat
    if (stream && type === 'chat') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API streaming error:', response.status, errorText);
        return new Response(JSON.stringify({ error: `Groq API error: ${response.status}` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming request
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: type === 'sql' ? 0.1 : 0.7,
        max_tokens: type === 'sql' ? 500 : 2000,
        response_format: (type === 'analyze' || type === 'map-columns' || type === 'report') 
          ? { type: 'json_object' } 
          : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Groq API error: ${response.status}`,
        details: errorText 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result: any = { content };

    if (type === 'sql') {
      let sql = content.trim();
      sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
      
      const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
      if (forbidden.test(sql)) {
        return new Response(JSON.stringify({ 
          error: 'Güvenlik: Sadece SELECT sorguları desteklenir' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      result = { sql, raw: content };
    } else if (type === 'analyze' || type === 'map-columns' || type === 'report') {
      try {
        result = JSON.parse(content);
      } catch {
        result = { content, parseError: true };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in groq-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
