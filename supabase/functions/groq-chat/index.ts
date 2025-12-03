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
  type: 'chat' | 'sql' | 'analyze' | 'map-columns' | 'status';
  messages?: ChatMessage[];
  query?: string;
  data?: any;
  model?: string;
  tableName?: string;
  summary?: Record<string, any>;
  sourceColumns?: string[];
  targetFields?: Array<{ name: string; description: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  
  try {
    const body: GroqRequest = await req.json();
    const { type, model = 'llama-3.3-70b-versatile' } = body;

    // Status check - returns whether API is configured
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

      case 'sql':
        messages = [
          {
            role: 'system',
            content: `Sen bir SQL uzmanısın. Kullanıcının doğal dil sorgularını PostgreSQL SELECT sorgularına çeviriyorsun.
            
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
            content: `Sen bir veri analiz uzmanısın. Supabase veritabanı verilerini analiz edip Türkçe olarak özetliyorsun.
Verileri detaylı analiz edip, önemli bulguları ve önerileri sunuyorsun.`
          },
          {
            role: 'user',
            content: `Aşağıdaki Supabase verilerini analiz et ve Türkçe olarak özetle.

TABLO: ${body.tableName}
TOPLAM KAYIT SAYISI: ${body.data?.length || 0}

VERİ ÖZETİ:
${summaryText}

ÖRNEK VERİLER (ilk 10 kayıt):
${sampleData}

GÖREVİN:
1. Verilerin genel durumunu özetle (2-3 cümle)
2. Önemli bulguları listele (3-5 madde)
3. Öneriler sun (2-3 madde)

Yanıtını JSON formatında ver:
{
  "summary": "Genel özet",
  "insights": ["bulgu1", "bulgu2", ...],
  "recommendations": ["öneri1", "öneri2", ...]
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

    console.log(`Groq API call - Type: ${type}, Model: ${model}`);

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
        max_tokens: type === 'sql' ? 500 : 1000,
        response_format: (type === 'analyze' || type === 'map-columns') ? { type: 'json_object' } : undefined,
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

    // Parse response based on type
    let result: any = { content };

    if (type === 'sql') {
      // Clean SQL query
      let sql = content.trim();
      sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
      
      // Security check
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
    } else if (type === 'analyze' || type === 'map-columns') {
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
