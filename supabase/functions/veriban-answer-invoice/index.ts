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
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      invoiceUUID,
      invoiceNumber,
      answerType, // 'KABUL', 'RED', 'IADE' etc.
      answerTime,
      answerNote = '',
      isDirectSend = true,
    } = await req.json();

    if (!invoiceUUID && !invoiceNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID veya invoiceNumber parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!answerType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'answerType parametresi zorunludur (KABUL, RED, IADE vb.)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Veriban fatura cevabı gönderiliyor...');
    console.log('🆔 Invoice UUID:', invoiceUUID);
    console.log('📄 Invoice Number:', invoiceNumber);
    console.log('📋 Answer Type:', answerType);
    console.log('⏰ Answer Time:', answerTime);
    console.log('📝 Answer Note:', answerNote);
    console.log('📤 Is Direct Send:', isDirectSend);

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
    console.log('✅ Session code alındı');

    try {
      // Set Purchase Invoice Answer
      let answerResult;
      if (invoiceUUID) {
        console.log('📊 SetPurchaseInvoiceAnswerWithInvoiceUUID çağrılıyor...');
        answerResult = await VeribanSoapClient.setPurchaseInvoiceAnswer(
          sessionCode,
          {
            invoiceUUID,
            answerType,
            answerTime,
            answerNote,
            isDirectSend,
          },
          veribanAuth.webservice_url
        );
      } else {
        console.log('📊 SetPurchaseInvoiceAnswerWithInvoiceNumber çağrılıyor...');
        answerResult = await VeribanSoapClient.setPurchaseInvoiceAnswerWithInvoiceNumber(
          sessionCode,
          {
            invoiceNumber,
            answerType,
            answerTime,
            answerNote,
            isDirectSend,
          },
          veribanAuth.webservice_url
        );
      }

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
      let invoice;
      if (invoiceUUID) {
        const { data } = await supabase
          .from('incoming_invoices')
          .select('id')
          .eq('ettn', invoiceUUID)
          .eq('company_id', profile.company_id)
          .single();
        invoice = data;
      } else if (invoiceNumber) {
        const { data } = await supabase
          .from('incoming_invoices')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .eq('company_id', profile.company_id)
          .single();
        invoice = data;
      }

      if (invoice) {
        await supabase
          .from('incoming_invoices')
          .update({
            is_answered: true,
            answer_type: answerType,
            answer_description: answerNote,
            answer_date: answerTime || new Date().toISOString(),
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

    } catch (apiError: any) {
      console.error('❌ API çağrısı hatası:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message || 'API çağrısı başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Note: We DO NOT logout here - session is cached for 6 hours

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

