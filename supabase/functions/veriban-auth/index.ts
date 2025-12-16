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

    // Parse request body - Supabase automatically parses JSON
    const requestBody = await req.json().catch(() => null);

    if (!requestBody) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request body gerekli veya geçersiz JSON formatı'
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

      // Determine webservice URL based on test mode
      // Both Test and Production use HTTPS
      const webserviceUrl = testMode === false
        ? 'https://efaturatransfer.veriban.com.tr/IntegrationService.svc'
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

      // Calculate session expiration time (6 hours from now)
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 6);

      console.log('⏰ Session expires at:', sessionExpiresAt.toISOString());

      // Save credentials AND session code to database
      // DO NOT logout - we need to keep the session for 6 hours
      console.log('💾 Veriban auth bilgileri ve session code veritabanına kaydediliyor...');
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
          session_code: loginResult.sessionCode,
          session_expires_at: sessionExpiresAt.toISOString(),
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

