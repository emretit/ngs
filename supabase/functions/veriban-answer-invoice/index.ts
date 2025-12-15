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
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      invoiceUUID,
      answerType, // 'KABUL' or 'RED'
      description = '',
    } = await req.json();

    if (!invoiceUUID || !answerType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID ve answerType parametreleri zorunludur (answerType: KABUL veya RED)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (answerType !== 'KABUL' && answerType !== 'RED') {
      return new Response(JSON.stringify({
        success: false,
        error: 'answerType sadece KABUL veya RED olabilir'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Veriban fatura cevabı gönderiliyor...');
    console.log('🆔 Invoice UUID:', invoiceUUID);
    console.log('📋 Answer Type:', answerType);
    console.log('📝 Description:', description);

    // Login to Veriban
    console.log('🔐 Veriban girişi yapılıyor...');
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      console.error('❌ Veriban login başarısız:', loginResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = loginResult.sessionCode;
    console.log('✅ Veriban login başarılı');

    try {
      // Set Purchase Invoice Answer
      console.log('📊 SetPurchaseInvoiceAnswerWithInvoiceUUID çağrılıyor...');
      const answerResult = await VeribanSoapClient.setPurchaseInvoiceAnswer(
        sessionCode,
        {
          invoiceUUID,
          answerType: answerType as 'KABUL' | 'RED',
          description,
        },
        veribanAuth.webservice_url
      );

      if (!answerResult.success) {
        console.error('❌ SetPurchaseInvoiceAnswer başarısız:', answerResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: answerResult.error || 'Fatura cevabı gönderilemedi'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Fatura cevabı başarıyla gönderildi');

      // Update invoice in database if exists
      const { data: invoice } = await supabase
        .from('incoming_invoices')
        .select('id')
        .eq('ettn', invoiceUUID)
        .eq('company_id', profile.company_id)
        .single();

      if (invoice) {
        await supabase
          .from('incoming_invoices')
          .update({
            is_answered: true,
            answer_type: answerType,
            answer_description: description,
            answer_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Fatura ${answerType === 'KABUL' ? 'kabul' : 'red'} edildi`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      try {
        await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
        console.log('✅ Veriban oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban answer invoice function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

