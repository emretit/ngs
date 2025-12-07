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

    const { action, username, password, testMode } = await req.json();

    if (action === 'authenticate') {
      // Determine webservice URL based on test mode
      const webserviceUrl = testMode 
        ? 'https://pb-demo.elogo.com.tr/PostBoxService.svc'
        : 'https://pb.elogo.com.tr/PostBoxService.svc';

      console.log('🔐 e-Logo authentication başlatılıyor...');
      console.log('📡 Webservice URL:', webserviceUrl);
      console.log('👤 Username:', username);

      // Test e-Logo login
      const loginResult = await SoapClient.login(
        { username, password },
        webserviceUrl
      );

      if (!loginResult.success) {
        return new Response(JSON.stringify({ 
          success: false,
          error: loginResult.error || 'e-Logo giriş başarısız'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ e-Logo login başarılı, sessionID alındı');

      // Logout immediately (we just tested the credentials)
      if (loginResult.sessionID) {
        await SoapClient.logout(loginResult.sessionID, webserviceUrl);
      }

      // Save credentials to database
      const { error: insertError } = await supabase
        .from('elogo_auth')
        .upsert({
          user_id: user.id,
          company_id: profile.company_id,
          username,
          password, // In production, this should be encrypted
          test_mode: testMode,
          webservice_url: webserviceUrl,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error('Failed to save authentication data');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'e-Logo kimlik doğrulaması başarıyla kaydedildi' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Geçersiz işlem');

  } catch (error: any) {
    console.error('❌ e-Logo auth function hatası:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
