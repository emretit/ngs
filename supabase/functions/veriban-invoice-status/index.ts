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
      invoiceId,
      invoiceUUID,
      invoiceNumber,
      integrationCode,
    } = await req.json();

    if (!invoiceUUID && !invoiceId && !invoiceNumber && !integrationCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID, invoiceId, invoiceNumber veya integrationCode parametrelerinden biri zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban fatura durum sorgulama başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);
    console.log('🆔 Invoice UUID:', invoiceUUID);
    console.log('📄 Invoice Number:', invoiceNumber);
    console.log('🔑 Integration Code:', integrationCode);

    // Get invoice from database if invoiceId provided
    let invoice;
    if (invoiceId) {
      const { data, error } = await supabase
        .from('sales_invoices')
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
      // Query invoice status based on provided identifier
      let statusResult;
      
      if (integrationCode) {
        console.log('📊 GetSalesInvoiceStatusWithIntegrationCode çağrılıyor...');
        statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithIntegrationCode(
          sessionCode,
          integrationCode,
          veribanAuth.webservice_url
        );
      } else if (invoiceNumber) {
        console.log('📊 GetSalesInvoiceStatusWithInvoiceNumber çağrılıyor...');
        statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
          sessionCode,
          invoiceNumber,
          veribanAuth.webservice_url
        );
      } else {
        // Use UUID (from parameter or invoice)
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
        console.log('📊 GetSalesInvoiceStatusWithInvoiceUUID çağrılıyor...');
        statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
          sessionCode,
          queryInvoiceUUID,
          veribanAuth.webservice_url
        );
      }

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
          einvoice_invoice_state: statusData.stateCode,
          einvoice_transfer_state: statusData.answerStateCode || statusData.stateCode,
          einvoice_error_message: statusData.stateCode === 4 ? (statusData.stateDescription || statusData.stateName) : null,
          updated_at: new Date().toISOString(),
        };

        // Update ETTN if not already set (check if invoice has ettn field or use xml_data)
        if (queryInvoiceUUID && !invoice.ettn) {
          // Try to update ettn if field exists, otherwise store in xml_data
          if (invoice.xml_data) {
            updateData.xml_data = { ...invoice.xml_data, ettn: queryInvoiceUUID };
          }
        }

        // Update status based on Veriban state code
        // StateCode values: 1=TASLAK, 2=Gönderilmeyi bekliyor/İmza bekliyor, 3=Gönderim listesinde, 4=HATALI, 5=Başarıyla alıcıya iletildi
        if (statusData.stateCode === 5) {
          updateData.durum = 'onaylandi';
          updateData.einvoice_status = 'delivered';
          updateData.einvoice_delivered_at = new Date().toISOString();
        } else if (statusData.stateCode === 4) {
          updateData.durum = 'iptal';
          updateData.einvoice_status = 'error';
        } else if (statusData.stateCode === 3 || statusData.stateCode === 2) {
          updateData.durum = 'gonderildi';
          updateData.einvoice_status = 'sent';
        } else if (statusData.stateCode === 1) {
          updateData.durum = 'taslak';
          updateData.einvoice_status = 'draft';
        }

        // Check for answer
        // AnswerTypeCode: 1=Bilinmiyor, 3=Iade Edildi, 4=Reddedildi, 5=Kabul edildi
        if (statusData.answerTypeCode && statusData.answerTypeCode !== 1) {
          updateData.einvoice_responded_at = new Date().toISOString();
          updateData.einvoice_answer_type = statusData.answerTypeCode === 5 ? 5 : (statusData.answerTypeCode === 4 ? 4 : 3);
        }

        const { error: updateError } = await supabase
          .from('sales_invoices')
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

