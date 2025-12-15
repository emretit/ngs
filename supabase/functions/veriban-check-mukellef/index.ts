import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

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

    // Login to Veriban
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      return new Response(JSON.stringify({ 
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = loginResult.sessionCode;

    try {
      // Check Taxpayer (GetCustomerData)
      const customerDataResult = await VeribanSoapClient.checkTaxpayer(
        sessionCode,
        taxNumber,
        veribanAuth.webservice_url
      );

      if (!customerDataResult.success) {
        return new Response(JSON.stringify({ 
          success: true,
          isEinvoiceMukellef: false,
          message: 'Bu vergi numarası e-fatura mükellefi değil veya sorgulanamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data } = customerDataResult;
      const isEinvoiceMukellef = data?.isEinvoiceMukellef || !!data?.alias;

      let formattedData = null;
      if (isEinvoiceMukellef && data) {
        formattedData = {
          aliasName: data.alias || '',
          companyName: data.title || '',
          taxNumber: data.identifier || taxNumber,
          taxOffice: '', // Not available in Veriban GetCustomerData
          address: '',
          city: '',
          district: '',
        };
      }

      return new Response(JSON.stringify({ 
        success: true,
        isEinvoiceMukellef,
        data: formattedData,
        message: isEinvoiceMukellef ? 
          'Bu vergi numarası e-fatura mükellefidir' : 
          'Bu vergi numarası e-fatura mükellefi değil'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
    }

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

