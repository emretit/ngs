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
    let {
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

    // Get invoice from database if invoiceId or invoiceNumber provided
    // Include outgoing_invoices relationship for cache check
    let invoice;
    let cachedOutgoingInvoice = null;
    
    if (invoiceId) {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*, outgoing_invoices(*)')
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
      cachedOutgoingInvoice = (data as any).outgoing_invoices;
    } else if (invoiceNumber) {
      // invoiceId yoksa invoiceNumber ile ara
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*, outgoing_invoices(*)')
        .eq('fatura_no', invoiceNumber)
        .eq('company_id', profile.company_id)
        .single();

      if (error || !data) {
        console.warn('⚠️ Fatura numarası ile fatura bulunamadı, yalnızca Veriban sorgulaması yapılacak');
      } else {
        invoice = data;
        invoiceId = data.id; // invoiceId'yi güncelleme için set et
        cachedOutgoingInvoice = (data as any).outgoing_invoices;
      }
    }

    // ============================================
    // CACHE CHECK: outgoing_invoices'dan oku
    // Cache kontrolü - ancak her "E-Fatura Çek" butonuna basıldığında yeniden çekilsin
    // ============================================
    if (cachedOutgoingInvoice) {
      console.log('✅ Cache\'den outgoing_invoice bulundu:', cachedOutgoingInvoice.invoice_number);
      console.log('📊 Cache durum:', {
        status: cachedOutgoingInvoice.status,
        elogo_status: cachedOutgoingInvoice.elogo_status,
        elogo_code: cachedOutgoingInvoice.elogo_code
      });
      
      // Cache'deki veri yeterince yeni mi? (Son 5 dakika içinde güncellenmiş)
      // NOT: Cache threshold'u kaldırdık - artık her çağrıda API'den güncel veri çekilecek
      // Böylece "E-Fatura Çek" butonuna her basıldığında durumlar güncellenecek
      const cacheAge = new Date().getTime() - new Date(cachedOutgoingInvoice.updated_at).getTime();
      console.log('📊 Cache yaşı: ' + Math.floor(cacheAge / 60000) + ' dakika - API\'den güncel veri çekilecek');
      
      // Cache kontrolü kaldırıldı - her zaman API'den güncel veri çek
      // ÖNCEDEN: if (cacheAge < CACHE_THRESHOLD) { return cached data }
      // ŞİMDİ: Her zaman API'den güncel veri çek
    } else {
      console.log('ℹ️ outgoing_invoices ile ilişkilendirme henüz yapılmamış, API\'den sorgulama yapılacak');
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
      // Extract integrationCode from invoice xml_data if not provided
      const finalIntegrationCode = integrationCode || (invoice?.xml_data as any)?.integrationCode;
      
      // Extract invoice number from invoice (check parameter, xml_data, or fatura_no field)
      const finalInvoiceNumber = invoiceNumber || (invoice?.xml_data as any)?.veribanInvoiceNumber || invoice?.fatura_no;
      
      // Extract ETTN from invoice (check both direct field and xml_data)
      const invoiceEttn = invoice?.ettn || (invoice?.xml_data as any)?.ettn;
      
      // Use UUID (from parameter or invoice) - will be used if integrationCode and invoiceNumber are not available
      const queryInvoiceUUID = invoiceUUID || invoiceEttn;

      // Önce transfer durumunu kontrol et (eğer integrationCode varsa)
      // Transfer durumu: Dosyanın Veriban'a gönderilip işlenip işlenmediği
      let transferStatusResult = null;
      if (finalIntegrationCode) {
        console.log('📊 [veriban-invoice-status] Önce transfer durumu kontrol ediliyor...');
        console.log('🔑 Integration Code:', finalIntegrationCode);
        
        transferStatusResult = await VeribanSoapClient.getTransferStatusWithIntegrationCode(
          sessionCode,
          finalIntegrationCode,
          veribanAuth.webservice_url
        );

        if (transferStatusResult.success) {
          const transferStateCode = transferStatusResult.data?.stateCode;
          console.log('📊 [veriban-invoice-status] Transfer durum kodu:', transferStateCode);
          
          // StateCode: 1=Bilinmiyor, 2=İşlenmeyi bekliyor, 3=İşleniyor, 4=Hatalı, 5=Başarıyla işlendi
          if (transferStateCode === 4) {
            // Transfer hatası
            return new Response(JSON.stringify({
              success: false,
              error: `Transfer hatası: ${transferStatusResult.data?.stateDescription || 'Bilinmeyen hata'}`,
              transferStatus: {
                stateCode: transferStateCode,
                stateName: transferStatusResult.data?.stateName,
                stateDescription: transferStatusResult.data?.stateDescription,
              }
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else if (transferStateCode !== 5) {
            // Transfer henüz tamamlanmamış (1, 2, 3)
            const statusMessages: Record<number, string> = {
              1: 'Transfer durumu bilinmiyor',
              2: 'Transfer işlenmeyi bekliyor',
              3: 'Transfer işleniyor',
            };
            
            return new Response(JSON.stringify({
              success: false,
              error: statusMessages[transferStateCode] || 'Transfer henüz tamamlanmadı',
              transferStatus: {
                stateCode: transferStateCode,
                stateName: transferStatusResult.data?.stateName,
                stateDescription: transferStatusResult.data?.stateDescription,
                userFriendlyStatus: transferStateCode === 3 ? 'İşleniyor' : transferStateCode === 2 ? 'İşlenmeyi bekliyor' : 'Bilinmiyor',
              },
              message: 'Fatura henüz Veriban sisteminde işleniyor. Lütfen birkaç dakika sonra tekrar kontrol edin.'
            }), {
              status: 202, // Accepted - işlem devam ediyor
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          // Transfer tamamlandı (stateCode === 5), invoice durumunu kontrol etmeye devam et
          console.log('✅ [veriban-invoice-status] Transfer başarıyla tamamlandı, invoice durumu kontrol ediliyor...');
        } else {
          console.warn('⚠️ [veriban-invoice-status] Transfer durumu kontrol edilemedi, invoice durumu kontrol edilmeye devam ediliyor...');
        }
      }

      // Query invoice status based on provided identifier
      let statusResult;
      
      // Öncelik sırası: 1) InvoiceNumber (en güvenilir), 2) IntegrationCode, 3) InvoiceUUID (ETTN)
      if (finalInvoiceNumber) {
        console.log('📊 GetSalesInvoiceStatusWithInvoiceNumber çağrılıyor...');
        console.log('📄 Fatura Numarası:', finalInvoiceNumber);
        statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
          sessionCode,
          finalInvoiceNumber,
          veribanAuth.webservice_url
        );
      } else if (finalIntegrationCode) {
        console.log('📊 GetSalesInvoiceStatusWithIntegrationCode çağrılıyor...');
        console.log('🔑 Integration Code:', finalIntegrationCode);
        statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithIntegrationCode(
          sessionCode,
          finalIntegrationCode,
          veribanAuth.webservice_url
        );
      } else {
        if (!queryInvoiceUUID) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Fatura bilgileri eksik. ETTN, fatura numarası veya entegrasyon kodu bulunamadı. Lütfen faturayı önce gönderin.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('📊 GetSalesInvoiceStatusWithInvoiceUUID çağrılıyor...');
        console.log('🆔 Invoice UUID (ETTN):', queryInvoiceUUID);
        statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
          sessionCode,
          queryInvoiceUUID,
          veribanAuth.webservice_url
        );
      }

      if (!statusResult.success) {
        console.error('❌ GetSalesInvoiceStatus başarısız:', statusResult.error);
        console.error('❌ StatusResult tam objesi:', JSON.stringify(statusResult, null, 2));
        
        // Kullanıcı dostu hata mesajları
        let userFriendlyError = statusResult.error || 'Durum sorgulanamadı';
        if (statusResult.error?.includes('bulunamadı') || statusResult.error?.includes('QUERY DOCUMENT ERROR')) {
          userFriendlyError = 'Fatura Veriban sisteminde bulunamadı. Fatura henüz işlenmemiş veya ETTN/numara hatalı olabilir. Lütfen birkaç dakika bekleyip tekrar deneyin.';
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: userFriendlyError
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let statusData = statusResult.data;
      console.log('✅ Durum bilgisi alındı');
      console.log('📊 StatusResult tam objesi:', JSON.stringify(statusResult, null, 2));
      console.log('📊 StatusData tam objesi:', JSON.stringify(statusData, null, 2));
      console.log('📊 StateCode:', statusData?.stateCode);
      console.log('📋 StateName:', statusData?.stateName);
      console.log('📝 StateDescription:', statusData?.stateDescription);
      console.log('📋 AnswerStateCode:', statusData?.answerStateCode);
      console.log('📋 AnswerTypeCode:', statusData?.answerTypeCode);
      console.log('❌ ErrorMessage:', statusData?.errorMessage);
      console.log('📄 Message:', statusData?.message);
      
      // Combine error details for better error reporting
      let detailedErrorDescription = statusData?.stateDescription || '';
      if (statusData?.errorMessage) {
        detailedErrorDescription = statusData.errorMessage + (detailedErrorDescription ? ` - ${detailedErrorDescription}` : '');
      } else if (statusData?.message) {
        detailedErrorDescription = statusData.message + (detailedErrorDescription ? ` - ${detailedErrorDescription}` : '');
      }
      
      // Eğer statusData yoksa veya stateCode 0 ise, Veriban'dan veri gelmemiş olabilir
      if (!statusData || (statusData.stateCode === 0 && !statusData.stateName)) {
        console.warn('⚠️ Veriban\'dan durum bilgisi alınamadı. Fatura henüz işlenmemiş olabilir.');
        // Varsayılan değerler atayalım
        if (!statusData) {
          statusData = {
            stateCode: 0,
            stateName: '',
            stateDescription: 'Fatura henüz Veriban sisteminde işlenmemiş. Lütfen birkaç dakika sonra tekrar kontrol edin.',
            answerStateCode: 0,
            answerTypeCode: 0,
          };
        }
      }

      // Update invoice status in database if invoiceId provided
      if (invoiceId) {
        // Combine error details for better error reporting
        const errorMessageForDB = statusData.stateCode === 4 
          ? (detailedErrorDescription || statusData.stateName || 'Hata oluştu')
          : null;
        
        const updateData: any = {
          einvoice_invoice_state: statusData.stateCode,
          einvoice_transfer_state: statusData.answerStateCode || statusData.stateCode,
          einvoice_error_message: errorMessageForDB,
          updated_at: new Date().toISOString(),
        };

        // Update xml_data
        const xmlDataUpdate: any = { ...(invoice.xml_data as any || {}) };

        // Update ETTN if not already set (check if invoice has ettn field or use xml_data)
        if (queryInvoiceUUID && !invoice.ettn && !xmlDataUpdate.ettn) {
          xmlDataUpdate.ettn = queryInvoiceUUID;
        }

        // Eğer durum sorgulamasında fatura numarası kullanıldıysa ve fatura_no alanı boşsa, kaydet
        // Veya Veriban'dan dönen response'da fatura numarası varsa, onu kaydet
        // Öncelik: statusData.invoiceNumber > finalInvoiceNumber > mevcut fatura_no
        console.log('📋 [Veriban Status] Fatura numarası bilgileri:', {
          mevcutFaturaNo: invoice.fatura_no || '(yok)',
          statusDataInvoiceNumber: statusData.invoiceNumber || '(yok)',
          finalInvoiceNumber: finalInvoiceNumber || '(yok)',
          invoiceId: invoice.id
        });
        
        if (statusData.invoiceNumber) {
          // Veriban'dan dönen InvoiceNumber varsa, mutlaka kaydet (mevcut fatura_no'dan farklıysa veya boşsa)
          if (!invoice.fatura_no || invoice.fatura_no !== statusData.invoiceNumber) {
            updateData.fatura_no = statusData.invoiceNumber;
            xmlDataUpdate.veribanInvoiceNumber = statusData.invoiceNumber;
            console.log('✅ [Veriban Status] Fatura numarası durum sorgulaması response\'undan alındı ve kaydedildi:', statusData.invoiceNumber);
          } else {
            console.log('ℹ️ [Veriban Status] Fatura numarası zaten kayıtlı:', statusData.invoiceNumber);
            xmlDataUpdate.veribanInvoiceNumber = statusData.invoiceNumber;
          }
        } else if (finalInvoiceNumber && !invoice.fatura_no) {
          updateData.fatura_no = finalInvoiceNumber;
          xmlDataUpdate.veribanInvoiceNumber = finalInvoiceNumber;
          console.log('✅ [Veriban Status] Fatura numarası durum sorgulaması parametresinden alındı ve kaydedildi:', finalInvoiceNumber);
        } else if (invoice.fatura_no) {
          // Mevcut fatura numarası varsa, onu koru
          console.log('ℹ️ [Veriban Status] Mevcut fatura numarası korunuyor:', invoice.fatura_no);
          xmlDataUpdate.veribanInvoiceNumber = invoice.fatura_no;
        } else {
          console.warn('⚠️ [Veriban Status] Fatura numarası bulunamadı. statusData.invoiceNumber:', statusData.invoiceNumber, 'finalInvoiceNumber:', finalInvoiceNumber);
        }

        updateData.xml_data = xmlDataUpdate;

        // ============================================
        // SINGLE SOURCE OF TRUTH: elogo_status
        // Update all status fields based on Veriban StateCode
        // ============================================
        
        // Always update elogo_status (Single Source of Truth)
        updateData.elogo_status = statusData.stateCode;
        console.log('✅ [veriban-invoice-status] elogo_status güncelleniyor:', statusData.stateCode);
        
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
          
          // Map AnswerTypeCode to answer_type (for badge display)
          if (statusData.answerTypeCode === 5) {
            updateData.answer_type = 'KABUL';
          } else if (statusData.answerTypeCode === 4) {
            updateData.answer_type = 'RED';
          } else if (statusData.answerTypeCode === 3) {
            updateData.answer_type = 'IADE';
          }
          console.log('✅ [veriban-invoice-status] answer_type güncelleniyor:', updateData.answer_type);
        } else {
          // No answer yet, set to null
          updateData.answer_type = null;
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
          stateDescription: detailedErrorDescription || statusData.stateDescription, // Use combined error description
          answerStateCode: statusData.answerStateCode,
          answerTypeCode: statusData.answerTypeCode,
          userFriendlyStatus: userStatus,
          answerStatus: answerStatus,
          invoiceNumber: statusData.invoiceNumber || finalInvoiceNumber || null, // Include InvoiceNumber in response
          errorMessage: statusData.errorMessage || null, // Include ErrorMessage if available
          message: statusData.message || null, // Include Message if available
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get state name from state code
 */
function getStateName(stateCode: number | null | undefined): string {
  if (stateCode === null || stateCode === undefined) return 'Bilinmiyor';
  
  switch (stateCode) {
    case 0: return 'Beklemede';
    case 1: return 'Taslak';
    case 2: return 'İmza Bekliyor';
    case 3: return 'Gönderildi';
    case 4: return 'Hatalı';
    case 5: return 'Başarılı';
    case 6: return 'Reddedildi';
    case 7: return 'Kabul Edildi';
    default: return 'Bilinmiyor';
  }
}

/**
 * Get user-friendly status from state code
 */
function getUserFriendlyStatus(stateCode: number | null | undefined): string {
  if (stateCode === null || stateCode === undefined) return 'Bilinmeyen durum';
  
  switch (stateCode) {
    case 0: return 'Beklemede';
    case 1: return 'Taslak veri';
    case 2: return 'Gönderilmeyi bekliyor, imza bekliyor';
    case 3: return 'Gönderim listesinde, işlem yapılıyor';
    case 4: return 'Başarısız - Hata oluştu';
    case 5: return 'Başarılı - Fatura alıcıya ulaştı';
    case 6: return 'Reddedildi';
    case 7: return 'Kabul Edildi';
    default: return 'Bilinmeyen durum';
  }
}

/**
 * Get answer type code from answer type string
 */
function getAnswerTypeCode(answerType: string | null | undefined): number {
  if (!answerType) return 0;
  
  const answerTypeUpper = answerType.toUpperCase();
  switch (answerTypeUpper) {
    case 'KABUL': return 5;
    case 'RED': 
    case 'REDDEDILDI': return 4;
    case 'IADE': 
    case 'IADE EDILDI': return 3;
    default: return 0;
  }
}


