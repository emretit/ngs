import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header gerekli'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Geçersiz kullanıcı token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Kullanıcı profili bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Veriban auth settings
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { taxNumber } = await req.json();

    if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Geçerli bir vergi numarası giriniz (10 haneli VKN veya 11 haneli TCKN)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban mükellef sorgulama:', taxNumber);
    console.log('🔐 Veriban Username:', veribanAuth.username);
    console.log('🌐 Webservice URL:', veribanAuth.webservice_url);
    console.log('🧪 Test Mode:', veribanAuth.test_mode);
    console.log('✅ Is Active:', veribanAuth.is_active);

    // Get valid session code (reuses existing session if not expired)
    console.log('🔑 Getting valid session code...');
    const sessionResult = await getValidSessionCode(supabase, veribanAuth);

    if (!sessionResult.success || !sessionResult.sessionCode) {
      console.error('❌ Session code alınamadı:', sessionResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: sessionResult.error || 'Session code alınamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = sessionResult.sessionCode;

    try {
      // Check Taxpayer (GetCustomerData)
      const customerDataResult = await VeribanSoapClient.checkTaxpayer(
        sessionCode,
        taxNumber,
        veribanAuth.webservice_url
      );

      console.log('📥 Customer data result:', JSON.stringify(customerDataResult, null, 2));

      if (!customerDataResult.success) {
        console.log('⚠️ Mükellef sorgulama başarısız veya mükellef değil');
        return new Response(JSON.stringify({ 
          success: true,
          isEinvoiceMukellef: false,
          message: 'Bu vergi numarası e-fatura mükellefi değil veya sorgulanamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle both array and single object responses
      let customerData: any = null;
      const { data } = customerDataResult;
      
      if (Array.isArray(data)) {
        console.log('📊 Data bir array, eleman sayısı:', data.length);
        // Find first customer with Invoice document type, or just first one
        customerData = data.find((c: any) => c.documentType === 'Invoice') || data[0];
        console.log('✅ Seçilen müşteri verisi:', customerData);
      } else {
        customerData = data;
        console.log('📊 Data tek obje');
      }

      if (!customerData) {
        console.log('⚠️ Müşteri verisi bulunamadı');
        return new Response(JSON.stringify({ 
          success: true,
          isEinvoiceMukellef: false,
          message: 'Bu vergi numarası e-fatura mükellefi değil veya sorgulanamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isEinvoiceMukellef = customerData?.isEinvoiceMukellef || !!customerData?.alias;

      console.log('✅ Mükellef sorgulama sonucu:', {
        isEinvoiceMukellef,
        hasAlias: !!customerData?.alias,
        hasTitle: !!customerData?.title,
        identifier: customerData?.identifier || customerData?.identifierNumber,
        documentType: customerData?.documentType
      });

      let formattedData = null;
      if (isEinvoiceMukellef && customerData) {
        formattedData = {
          aliasName: customerData.alias || '',
          companyName: customerData.title || '',
          taxNumber: customerData.identifier || customerData.identifierNumber || taxNumber,
          taxOffice: '', // Not available in Veriban GetCustomerData
          address: '',
          city: '',
          district: '',
          documentType: customerData.documentType || '', // E-Belge Tipi (Invoice, ArchiveInvoice, etc.)
        };
        console.log('📋 Formatlanmış müşteri verisi:', formattedData);
      }

      const responseMessage = isEinvoiceMukellef ?
        'Bu vergi numarası e-fatura mükellefidir' :
        'Bu vergi numarası e-fatura mükellefi değil';

      console.log('✅ Mükellef sorgulama tamamlandı:', responseMessage);

      return new Response(JSON.stringify({
        success: true,
        isEinvoiceMukellef,
        data: formattedData,
        message: responseMessage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError: any) {
      console.error('❌ API çağrısı hatası:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message || 'Mükellef sorgulaması başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Note: We DO NOT logout here - session is cached for 6 hours

  } catch (error: any) {
    console.error('❌ Veriban check mukellef function hatası:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

