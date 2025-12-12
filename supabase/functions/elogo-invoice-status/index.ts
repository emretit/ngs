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
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      invoiceId,
      ettn,
      documentType = 'EINVOICE',
    } = await req.json();

    if (!invoiceId && !ettn) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId veya ettn parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 e-Logo fatura durum sorgulama başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);
    console.log('🆔 ETTN:', ettn);

    // Get invoice from database
    let invoice;
    if (invoiceId) {
      const { data, error } = await supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('company_id', profile.company_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Fatura bulunamadı'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      invoice = data;
    }

    // Get ETTN from invoice or use provided one
    const queryEttn = ettn || invoice?.ettn;
    if (!queryEttn) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ETTN bilgisi bulunamadı. Fatura henüz gönderilmemiş olabilir.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Login to e-Logo
    console.log('🔐 e-Logo girişi yapılıyor...');
    const loginResult = await SoapClient.login(
      {
        username: elogoAuth.username,
        password: elogoAuth.password,
      },
      elogoAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionID) {
      console.error('❌ e-Logo login başarısız:', loginResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'e-Logo giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionID = loginResult.sessionID;
    console.log('✅ e-Logo login başarılı');

    try {
      // Query document status
      console.log('📊 GetDocumentStatus çağrılıyor...');
      const statusResult = await SoapClient.getDocumentStatus(
        sessionID,
        queryEttn,
        [`DOCUMENTTYPE=${documentType}`],
        elogoAuth.webservice_url
      );

      if (!statusResult.success) {
        console.error('❌ GetDocumentStatus başarısız:', statusResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: statusResult.error || 'Durum sorgulanamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = statusResult.data;
      console.log('✅ Durum bilgisi alındı');
      console.log('📊 Status:', statusData.status);
      console.log('📋 Code:', statusData.code);
      console.log('📝 Description:', statusData.description);

      // Update invoice status in database if invoiceId provided
      if (invoiceId) {
        const updateData: any = {
          elogo_status: statusData.status,
          elogo_code: statusData.code,
          elogo_description: statusData.description,
          updated_at: new Date().toISOString(),
        };

        // Update envelope_id if available
        if (statusData.envelopeId) {
          updateData.envelope_id = statusData.envelopeId;
        }

        // Update ETTN if not already set
        if (!invoice.ettn) {
          updateData.ettn = queryEttn;
        }

        // Update status based on e-Logo status
        if (statusData.status === 2 && statusData.code === 1300) {
          // Başarılı - Alıcıya ulaştı
          updateData.status = 'delivered';
          updateData.delivered_at = new Date().toISOString();
        } else if (statusData.status === -1) {
          // Başarısız
          updateData.status = 'failed';
        } else if (statusData.status === 1) {
          // İşlem devam ediyor
          updateData.status = 'sent';
        }

        // Check for application response
        if (statusData.statusDetail && statusData.statusDetail.respCode) {
          updateData.is_answered = true;
          updateData.answer_type = statusData.statusDetail.respCode; // KABUL veya RED
          updateData.answer_description = statusData.statusDetail.respDescription;
          updateData.answer_date = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('outgoing_invoices')
          .update(updateData)
          .eq('id', invoiceId);

        if (updateError) {
          console.error('❌ Veritabanı güncelleme hatası:', updateError);
        } else {
          console.log('✅ Veritabanı güncellendi');
        }
      }

      // Prepare response with user-friendly status
      let userStatus = 'Bilinmeyen durum';
      if (statusData.status === 2 && statusData.code === 1300) {
        userStatus = 'Başarılı - Fatura alıcıya ulaştı';
      } else if (statusData.status === 1) {
        if (statusData.code === 10) userStatus = 'Kuyrukta bekliyor';
        else if (statusData.code === 1000) userStatus = 'GİB işleme aldı';
        else if (statusData.code === 1100) userStatus = 'GİB işliyor';
        else if (statusData.code === 1200) userStatus = 'GİB onayladı, alıcıya gönderiliyor';
        else if (statusData.code === 1220) userStatus = 'Alıcıya gönderildi, yanıt bekleniyor';
        else if (statusData.code === 1230) userStatus = 'Alıcıda hata oluştu';
        else userStatus = 'İşlem devam ediyor';
      } else if (statusData.status === -1) {
        userStatus = 'Başarısız - Hata oluştu';
      }

      return new Response(JSON.stringify({
        success: true,
        status: {
          rawStatus: statusData.status,
          code: statusData.code,
          description: statusData.description,
          userFriendlyStatus: userStatus,
          envelopeId: statusData.envelopeId,
          currentDate: statusData.currentDate,
          isCancel: statusData.isCancel,
          applicationResponse: statusData.statusDetail,
        },
        message: 'Durum bilgisi başarıyla alındı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      try {
        await SoapClient.logout(sessionID, elogoAuth.webservice_url);
        console.log('✅ e-Logo oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ e-Logo invoice status function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
