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
      invoiceId,
      invoiceUUID,
    } = await req.json();

    if (!invoiceUUID && !invoiceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID veya invoiceId parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban fatura durum sorgulama başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);
    console.log('🆔 Invoice UUID:', invoiceUUID);

    // Get invoice from database if invoiceId provided
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

    // Get invoice UUID from invoice or use provided one
    const queryInvoiceUUID = invoiceUUID || invoice?.ettn;
    if (!queryInvoiceUUID) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invoice UUID (ETTN) bilgisi bulunamadı. Fatura henüz gönderilmemiş olabilir.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      // Query invoice status
      console.log('📊 GetSalesInvoiceStatusWithInvoiceUUID çağrılıyor...');
      const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
        sessionCode,
        queryInvoiceUUID,
        veribanAuth.webservice_url
      );

      if (!statusResult.success) {
        console.error('❌ GetSalesInvoiceStatus başarısız:', statusResult.error);
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
      console.log('📊 StateCode:', statusData.stateCode);
      console.log('📋 StateName:', statusData.stateName);
      console.log('📝 StateDescription:', statusData.stateDescription);
      console.log('📋 AnswerStateCode:', statusData.answerStateCode);
      console.log('📋 AnswerTypeCode:', statusData.answerTypeCode);

      // Update invoice status in database if invoiceId provided
      if (invoiceId) {
        const updateData: any = {
          veriban_status: statusData.stateCode,
          veriban_code: statusData.answerStateCode || statusData.stateCode,
          veriban_description: statusData.stateDescription || statusData.stateName,
          updated_at: new Date().toISOString(),
        };

        // Update ETTN if not already set
        if (!invoice.ettn) {
          updateData.ettn = queryInvoiceUUID;
        }

        // Update status based on Veriban state code
        // StateCode values: 1=TASLAK, 2=Gönderilmeyi bekliyor/İmza bekliyor, 3=Gönderim listesinde, 4=HATALI, 5=Başarıyla alıcıya iletildi
        if (statusData.stateCode === 5) {
          updateData.status = 'delivered';
          updateData.delivered_at = new Date().toISOString();
        } else if (statusData.stateCode === 4) {
          updateData.status = 'failed';
        } else if (statusData.stateCode === 3 || statusData.stateCode === 2) {
          updateData.status = 'sent';
        } else if (statusData.stateCode === 1) {
          updateData.status = 'draft';
        }

        // Check for answer
        // AnswerTypeCode: 1=Bilinmiyor, 3=Iade Edildi, 4=Reddedildi, 5=Kabul edildi
        if (statusData.answerTypeCode && statusData.answerTypeCode !== 1) {
          updateData.is_answered = true;
          if (statusData.answerTypeCode === 5) {
            updateData.answer_type = 'KABUL';
          } else if (statusData.answerTypeCode === 4) {
            updateData.answer_type = 'RED';
          } else if (statusData.answerTypeCode === 3) {
            updateData.answer_type = 'IADE';
          }
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
      if (statusData.stateCode === 5) {
        userStatus = 'Başarılı - Fatura alıcıya ulaştı';
      } else if (statusData.stateCode === 4) {
        userStatus = 'Başarısız - Hata oluştu';
      } else if (statusData.stateCode === 3) {
        userStatus = 'Gönderim listesinde, işlem yapılıyor';
      } else if (statusData.stateCode === 2) {
        userStatus = 'Gönderilmeyi bekliyor, imza bekliyor';
      } else if (statusData.stateCode === 1) {
        userStatus = 'Taslak veri';
      }

      // Answer status
      let answerStatus = '';
      if (statusData.answerTypeCode === 5) {
        answerStatus = 'Kabul edildi';
      } else if (statusData.answerTypeCode === 4) {
        answerStatus = 'Reddedildi';
      } else if (statusData.answerTypeCode === 3) {
        answerStatus = 'Iade edildi';
      } else if (statusData.answerStateCode === 2) {
        answerStatus = 'Cevap bekliyor';
      }

      return new Response(JSON.stringify({
        success: true,
        status: {
          stateCode: statusData.stateCode,
          stateName: statusData.stateName,
          stateDescription: statusData.stateDescription,
          answerStateCode: statusData.answerStateCode,
          answerTypeCode: statusData.answerTypeCode,
          userFriendlyStatus: userStatus,
          answerStatus: answerStatus,
        },
        message: 'Durum bilgisi başarıyla alındı'
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
    console.error('❌ Veriban invoice status function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

