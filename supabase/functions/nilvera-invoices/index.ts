
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Nilvera edge function started');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
    
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

    console.log('📨 Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 Raw request body:', requestBody);
    
    const { action, filters, salesInvoiceId } = requestBody;
    console.log('📨 Parsed request body:', { action, filters, salesInvoiceId });
    console.log('👤 User ID:', user.id);

    // Validate required fields
    if (!action) {
      console.error('❌ Action is required');
      throw new Error('Action is required');
    }

    if (action === 'send_invoice' && !salesInvoiceId) {
      console.error('❌ salesInvoiceId is required for send_invoice action');
      throw new Error('salesInvoiceId is required for send_invoice action');
    }

    if (action === 'check_status' && !salesInvoiceId) {
      console.error('❌ salesInvoiceId is required for check_status action');
      throw new Error('salesInvoiceId is required for check_status action');
    }

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


    // fetch_incoming action moved to nilvera-incoming-invoices function


    // send_invoice action moved to nilvera-send-invoice function

    // check_status action moved to nilvera-check-status function

    if (action === 'download_pdf') {
      try {
        console.log('📄 Starting PDF download process...');
        
        const { invoiceId, invoiceType } = requestBody;
        
        if (!invoiceId) {
          throw new Error('invoiceId is required');
        }

        if (!invoiceType || !['e-fatura', 'e-arşiv'].includes(invoiceType)) {
          throw new Error('invoiceType must be either "e-fatura" or "e-arşiv"');
        }

        console.log('📄 PDF download request:', { invoiceId, invoiceType });

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

        if (pdfApiUrl) {
          const pdfResponse = await fetch(pdfApiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${nilveraAuth.api_key}`,
              'Accept': '*/*' // Nilvera API dokümantasyonuna göre
            }
          });

        if (!pdfResponse.ok) {
          const errorText = await pdfResponse.text();
          console.error('❌ PDF download error:', errorText);
          throw new Error(`PDF download failed: ${pdfResponse.status} - ${errorText}`);
        }

        // Get PDF content as blob
        const contentType = pdfResponse.headers.get('content-type');
        console.log('✅ Response Content-Type:', contentType);
        
        const pdfBlob = await pdfResponse.blob();
        console.log('✅ PDF blob received, size:', pdfBlob.size, 'bytes');
        console.log('✅ PDF blob type:', pdfBlob.type);
        
        // Content-Type kontrolü
        if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
          console.warn('⚠️ Beklenmeyen Content-Type:', contentType);
        }

        // PDF'in geçerli olup olmadığını kontrol et
        if (pdfBlob.size === 0) {
          throw new Error('PDF dosyası boş');
        }

        // PDF magic number kontrolü (%PDF)
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        const pdfHeader = new Uint8Array(pdfArrayBuffer.slice(0, 4));
        const pdfHeaderString = String.fromCharCode(...pdfHeader);
        
        if (pdfHeaderString !== '%PDF') {
          console.warn('⚠️ PDF header kontrolü başarısız:', pdfHeaderString);
          // Yine de devam et, bazı PDF'ler farklı header'a sahip olabilir
        }

        // Base64 encoding - büyük dosyalar için daha güvenli yöntem
        const uint8Array = new Uint8Array(pdfArrayBuffer);
        let binaryString = '';
        const chunkSize = 8192; // 8KB chunks
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        
        const pdfBase64 = btoa(binaryString);

        console.log('✅ PDF base64 encoded, length:', pdfBase64.length);

        return new Response(JSON.stringify({ 
          success: true,
          pdfData: pdfBase64,
          mimeType: 'application/pdf',
          size: pdfBlob.size,
          message: 'PDF başarıyla indirildi'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
        }

      } catch (error: any) {
        console.error('❌ PDF download error:', error);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('❌ Error in nilvera-invoices function:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unknown error occurred',
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
