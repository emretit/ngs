import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Sadece POST metodu destekleniyor'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('🚀 [Veriban PDF] Function started');
    console.log('📋 [Veriban PDF] Request method:', req.method);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'Authorization': req.headers.get('Authorization')! } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [Veriban PDF] Unauthorized access');
      return new Response(JSON.stringify({ success: false, error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('👤 [Veriban PDF] User ID:', user.id);

    // Parse request body
    console.log('📨 [Veriban PDF] Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 [Veriban PDF] Raw request body:', requestBody);

    const { invoiceId, invoiceType = 'e-fatura', direction = 'incoming' } = requestBody;

    console.log('📄 [Veriban PDF] PDF download request:', { invoiceId, invoiceType, direction });

    if (!invoiceId) {
      console.error('❌ [Veriban PDF] invoiceId is missing');
      return new Response(JSON.stringify({ success: false, error: 'invoiceId zorunludur' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UUID format kontrolü (sadece incoming için, outgoing'de invoice ID UUID olmayabilir)
    if (direction === 'incoming') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(invoiceId)) {
        console.error('❌ [Veriban PDF] invoiceId is not a valid UUID:', invoiceId);
        return new Response(JSON.stringify({
          success: false,
          error: `Gelen fatura için invoiceId geçersiz UUID formatında: ${invoiceId}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!['incoming', 'outgoing'].includes(direction)) {
      console.error('❌ [Veriban PDF] direction is invalid:', direction);
      return new Response(JSON.stringify({
        success: false,
        error: `direction must be "incoming" or "outgoing", got: ${direction}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] Request validation passed:', { invoiceId, invoiceType, direction });

    // Get user profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    console.log('🏢 [Veriban PDF] Profile query result:', { profile, profileError });

    if (profileError || !profile?.company_id) {
      console.error('❌ [Veriban PDF] Profile not found:', profileError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Profil bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyId = profile.company_id;
    console.log('🏢 [Veriban PDF] Company ID:', companyId);

    // Get Veriban auth
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    console.log('🔐 [Veriban PDF] Veriban auth query result:', { 
      hasAuth: !!veribanAuth, 
      authError, 
      companyId 
    });

    if (authError || !veribanAuth) {
      console.error('❌ [Veriban PDF] Auth not found:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get session
    console.log('🔑 [Veriban PDF] Getting Veriban session...');
    const { success: sessionSuccess, sessionCode, error: sessionError } = await getValidSessionCode(supabase, veribanAuth);

    if (!sessionSuccess || !sessionCode) {
      console.error('❌ [Veriban PDF] Session failed:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: sessionError || 'Veriban oturumu alınamadı'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] Session obtained');

    // Determine if incoming or outgoing invoice
    let downloadResult;
    
    if (direction === 'outgoing') {
      // Giden fatura - integration_code ile indir
      console.log('📥 [Veriban PDF] Downloading OUTGOING invoice PDF...');
      
      // Get ettn (integration code) from outgoing_invoices
      const { data: outgoingInvoice, error: invoiceError } = await supabase
        .from('outgoing_invoices')
        .select('ettn, invoice_number, elogo_status')
        .eq('id', invoiceId)
        .single();

      console.log('📋 [Veriban PDF] Outgoing invoice query result:', { 
        outgoingInvoice, 
        invoiceError 
      });

      if (invoiceError || !outgoingInvoice?.ettn) {
        console.error('❌ [Veriban PDF] ETTN not found:', invoiceError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Giden fatura ETTN bulunamadı. Fatura henüz Veriban\'a gönderilmemiş olabilir.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('📤 [Veriban PDF] ETTN found:', outgoingInvoice.ettn);
      console.log('📄 [Veriban PDF] Invoice number:', outgoingInvoice.invoice_number);
      console.log('📊 [Veriban PDF] E-Logo status:', outgoingInvoice.elogo_status);

      downloadResult = await VeribanSoapClient.downloadSalesInvoiceWithIntegrationCode(
        sessionCode,
        {
          uniqueIntegrationCode: outgoingInvoice.ettn,
          downloadDataType: 'PDF_INZIP'
        },
        veribanAuth.webservice_url
      );
    } else {
      // Gelen fatura - UUID ile indir
      console.log('📥 [Veriban PDF] Downloading INCOMING invoice PDF...');
      console.log('📄 [Veriban PDF] Invoice UUID:', invoiceId);
      
      downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
        sessionCode,
        {
          invoiceUUID: invoiceId,
          downloadDataType: 'PDF_INZIP'
        },
        veribanAuth.webservice_url
      );
    }

    console.log('📡 [Veriban PDF] Download result:', { 
      success: downloadResult.success, 
      hasData: !!downloadResult.data,
      hasBinaryData: !!downloadResult.data?.binaryData,
      error: downloadResult.error 
    });

    if (!downloadResult.success || !downloadResult.data?.binaryData) {
      console.error('❌ [Veriban PDF] Download failed:', downloadResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: downloadResult.error || 'PDF indirilemedi. Veriban\'dan yanıt alınamadı.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] PDF downloaded successfully');
    console.log('📦 [Veriban PDF] Binary data length:', downloadResult.data.binaryData.length);
    console.log('🔓 [Veriban PDF] Extracting PDF from ZIP...');

    // Decode base64 ZIP
    const zipData = VeribanSoapClient.decodeBase64(downloadResult.data.binaryData);
    console.log('📦 [Veriban PDF] ZIP decoded, size:', zipData.length, 'bytes');

    // Extract PDF from ZIP
    console.log('📂 [Veriban PDF] Loading ZIP library...');
    const zipjs = await import('https://deno.land/x/zipjs@v2.7.32/index.js');
    
    const zipBlob = new Blob([zipData as BlobPart]);
    console.log('📂 [Veriban PDF] ZIP blob created, size:', zipBlob.size, 'bytes');
    
    const zipReader = new zipjs.ZipReader(
      new zipjs.BlobReader(zipBlob)
    );

    const entries = await zipReader.getEntries();
    console.log('📁 [Veriban PDF] ZIP entries found:', entries.length);
    
    if (entries.length > 0) {
      console.log('📁 [Veriban PDF] ZIP entry names:', entries.map((e: any) => e.filename).join(', '));
    }

    if (entries.length === 0) {
      await zipReader.close();
      console.error('❌ [Veriban PDF] ZIP file is empty');
      return new Response(JSON.stringify({
        success: false,
        error: 'ZIP dosyası boş. Veriban\'dan geçersiz yanıt alındı.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find PDF file
    const pdfEntry = entries.find((entry: any) => 
      entry.filename.toLowerCase().endsWith('.pdf')
    );

    if (!pdfEntry) {
      await zipReader.close();
      console.error('❌ [Veriban PDF] No PDF file found in ZIP');
      console.error('❌ [Veriban PDF] Available files:', entries.map((e: any) => e.filename).join(', '));
      return new Response(JSON.stringify({
        success: false,
        error: 'ZIP içinde PDF dosyası bulunamadı. Mevcut dosyalar: ' + 
               entries.map((e: any) => e.filename).join(', ')
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📄 [Veriban PDF] PDF file found:', pdfEntry.filename);
    console.log('📄 [Veriban PDF] PDF entry size:', pdfEntry.uncompressedSize || 'unknown', 'bytes');

    // Extract PDF content
    console.log('🔓 [Veriban PDF] Extracting PDF content...');
    const pdfBlobWriter = new zipjs.BlobWriter();
    const pdfBlob = await pdfEntry.getData!(pdfBlobWriter);
    await zipReader.close();

    console.log('✅ [Veriban PDF] PDF extracted successfully');
    console.log('✅ [Veriban PDF] PDF blob size:', pdfBlob.size, 'bytes');

    // PDF'in geçerli olup olmadığını kontrol et
    if (pdfBlob.size === 0) {
      console.error('❌ [Veriban PDF] PDF file is empty');
      return new Response(JSON.stringify({
        success: false,
        error: 'PDF dosyası boş. Veriban geçersiz PDF döndü.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert PDF blob to base64
    console.log('🔐 [Veriban PDF] Converting PDF to base64...');
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(pdfArrayBuffer);

    // PDF magic number check
    const firstBytes = String.fromCharCode(...uint8Array.slice(0, 4));
    console.log('🔍 [Veriban PDF] PDF header check:', firstBytes);
    
    if (firstBytes !== '%PDF') {
      console.error('❌ [Veriban PDF] Invalid PDF header:', firstBytes);
      console.error('❌ [Veriban PDF] Expected: %PDF');
      console.error('❌ [Veriban PDF] First 20 bytes:', 
        String.fromCharCode(...uint8Array.slice(0, 20)));
      return new Response(JSON.stringify({
        success: false,
        error: `Geçersiz PDF dosyası. Başlık '${firstBytes}' olmalı '%PDF'`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] PDF header is valid');

    // Base64 encode
    let pdfBase64: string;
    try {
      if (uint8Array.length < 100000) {
        // Küçük dosyalar için direkt btoa
        console.log('🔐 [Veriban PDF] Using direct base64 encoding (small file)');
        const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
        pdfBase64 = btoa(binaryString);
      } else {
        // Büyük dosyalar için chunk'lara böl
        console.log('🔐 [Veriban PDF] Using chunked base64 encoding (large file)');
        let binaryString = '';
        const chunkSize = 8192; // 8KB chunks
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          const chunkArray = Array.from(chunk);
          binaryString += String.fromCharCode.apply(null, chunkArray);
        }
        
        pdfBase64 = btoa(binaryString);
      }
      
      console.log('✅ [Veriban PDF] PDF base64 encoded successfully');
      console.log('✅ [Veriban PDF] Base64 length:', pdfBase64.length);
    } catch (encodingError: any) {
      console.error('❌ [Veriban PDF] Base64 encoding error:', encodingError);
      return new Response(JSON.stringify({
        success: false,
        error: `PDF encoding hatası: ${encodingError.message || 'Bilinmeyen hata'}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Manuel JSON construction - JSON.stringify çok büyük string'lerde fail olabiliyor
    const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${pdfBlob.size},"message":"PDF başarıyla indirildi"}`;
    console.log('✅ [Veriban PDF] Response body constructed, length:', responseBody.length);
    console.log('🎉 [Veriban PDF] Function completed successfully');

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ [Veriban PDF] Unexpected error:', error);
    console.error('❌ [Veriban PDF] Error name:', error.name);
    console.error('❌ [Veriban PDF] Error message:', error.message);
    console.error('❌ [Veriban PDF] Error stack:', error.stack);
    
    let errorMessage = 'PDF indirme hatası';
    let statusCode = 500;
    
    if (error.message) {
      // Truncate error message if too long
      errorMessage = error.message.length > 200 
        ? error.message.substring(0, 200) + '...' 
        : error.message;
      
      // Check for auth errors
      if (error.message.includes('401') || error.message.includes('403') || 
          error.message.includes('Yetkisiz') || error.message.includes('Unauthorized')) {
        statusCode = 401;
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
