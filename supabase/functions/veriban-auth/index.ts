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

  // Only allow POST requests
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

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Request body gerekli'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Geçersiz JSON formatı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, username, password, testMode } = requestBody;

    console.log('📥 Request body:', { action, username: username ? `${username.substring(0, 3)}***` : 'undefined', password: password ? '***' : 'undefined', testMode });

    if (!action) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Action parametresi gerekli'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'authenticate') {
      // Validate required fields
      if (!username || !password) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Kullanıcı adı ve şifre gerekli'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Determine webservice URL based on test mode (default to test if not provided)
      const webserviceUrl = testMode === false
        ? 'http://efaturatransfer.veriban.com.tr/IntegrationService.svc'
        : 'https://efaturatransfertest.veriban.com.tr/IntegrationService.svc';

      console.log('🔐 Veriban authentication başlatılıyor...');
      console.log('📡 Webservice URL:', webserviceUrl);
      console.log('👤 Username:', username);
      console.log('🧪 Test Mode:', testMode);

      // Test Veriban login
      console.log('🔄 Veriban SOAP login çağrısı yapılıyor...');
      const loginResult = await VeribanSoapClient.login(
        { username, password },
        webserviceUrl
      );

      console.log('📥 Login result:', { success: loginResult.success, hasSessionCode: !!loginResult.sessionCode, error: loginResult.error });

      if (!loginResult.success) {
        const errorMessage = loginResult.error || 'Veriban giriş başarısız';
        console.error('❌ Veriban login hatası:', errorMessage);
        return new Response(JSON.stringify({ 
          success: false,
          error: errorMessage
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Veriban login başarılı, sessionCode alındı');

      // Logout immediately (we just tested the credentials)
      if (loginResult.sessionCode) {
        await VeribanSoapClient.logout(loginResult.sessionCode, webserviceUrl);
      }

      // Save credentials to database
      console.log('💾 Veriban auth bilgileri veritabanına kaydediliyor...');
      const { error: insertError } = await supabase
        .from('veriban_auth')
        .upsert({
          user_id: user.id,
          company_id: profile.company_id,
          username,
          password, // In production, this should be encrypted
          test_mode: testMode !== false, // Default to true if not explicitly false
          webservice_url: webserviceUrl,
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Veritabanı kayıt hatası: ${insertError.message || 'Bilinmeyen hata'}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Veriban auth bilgileri başarıyla kaydedildi');

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Veriban kimlik doğrulaması başarıyla kaydedildi',
        sessionCode: loginResult.sessionCode
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Geçersiz işlem');

  } catch (error: any) {
    console.error('❌ Veriban auth function hatası:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

