import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SoapClient } from '../_shared/soap-helper.ts';

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

    // Get e-Logo auth settings
    const { data: elogoAuth, error: authError } = await supabase
      .from('elogo_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !elogoAuth) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından e-Logo bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, taxNumber } = await req.json();

    if (action === 'search_mukellef') {
      if (!taxNumber || taxNumber.length < 10) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Geçerli bir vergi numarası giriniz (10-11 haneli)'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('🔍 e-Logo mükellef sorgulama:', taxNumber);

      // Login to e-Logo
      const loginResult = await SoapClient.login(
        {
          username: elogoAuth.username,
          password: elogoAuth.password,
        },
        elogoAuth.webservice_url
      );

      if (!loginResult.success || !loginResult.sessionID) {
        return new Response(JSON.stringify({ 
          success: false,
          error: loginResult.error || 'e-Logo giriş başarısız'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sessionID = loginResult.sessionID;

      try {
        // Check GIB user
        const gibUserResult = await SoapClient.checkGibUser(
          sessionID,
          [taxNumber],
          elogoAuth.webservice_url
        );

        if (!gibUserResult.success) {
          return new Response(JSON.stringify({ 
            success: true,
            isEinvoiceMukellef: false,
            message: 'Bu vergi numarası e-fatura mükellefi değil'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data } = gibUserResult;
        const isEinvoiceMukellef = data?.isEinvoiceMukellef || false;

        let formattedData = null;
        if (isEinvoiceMukellef) {
          formattedData = {
            aliasName: data.invoicePkAlias || '',
            companyName: data.title || '',
            taxNumber: data.identifier || taxNumber,
            taxOffice: '', // Not available in e-Logo CheckGibUser
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
        await SoapClient.logout(sessionID, elogoAuth.webservice_url);
      }
    }

    throw new Error('Geçersiz işlem');

  } catch (error: any) {
    console.error('❌ e-Logo check mukellef function hatası:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
