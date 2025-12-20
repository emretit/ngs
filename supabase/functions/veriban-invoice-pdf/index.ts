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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'Authorization': req.headers.get('Authorization')! } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invoiceId, invoiceType = 'e-fatura' } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ success: false, error: 'invoiceId zorunludur' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📄 [Veriban PDF] Request:', { invoiceId, invoiceType });

    // Get user profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

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

    if (authError || !veribanAuth) {
      console.error('❌ [Veriban PDF] Auth not found:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get session
    const { success: sessionSuccess, sessionCode, error: sessionError } = await getValidSessionCode(supabase, veribanAuth);

    if (!sessionSuccess || !sessionCode) {
      return new Response(JSON.stringify({
        success: false,
        error: sessionError || 'Veriban oturumu alınamadı'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] Session obtained');

    // Download PDF (PDF_INZIP format)
    console.log('📥 [Veriban PDF] Downloading PDF...');
    const downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
      sessionCode,
      {
        invoiceUUID: invoiceId,
        downloadDataType: 'PDF_INZIP' // PDF ZIP içinde
      },
      veribanAuth.webservice_url
    );

    if (!downloadResult.success || !downloadResult.data?.binaryData) {
      console.error('❌ [Veriban PDF] Download failed:', downloadResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: downloadResult.error || 'PDF indirilemedi'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Veriban PDF] PDF downloaded, extracting from ZIP...');

    // Decode base64 ZIP
    const zipData = VeribanSoapClient.decodeBase64(downloadResult.data.binaryData);
    console.log('📦 [Veriban PDF] ZIP size:', zipData.length, 'bytes');

    // Extract PDF from ZIP
    const zipjs = await import('https://deno.land/x/zipjs@v2.7.32/index.js');
    const zipBlob = new Blob([zipData as BlobPart]);
    const zipReader = new zipjs.ZipReader(
      new zipjs.BlobReader(zipBlob)
    );

    const entries = await zipReader.getEntries();
    console.log('📁 [Veriban PDF] ZIP entries:', entries.length);

    if (entries.length === 0) {
      await zipReader.close();
      return new Response(JSON.stringify({
        success: false,
        error: 'ZIP dosyası boş'
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
      return new Response(JSON.stringify({
        success: false,
        error: 'ZIP içinde PDF dosyası bulunamadı'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📄 [Veriban PDF] PDF file found:', pdfEntry.filename);

    // Extract PDF content
    const pdfBlobWriter = new zipjs.BlobWriter();
    const pdfBlob = await pdfEntry.getData!(pdfBlobWriter);
    await zipReader.close();

    console.log('✅ [Veriban PDF] PDF extracted, size:', pdfBlob.size, 'bytes');

    // Convert PDF blob to base64
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(pdfArrayBuffer);

    // PDF magic number check
    const firstBytes = String.fromCharCode(...uint8Array.slice(0, 4));
    if (firstBytes !== '%PDF') {
      console.error('❌ [Veriban PDF] Invalid PDF header:', firstBytes);
      return new Response(JSON.stringify({
        success: false,
        error: 'Geçersiz PDF dosyası'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Base64 encode
    let pdfBase64: string;
    if (uint8Array.length < 100000) {
      const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
      pdfBase64 = btoa(binaryString);
    } else {
      // Chunk for large files
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
        const chunkArray = Array.from(chunk);
        binaryString += String.fromCharCode.apply(null, chunkArray);
      }
      pdfBase64 = btoa(binaryString);
    }

    console.log('✅ [Veriban PDF] PDF base64 encoded, length:', pdfBase64.length);

    const responseBody = `{"success":true,"pdfData":"${pdfBase64}","mimeType":"application/pdf","size":${pdfBlob.size},"message":"PDF başarıyla indirildi"}`;

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ [Veriban PDF] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'PDF indirme hatası'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

