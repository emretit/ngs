import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeminiRequest {
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
  companyId?: string;
  context?: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  };
}

// Database schema for SQL generation
const getDatabaseSchema = (companyId?: string) => `
TABLOLAR VE İLİŞKİLER:

ÖNEMLİ: Tüm tablolarda company_id kolonu vardır ve her sorguda MUTLAKA company_id filtresi kullanılmalıdır.
Sadece kullanıcının kendi şirketinin verilerine erişilmelidir.

1. proposals (Teklifler)
   - id, company_id, customer_id, status, total_amount, currency, created_at, valid_until
   - status: 'draft', 'sent', 'accepted', 'rejected', 'expired'

2. proposal_items (Teklif Kalemleri)
   - id, proposal_id, product_id, product_name, quantity, unit_price, total_price

3. customers (Müşteriler)
   - id, company_id, name, email, phone, address, city, balance, type, status, created_at

4. products (Ürünler)
   - id, company_id, name, code, price, quantity (stok), category_id, unit, created_at

5. orders (Siparişler)
   - id, company_id, customer_id, status, total_amount, created_at

6. sales_invoices (Satış Faturaları)
   - id, company_id, customer_id, total_amount, status, invoice_date, due_date

7. purchase_invoices (Alış Faturaları)
   - id, company_id, supplier_id, total_amount, status, invoice_date

8. suppliers (Tedarikçiler)
   - id, company_id, name, email, phone, balance, created_at

9. service_requests (Servis Talepleri)
   - id, company_id, customer_id, service_status, priority, created_at, completed_at, assigned_to

10. employees (Çalışanlar)
    - id, company_id, first_name, last_name, email, department_id, is_active, hire_date

11. vehicles (Araçlar)
    - id, company_id, plate_number, brand, model, year, status

12. vehicle_fuel (Yakıt Kayıtları)
    - id, vehicle_id, fuel_date, liters, total_cost, odometer

13. opportunities (Satış Fırsatları)
    - id, company_id, customer_id, value, status, stage, probability, expected_close_date

14. activities (Aktiviteler/Görevler)
    - id, company_id, title, type, status, due_date, assignee_id

15. bank_accounts (Banka Hesapları)
    - id, company_id, account_name, account_number, bank_name, balance

16. service_slips (Servis Fişleri)
    - id, company_id, customer_id, vehicle_id, service_date, total_amount

17. tasks (Görevler)
    - id, company_id, title, description, status, due_date, assignee_id

${companyId ? `\nŞİRKET FİLTRESİ: Tüm sorgularda WHERE company_id = '${companyId}' kullanılmalıdır.` : '\nŞİRKET FİLTRESİ: Tüm sorgularda WHERE company_id filtresi kullanılmalıdır.'}
`;

// Available Gemini models - using Gemini 2.0 experimental models
const GEMINI_MODELS: Record<string, string> = {
  'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
  'gemini-exp-1206': 'gemini-exp-1206',
  'gemini-2.0-flash-thinking-exp': 'gemini-2.0-flash-thinking-exp',
  // Fallback for old model names
  'gemini-1.5-flash': 'gemini-2.0-flash-exp',
  'gemini-1.5-pro': 'gemini-exp-1206',
  'gemini-1.5-flash-8b': 'gemini-2.0-flash-exp',
  'gemini-2.5-flash': 'gemini-2.0-flash-exp',
  'gemini-2.5-pro': 'gemini-exp-1206',
  'gemini-2.5-flash-lite': 'gemini-2.0-flash-exp',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Gemini-chat function called:', req.method, req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  
  try {
    const body: GeminiRequest = await req.json();
    console.log('Request body type:', body.type);
    const { type, model = 'gemini-2.0-flash-exp', stream = false } = body;

    // Status check - no JWT required
    if (type === 'status') {
      return new Response(JSON.stringify({ 
        configured: !!GOOGLE_GEMINI_API_KEY,
        message: GOOGLE_GEMINI_API_KEY ? 'Google Gemini API yapılandırıldı' : 'GOOGLE_GEMINI_API_KEY ayarlanmadı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // JWT verification for all other endpoints
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Supabase configuration missing' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid authorization header' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid user token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'GOOGLE_GEMINI_API_KEY is not configured',
        configured: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get actual model name
    const actualModel = GEMINI_MODELS[model] || GEMINI_MODELS['gemini-2.0-flash-exp'];

    let systemInstruction = '';
    let userContent = '';

    switch (type) {
      case 'chat':
        // Extract system message and combine user/assistant messages
        const systemMsg = body.messages?.find(m => m.role === 'system');
        systemInstruction = `Sen PAFTA İş Yönetim Sistemi için geliştirilmiş yardımcı bir AI Agent'sın. Türkçe yanıt veriyorsun.

PAFTA HAKKINDABİLGİLER:
PAFTA, Türk şirketleri için tasarlanmış kapsamlı bir bulut tabanlı ERP ve iş yönetim sistemidir (https://pafta.app).

ANA MODÜLLER VE ÖZELLİKLER:

1. MÜŞTERİ YÖNETİMİ (CRM)
   - Müşteri ve tedarikçi kayıtları (Bireysel/Kurumsal)
   - e-Fatura mükellef kontrolü
   - Satış fırsatları (opportunities) ve pipeline yönetimi
   - Müşteri segmentasyonu ve bakiye takibi
   - Dosyalar: pages/Contacts.tsx, pages/CustomerNew.tsx
   - Tablolar: customers, suppliers, opportunities

2. ÜRÜN & STOK YÖNETİMİ
   - Ürün kataloğu (SKU, barkod, fiyat, stok)
   - Çoklu depo sistemi (warehouses, warehouse_items)
   - Stok hareketleri (Giriş/Çıkış/Transfer/Sayım)
   - Envanter sayımı ve minimum stok seviyeleri
   - Üretim reçeteleri (BOM) ve iş emirleri
   - Dosyalar: pages/Products.tsx, pages/inventory/
   - Tablolar: products, warehouses, inventory_transactions

3. SATIŞ & FATURALAMA
   - Satış faturaları oluşturma ve yönetimi
   - e-Fatura entegrasyonu (Veriban & e-Logo)
   - UBL/XML format desteği
   - Fatura durumu takibi (ödendi/bekliyor vb.)
   - Dosyalar: pages/SalesInvoices.tsx, pages/EInvoiceProcess.tsx
   - Tablolar: sales_invoices, sales_invoice_items
   - Servisler: veribanService.ts, elogoService.ts

4. TEKLİF & SİPARİŞ YÖNETİMİ
   - Teklif oluşturma ve versiyonlama
   - Siparişe dönüştürme
   - Ödeme ve teslimat koşulları
   - PDF şablonları
   - Dosyalar: pages/NewProposalCreate.tsx, pages/Proposals.tsx
   - Tablolar: proposals, proposal_items, orders, order_items

5. SATIN ALMA YÖNETİMİ
   - Satın alma talepleri (purchase requests)
   - Sipariş oluşturma ve onay iş akışları
   - Mal kabul (GRN)
   - Alış faturaları
   - Dosyalar: pages/purchasing/, pages/PurchaseInvoices.tsx
   - Tablolar: purchase_requests, purchase_orders, purchase_invoices, approvals

6. SERVİS YÖNETİMİ
   - Servis talebi takibi
   - Teknisyen ataması ve SLA yönetimi
   - Servis fişleri ve kullanılan parçalar
   - Harita ve takvim görünümleri
   - Dosyalar: pages/service/, pages/Service.tsx
   - Tablolar: service_requests, service_slips, service_parts_inventory

7. NAKİT AKIŞI & FİNANS
   - Banka, kasa, kredi kartı hesapları
   - Çek ve senet yönetimi
   - Alacak/Borç takibi (partner_accounts)
   - Bütçe yönetimi ve onay süreçleri
   - Dosyalar: pages/Cashflow*.tsx, pages/budget/
   - Tablolar: bank_accounts, checks, notes, budget_*

8. ÇALIŞAN YÖNETİMİ
   - Personel kayıt ve maaş yönetimi
   - İzin takibi ve departman atamaları
   - SGK hesaplamaları
   - Dosyalar: pages/Employees.tsx
   - Tablolar: employees, employee_leaves

TEKNOLOJİ STACK:
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Edge Functions)
- UI: shadcn/ui, Radix UI
- State: TanStack React Query
- AI: Google Gemini (sen!)
- Entegrasyonlar: Veriban, e-Logo, LocationIQ, TCMB EVDS

VERİTABANI:
- Multi-tenant mimari (her şirket company_id ile izole)
- Row Level Security (RLS) ile veri güvenliği
- PostgreSQL tablolar: customers, products, warehouses, invoices, orders, proposals, employees, vb.
- Tüm sorgular company_id filtresi gerektirir

SEN NE YAPABİLİRSİN:
1. Kullanıcı sorularını yanıtla (sistem nasıl çalışır, hangi sayfada ne var)
2. Veri analizi yap (SQL sorgusu oluştur ve verileri analiz et)
3. İş içgörüleri sun (satış trendleri, stok durumu, finansal özet)
4. Yardımcı ol (nasıl teklif oluşturulur, fatura gönderilir vb.)
5. Navigasyon yönlendir (hangi sayfaya gitmeli)

KURALLAR:
- Türkçe konuş, profesyonel ama samimi ol
- Kısa ve net cevaplar ver
- Gerekirse dosya/tablo adlarını belirt (örn: "pages/Customers.tsx'te bulabilirsiniz")
- Bilmediğin bir şey varsa itiraf et
- SQL sorgusu oluştururken MUTLAKA company_id filtresi ekle
- Güvenlik: Sadece SELECT sorguları, INSERT/UPDATE/DELETE yasak

${systemMsg?.content || ''}`;
        userContent = body.messages
          ?.filter(m => m.role !== 'system')
          ?.map(m => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`)
          ?.join('\n\n') || '';
        break;

      case 'report':
        const contextInfo = body.context ? 
          `\nFİLTRELER:\n- Başlangıç: ${body.context.startDate || 'Belirtilmedi'}\n- Bitiş: ${body.context.endDate || 'Belirtilmedi'}\n- Para Birimi: ${body.context.currency || 'TRY'}` : '';
        
        systemInstruction = `Sen bir iş analizi ve raporlama uzmanısın. Kullanıcının Türkçe sorularını analiz edip:
1. Uygun PostgreSQL SELECT sorgusu oluştur
2. Sonuçların nasıl görselleştirileceğini öner
3. Kısa bir açıklama yaz

${getDatabaseSchema(body.companyId)}

KURALLAR:
- SADECE SELECT sorguları oluştur, veri değiştiren sorgular YASAK
- Tarih filtrelerini WHERE clause'a ekle
- Aggregate fonksiyonları (SUM, COUNT, AVG) kullan
- Anlamlı alias'lar kullan
- MUTLAKA WHERE clause'a company_id filtresi ekle (WHERE company_id = '${body.companyId || 'current_company_id()'}' veya WHERE company_id = current_company_id())
- Eğer zaten WHERE clause varsa, company_id filtresini AND ile ekle

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
}`;
        userContent = `${body.query}${contextInfo}`;
        break;

      case 'sql':
        systemInstruction = `Sen bir SQL uzmanısın. Kullanıcının doğal dil sorgularını PostgreSQL SELECT sorgularına çeviriyorsun.

${getDatabaseSchema(body.companyId)}
            
KURALLAR:
- SADECE SELECT sorguları oluştur
- INSERT, UPDATE, DELETE, DROP, ALTER, CREATE gibi değiştirici ifadeler YASAK
- Sorguyu düz metin olarak döndür, markdown formatı kullanma
- Sadece SQL sorgusunu döndür, açıklama ekleme
- Tablo ve sütun adlarını doğru kullan
- MUTLAKA WHERE clause'a company_id filtresi ekle (WHERE company_id = '${body.companyId || 'current_company_id()'}' veya WHERE company_id = current_company_id())
- Eğer zaten WHERE clause varsa, company_id filtresini AND ile ekle`;
        userContent = body.query || '';
        break;

      case 'analyze':
        const sampleData = JSON.stringify(body.data?.slice(0, 10), null, 2);
        const summaryText = JSON.stringify(body.summary, null, 2);
        
        systemInstruction = `Sen bir veri analiz uzmanısın. Verileri analiz edip Türkçe olarak içgörüler sunuyorsun.
Kısa, öz ve aksiyon odaklı analizler yap.`;
        userContent = `Aşağıdaki verileri analiz et:

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
}`;
        break;

      case 'map-columns':
        systemInstruction = `Sen bir veri eşleştirme uzmanısın. Excel/CSV kolon isimlerini veritabanı alanlarıyla eşleştiriyorsun.
            
Yanıtını JSON formatında ver:
{
  "mappings": [
    { "source": "kaynak_kolon", "target": "hedef_alan", "confidence": 0.95 }
  ]
}`;
        userContent = `Kaynak kolonlar: ${JSON.stringify(body.sourceColumns)}
Hedef alanlar: ${JSON.stringify(body.targetFields)}

Bu kolonları en uygun hedef alanlarla eşleştir.`;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`Gemini API call - Type: ${type}, Model: ${actualModel}, Stream: ${stream}`);

    // Prepare request body for Gemini
    const geminiBody: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userContent }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: type === 'sql' ? 0.1 : 0.7,
        maxOutputTokens: type === 'sql' ? 500 : 2000,
      }
    };

    // Add JSON response format for structured responses
    if (type === 'analyze' || type === 'map-columns' || type === 'report') {
      geminiBody.generationConfig.responseMimeType = 'application/json';
    }

    // Handle streaming for chat
    if (stream && type === 'chat') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:streamGenerateContent?key=${GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API streaming error:', response.status, errorText);
        return new Response(JSON.stringify({ error: `Gemini API error: ${response.status}` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Transform Gemini streaming format to SSE format
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          try {
            // Gemini returns JSON array chunks
            const lines = text.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('[') || line.startsWith(',')) {
                const cleanLine = line.replace(/^\[|^\,/, '').trim();
                if (cleanLine && cleanLine !== ']') {
                  try {
                    const parsed = JSON.parse(cleanLine.replace(/\]$/, ''));
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                        choices: [{ delta: { content } }]
                      })}\n\n`));
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } catch (e) {
            console.error('Stream transform error:', e);
          }
        }
      });

      const transformedStream = response.body?.pipeThrough(transformStream);

      return new Response(transformedStream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Gemini API error: ${response.status}`,
        details: errorText 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
