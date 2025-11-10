import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Nilvera invoice PDF function started');
    console.log('📋 Request method:', req.method);
    
    const SUPABASE_URL = 'https://vwhwufnckpqirxptwncw.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client created');

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Invalid user token:', userError);
      throw new Error('Invalid user token');
    }

    console.log('👤 User ID:', user.id);

    // Parse request body
    console.log('📨 Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 Raw request body:', requestBody);
    
    const { invoiceId, invoiceType } = requestBody;
    
    console.log('📄 PDF download request:', { invoiceId, invoiceType, requestBody });
    
    if (!invoiceId) {
      console.error('❌ invoiceId is missing');
      throw new Error('invoiceId is required');
    }

    // UUID format kontrolü (basit kontrol)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      console.error('❌ invoiceId is not a valid UUID:', invoiceId);
      throw new Error(`invoiceId geçersiz UUID formatında: ${invoiceId}`);
    }

    if (!invoiceType || !['e-fatura', 'e-arşiv'].includes(invoiceType)) {
      console.error('❌ invoiceType is invalid:', invoiceType);
      throw new Error(`invoiceType must be either "e-fatura" or "e-arşiv", got: ${invoiceType}`);
    }

    console.log('✅ Request validation passed:', { invoiceId, invoiceType });

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    console.log('🏢 Profile query result:', { profile, profileError });

    if (profileError || !profile?.company_id) {
      console.error('❌ User profile or company not found');
      throw new Error('User profile or company not found');
    }

    console.log('🏢 Company ID:', profile.company_id);

    // Get the company's Nilvera authentication data
    const { data: nilveraAuth, error: authError } = await supabase
      .from('nilvera_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    console.log('🔐 Nilvera auth query result:', { 
      hasAuth: !!nilveraAuth, 
      authError, 
      companyId: profile.company_id 
    });

    if (authError || !nilveraAuth) {
      console.error('❌ Nilvera auth bulunamadı:', authError);
      throw new Error('Nilvera kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Nilvera bilgilerinizi girin.');
    }

    // Determine the correct PDF download endpoint based on invoice type
    // Purchase (gelen) faturalar için: /einvoice/Purchase/{UUID}/pdf
    // Sale (giden) faturalar için: /einvoice/Sale/{UUID}/pdf
    const baseUrl = nilveraAuth.test_mode 
      ? 'https://apitest.nilvera.com' 
      : 'https://api.nilvera.com';
    
    let pdfApiUrl;
    if (invoiceType === 'e-fatura') {
      // Purchase (gelen) faturalar için PDF endpoint
      pdfApiUrl = `${baseUrl}/einvoice/Purchase/${invoiceId}/pdf`;
    } else if (invoiceType === 'e-arşiv') {
      // Sale (giden) faturalar için PDF endpoint
      pdfApiUrl = `${baseUrl}/einvoice/Sale/${invoiceId}/pdf`;
    }

    console.log('🌐 PDF API URL:', pdfApiUrl);

    if (!pdfApiUrl) {
      throw new Error('PDF endpoint belirlenemedi');
    }

    // Fetch PDF from Nilvera API
    const pdfResponse = await fetch(pdfApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nilveraAuth.api_key}`,
        'Accept': 'application/json, application/pdf, */*'
      }
    });

    console.log('📡 Nilvera API Response Status:', pdfResponse.status);
    console.log('📡 Nilvera API Response OK:', pdfResponse.ok);
    console.log('📡 Nilvera API Response Status Text:', pdfResponse.statusText);
    console.log('📡 Nilvera API Response Headers:', Object.fromEntries(pdfResponse.headers.entries()));

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ PDF download error from Nilvera API:');
      console.error('❌ Status:', pdfResponse.status);
      console.error('❌ Status Text:', pdfResponse.statusText);
      console.error('❌ URL:', pdfApiUrl);
      console.error('❌ Invoice ID:', invoiceId);
      console.error('❌ Invoice Type:', invoiceType);
      
      // Check if errorText is actually base64 PDF data
      // Base64 encoded "%PDF" starts with "JVBERi0"
      if (errorText && errorText.startsWith('JVBERi0')) {
        console.log('✅ Error response contains base64 PDF data!');
        console.log('✅ PDF base64 length:', errorText.length);
        
        const size = Math.ceil(errorText.length * 3 / 4);
        const responseBody = `{"success":true,"pdfData":"${errorText}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (non-200 response)"}`;
        
        return new Response(responseBody, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      let errorMessage = `PDF indirme başarısız (HTTP ${pdfResponse.status})`;
      if (pdfResponse.status === 404) {
        errorMessage = `Fatura bulunamadı. Invoice ID: ${invoiceId}. Lütfen fatura UUID'sinin doğru olduğundan emin olun.`;
      } else if (pdfResponse.status === 401 || pdfResponse.status === 403) {
        errorMessage = `Nilvera API kimlik doğrulama hatası. Lütfen API anahtarınızı kontrol edin.`;
      } else if (errorText) {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Limit error text length to avoid huge error messages
          const preview = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          errorMessage = `${errorMessage}: ${preview}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Get PDF content based on Content-Type
    const contentType = pdfResponse.headers.get('content-type') || '';
    console.log('✅ Response Content-Type:', contentType);
    
    // CASE 1: application/json - Could be a JSON string with base64 PDF or error object
    if (contentType.includes('application/json')) {
      console.log('📦 Handling application/json response');
      const responseText = await pdfResponse.text();
      console.log('📦 Response text length:', responseText.length);
      console.log('📦 Response text preview (first 100 chars):', responseText.substring(0, 100));
      
      // Try to clean and check if it's a direct base64 string (wrapped in quotes or not)
      const cleaned = responseText.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '');
      
      if (cleaned.startsWith('JVBERi0')) {
        console.log('✅ JSON response contains direct base64 PDF string!');
        console.log('✅ Base64 length:', cleaned.length);
        const size = Math.ceil(cleaned.length * 3 / 4);
        const responseBody = `{"success":true,"pdfData":"${cleaned}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (JSON base64)"}`;
        return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Not a direct base64 string, parse as JSON object
      try {
        const jsonContent = JSON.parse(responseText);
        console.log('📦 Parsed JSON keys:', Object.keys(jsonContent));
        
        // Check all fields for base64 PDF data
        for (const [key, value] of Object.entries(jsonContent)) {
          if (typeof value === 'string' && value.startsWith('JVBERi0') && value.length > 1000) {
            console.log(`✅ Found base64 PDF in field: ${key}`);
            const pdfBase64 = value.replace(/[\r\n\s]/g, '');
            const size = Math.ceil(pdfBase64.length * 3 / 4);
            const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (JSON field: ${key})"}`;
            return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        
        // No PDF data found, treat as error
        console.error('❌ JSON response without PDF data:', jsonContent);
        let errorMessage = 'PDF indirilemedi';
        if (jsonContent.message) {
          errorMessage = jsonContent.message;
        } else if (jsonContent.error && typeof jsonContent.error === 'string') {
          errorMessage = jsonContent.error.substring(0, 200);
        } else if (jsonContent.errors && Array.isArray(jsonContent.errors)) {
          errorMessage = jsonContent.errors[0]?.message || String(jsonContent.errors[0]);
        } else {
          errorMessage = `Nilvera API hatası: ${JSON.stringify(jsonContent).substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        throw new Error(`JSON parse hatası: ${responseText.substring(0, 200)}`);
      }
    }
    
    // CASE 2: text/plain or other non-binary types - Could be base64 string
    if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      console.log('📦 Handling text/plain or other text response');
      const responseText = await pdfResponse.text();
      console.log('📦 Response text length:', responseText.length);
      console.log('📦 Response text preview (first 100 chars):', responseText.substring(0, 100));
      
      // Clean and check for base64 PDF
      const cleaned = responseText.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '').replace(/^\uFEFF/, '');
      
      if (cleaned.startsWith('JVBERi0')) {
        console.log('✅ Text response contains base64 PDF!');
        console.log('✅ Base64 length:', cleaned.length);
        const size = Math.ceil(cleaned.length * 3 / 4);
        const responseBody = `{"success":true,"pdfData":"${cleaned}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (text base64)"}`;
        return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Try parsing as JSON (might be JSON without proper content-type)
      try {
        const jsonContent = JSON.parse(responseText);
        for (const [key, value] of Object.entries(jsonContent)) {
          if (typeof value === 'string' && value.startsWith('JVBERi0') && value.length > 1000) {
            console.log(`✅ Found base64 PDF in JSON field: ${key}`);
            const pdfBase64 = value.replace(/[\r\n\s]/g, '');
            const size = Math.ceil(pdfBase64.length * 3 / 4);
            const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi"}`;
            return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        // JSON error without PDF
        const errorMessage = jsonContent.message || jsonContent.error || 'PDF indirilemedi';
        throw new Error(errorMessage);
      } catch {
        // Not JSON, not base64 - invalid response
        console.error('❌ Invalid response - not PDF, not base64, not valid JSON');
        console.error('❌ Content-Type:', contentType);
        console.error('❌ Response preview:', responseText.substring(0, 500));
        throw new Error(`Geçersiz yanıt tipi. Content-Type: ${contentType}. Beklenen: PDF veya base64 string.`);
      }
    }
    
    // CASE 3: Binary PDF (application/pdf or octet-stream)
    console.log('📦 Handling binary PDF response');
    const pdfBlob = await pdfResponse.blob();
    console.log('✅ PDF blob received, size:', pdfBlob.size, 'bytes');
    console.log('✅ PDF blob type:', pdfBlob.type);

    // PDF'in geçerli olup olmadığını kontrol et
    if (pdfBlob.size === 0) {
      throw new Error('PDF dosyası boş. Nilvera API boş yanıt döndü.');
    }

    // PDF veya base64 kontrolü ve güvenli fallback
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const firstBytes = new Uint8Array(pdfArrayBuffer.slice(0, 8));
    const headerStr = String.fromCharCode(...firstBytes);

    // Yardımcı: gövdeyi metin olarak okuyup base64 PDF olup olmadığını kontrol et
    const tryBase64FromText = () => {
      try {
        const text = new TextDecoder().decode(pdfArrayBuffer);
        const cleaned = text.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '');
        if (cleaned.startsWith('JVBERi0')) {
          console.log('✅ Body contains base64 PDF string. Length:', cleaned.length);
          const size = Math.ceil(cleaned.length * 3 / 4);
          const responseBody = `{"success":true,"pdfData":"${cleaned}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (base64 body)"}`;
          return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
      } catch (e) {
        console.error('❌ Base64 text parse error:', e);
      }
      return null;
    };

    // Eğer base64 ibaresi ile başlıyorsa önce base64 olarak dene
    if (headerStr.startsWith('JVBE') || headerStr.startsWith('"JVBE') || headerStr.startsWith("'JVBE")) {
      const base64Resp = tryBase64FromText();
      if (base64Resp) return base64Resp;
    }

    // PDF magic number kontrolü (%PDF); değilse bir kez daha base64 dene
    if (!headerStr.startsWith('%PDF')) {
      const base64Resp = tryBase64FromText();
      if (base64Resp) return base64Resp;

      const textPreview = new TextDecoder().decode(pdfArrayBuffer.slice(0, 200));
      console.error('❌ PDF header kontrolü başarısız!');
      console.error('❌ Beklenen: %PDF veya base64 (JVBERi0)');
      console.error('❌ Gelen:', headerStr);
      console.error('❌ İçerik önizlemesi:', textPreview);
      throw new Error(`Geçersiz PDF içeriği. Başlık '${headerStr}'.`);
    }

    // Base64 encoding - Deno'nun built-in base64 encoding'i kullan
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    
    // Deno'da base64 encoding için daha güvenli yöntem
    let pdfBase64: string;
    try {
      // Küçük dosyalar için direkt btoa kullan
      if (uint8Array.length < 100000) { // 100KB altı
        const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
        pdfBase64 = btoa(binaryString);
      } else {
        // Büyük dosyalar için chunk'lara böl
        let binaryString = '';
        const chunkSize = 8192; // 8KB chunks
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          // Spread operator yerine apply kullan
          const chunkArray = Array.from(chunk);
          binaryString += String.fromCharCode.apply(null, chunkArray);
        }
        
        pdfBase64 = btoa(binaryString);
      }
      
      console.log('✅ PDF base64 encoded, length:', pdfBase64.length);
    } catch (encodingError: any) {
      console.error('❌ Base64 encoding error:', encodingError);
      throw new Error(`PDF encoding hatası: ${encodingError.message || 'Bilinmeyen hata'}`);
    }

    // Manuel JSON construction - JSON.stringify çok büyük string'lerde fail olabiliyor
    const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${pdfBlob.size},"message":"PDF başarıyla indirildi"}`;
    console.log('✅ Manuel JSON construction başarılı, response body length:', responseBody.length);

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ PDF download error:', error);
    console.error('❌ Error name:', error.name);
    
    // Check if error message contains PDF data (base64)
    const isPdfData = error.message && (
      error.message.startsWith('JVBERi0') || 
      error.message.length > 1000
    );
    
    let errorMessage = 'PDF indirme hatası';
    let statusCode = 500;
    
    if (isPdfData) {
      console.log('✅ Error message actually contains base64 PDF. Returning success.');
      try {
        const cleaned = String(error.message)
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/[\r\n\s]/g, '');
        const size = Math.ceil(cleaned.length * 3 / 4);
        const responseBody = JSON.stringify({
          success: true,
          pdfData: cleaned,
          mimeType: 'application/pdf',
          size,
          message: 'PDF başarıyla indirildi (error->base64)'
        });
        return new Response(responseBody, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        console.error('❌ Failed to convert base64 from error.message:', e);
        errorMessage = 'PDF işleme hatası. Lütfen tekrar deneyin.';
      }
    } else if (error.message) {
      // Truncate error message if too long
      errorMessage = error.message.length > 200 
        ? error.message.substring(0, 200) + '...' 
        : error.message;
      
      // Check for auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        statusCode = 401;
      }
    }
    
    // Error response construction
    let errorResponseBody: string;
    try {
      errorResponseBody = JSON.stringify({ 
        success: false,
        error: errorMessage
      });
    } catch (stringifyError: any) {
      console.error('❌ Error response JSON.stringify failed:', stringifyError);
      errorResponseBody = '{"success":false,"error":"PDF indirme hatası"}';
    }
    
    return new Response(errorResponseBody, {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

