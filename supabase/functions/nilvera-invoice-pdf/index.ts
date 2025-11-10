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
        'Accept': '*/*' // Nilvera API dokümantasyonuna göre
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
      console.error('❌ Error Response:', errorText);
      console.error('❌ Invoice ID:', invoiceId);
      console.error('❌ Invoice Type:', invoiceType);
      
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
          errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Get PDF content as blob
    const contentType = pdfResponse.headers.get('content-type');
    console.log('✅ Response Content-Type:', contentType);
    
    // Content-Type kontrolü - PDF değilse önce JSON hata mesajını kontrol et
    if (contentType && contentType.includes('application/json')) {
      // JSON dönmüş - muhtemelen bir hata mesajı VEYA base64 PDF verisi
      const jsonContent = await pdfResponse.json();
      console.log('📦 Nilvera API JSON yanıt döndü:', Object.keys(jsonContent));
      console.log('📦 JSON içerik tipleri:', Object.keys(jsonContent).map(k => `${k}: ${typeof jsonContent[k]}`));
      
      // Eğer error field varsa ilk 100 karakterini logla
      if (jsonContent.error) {
        console.log('📦 jsonContent.error type:', typeof jsonContent.error);
        console.log('📦 jsonContent.error length:', typeof jsonContent.error === 'string' ? jsonContent.error.length : 'N/A');
        console.log('📦 jsonContent.error first 100 chars:', typeof jsonContent.error === 'string' ? jsonContent.error.substring(0, 100) : jsonContent.error);
      }
      
      // Eğer jsonContent.error base64 PDF verisi ise (PDF başlangıcı ile başlıyorsa)
      // Base64 encoded "%PDF" -> "JVBERi0" ile başlar
      if (jsonContent.error && typeof jsonContent.error === 'string' && jsonContent.error.startsWith('JVBERi0')) {
        console.log('✅ JSON içinde base64 PDF verisi bulundu (error field)!');
        console.log('✅ PDF base64 length:', jsonContent.error.length);
        
        // Base64 PDF verisini direkt kullan - büyük string'ler için manuel JSON construction
        const pdfBase64 = jsonContent.error;
        const size = Math.ceil(pdfBase64.length * 3 / 4);
        
        // Manuel olarak JSON string oluştur - JSON.stringify çok büyük string'lerde fail olabiliyor
        const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (JSON response)"}`;
        console.log('✅ Manuel JSON construction başarılı, response body length:', responseBody.length);

        return new Response(responseBody, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Diğer JSON field'larını da kontrol et - PDF verisi başka bir field'da olabilir
      for (const [key, value] of Object.entries(jsonContent)) {
        if (typeof value === 'string' && value.startsWith('JVBERi0') && value.length > 1000) {
          console.log(`✅ JSON içinde base64 PDF verisi bulundu (${key} field)!`);
          console.log('✅ PDF base64 length:', value.length);
          
          const pdfBase64 = value;
          const size = Math.ceil(pdfBase64.length * 3 / 4);
          
          const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${size},"message":"PDF başarıyla indirildi (JSON response)"}`;
          console.log('✅ Manuel JSON construction başarılı, response body length:', responseBody.length);

          return new Response(responseBody, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Normal JSON hata mesajı
      console.error('❌ Nilvera API JSON hata yanıtı:', jsonContent);
      let errorMessage = 'PDF indirilemedi';
      if (jsonContent.message) {
        errorMessage = jsonContent.message;
      } else if (jsonContent.error && typeof jsonContent.error === 'string') {
        errorMessage = jsonContent.error.substring(0, 200); // Kısalt
      } else if (jsonContent.errors && Array.isArray(jsonContent.errors) && jsonContent.errors.length > 0) {
        errorMessage = jsonContent.errors[0].message || jsonContent.errors[0];
      } else if (typeof jsonContent === 'string') {
        errorMessage = jsonContent;
      } else {
        errorMessage = `Nilvera API hatası: ${JSON.stringify(jsonContent).substring(0, 200)}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const pdfBlob = await pdfResponse.blob();
    console.log('✅ PDF blob received, size:', pdfBlob.size, 'bytes');
    console.log('✅ PDF blob type:', pdfBlob.type);
    
    // Content-Type kontrolü - PDF veya octet-stream değilse hata
    if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream') && !contentType.includes('application/octet-stream')) {
      // HTML veya başka bir içerik dönmüş olabilir (error page)
      const textContent = await pdfBlob.text();
      console.error('❌ Geçersiz Content-Type:', contentType);
      console.error('❌ Response içeriği (ilk 500 karakter):', textContent.substring(0, 500));
      
      // JSON olup olmadığını kontrol et
      try {
        const jsonContent = JSON.parse(textContent);
        let errorMessage = 'PDF indirilemedi';
        if (jsonContent.message) {
          errorMessage = jsonContent.message;
        } else if (jsonContent.error) {
          errorMessage = jsonContent.error;
        }
        throw new Error(errorMessage);
      } catch {
        // JSON değilse genel hata mesajı
        throw new Error(`PDF bekleniyor ama farklı bir içerik döndü. Content-Type: ${contentType}. Lütfen Nilvera API erişiminizi ve invoice UUID'yi kontrol edin.`);
      }
    }

    // PDF'in geçerli olup olmadığını kontrol et
    if (pdfBlob.size === 0) {
      throw new Error('PDF dosyası boş. Nilvera API boş yanıt döndü.');
    }

    // PDF magic number kontrolü (%PDF) - ZORUNLU
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfHeader = new Uint8Array(pdfArrayBuffer.slice(0, 4));
    const pdfHeaderString = String.fromCharCode(...pdfHeader);
    
    if (pdfHeaderString !== '%PDF') {
      // İçeriğin başını kontrol et - belki HTML error page döndü
      const textPreview = new TextDecoder().decode(pdfArrayBuffer.slice(0, 200));
      console.error('❌ PDF header kontrolü başarısız!');
      console.error('❌ Beklenen: %PDF');
      console.error('❌ Gelen:', pdfHeaderString);
      console.error('❌ İçerik önizlemesi:', textPreview);
      throw new Error(`Geçersiz PDF dosyası. Dosya başlığı '%PDF' değil: '${pdfHeaderString}'. Nilvera API muhtemelen hata mesajı döndü.`);
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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Hata mesajını kısalt - çok uzun olabilir (base64 string olabilir)
    let errorMessage = error.message || 'PDF indirme hatası';
    
    // Eğer hata mesajı base64 gibi görünüyorsa (PDF başlangıcı), genel bir mesaj kullan
    if (errorMessage.startsWith('JVBERi0xLjQK') || errorMessage.length > 1000) {
      console.error('❌ Hata mesajı base64 string içeriyor veya çok uzun, genel mesaj kullanılıyor');
      errorMessage = 'PDF işleme hatası oluştu. Lütfen tekrar deneyin.';
    } else if (errorMessage.length > 500) {
      errorMessage = errorMessage.substring(0, 500) + '... (mesaj çok uzun, kısaltıldı)';
    }
    
    const statusCode = error.message?.includes('401') || error.message?.includes('403') ? 401 : 400;
    
    // Error response'u da try-catch ile koru
    let errorResponseBody: string;
    try {
      errorResponseBody = JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: {
          name: error.name,
          message: error.message?.substring(0, 200) || 'Bilinmeyen hata',
          stack: error.stack?.substring(0, 500) || undefined
        }
      });
    } catch (stringifyError: any) {
      console.error('❌ Error response JSON.stringify hatası:', stringifyError);
      errorResponseBody = JSON.stringify({ 
        success: false,
        error: 'PDF indirme hatası'
      });
    }
    
    return new Response(errorResponseBody, {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

