import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, EArchiveTransferParams } from '../_shared/veriban-soap-helper.ts';
import { generateUBLTRXML } from '../_shared/ubl-generator.ts';

/**
 * Veriban E-Arşiv Fatura Gönderim Edge Function
 * 
 * Bu fonksiyon E-Arşiv faturaları için özel parametreleri destekler:
 * - InvoiceTransportationType (ELEKTRONIK/KAGIT)
 * - IsInvoiceCreatedAtDelivery
 * - IsInternetSalesInvoice
 * - ReceiverMailTargetAddresses
 * 
 * Ayrı tutma nedenleri:
 * 1. E-Arşiv ve E-Fatura farklı API parametreleri kullanır
 * 2. E-Arşiv faturaları iptal edilebilir, E-Fatura iptal edilemez
 * 3. E-Arşiv için mail gönderimi desteklenir
 * 4. Kod bakımı ve debugging daha kolay
 */

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

    // Parse request body
    const {
      invoiceId,
      xmlContent,
      customerAlias,
      isDirectSend = true,
      integrationCode,
      forceResend = false,
      // E-Arşiv özel parametreleri
      invoiceTransportationType = 'ELEKTRONIK', // ELEKTRONIK veya KAGIT
      isInvoiceCreatedAtDelivery = false,
      isInternetSalesInvoice = false,
      receiverMailAddresses = [], // Alıcı mail adresleri
    } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 [E-Arşiv] Veriban E-Arşiv fatura gönderimi başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);
    console.log('📋 Gönderim Türü:', invoiceTransportationType);
    console.log('📧 Mail Adresleri:', receiverMailAddresses.join(', ') || '(yok)');

    // Get Veriban auth settings
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: 'Veriban kimlik doğrulama bilgileri bulunamadı.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get invoice from database with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select(`
        *,
        companies(*),
        customers(*),
        sales_invoice_items(*)
      `)
      .eq('id', invoiceId)
      .eq('company_id', profile.company_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fatura bulunamadı'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // E-Arşiv profili zorunlu olarak ayarla
    const invoiceProfile = 'EARSIVFATURA';
    invoice.invoice_profile = invoiceProfile;
    
    // Veritabanını güncelle
    await supabase
      .from('sales_invoices')
      .update({
        invoice_profile: invoiceProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);
    
    console.log('✅ [E-Arşiv] Invoice profile: EARSIVFATURA olarak ayarlandı');

    // Fatura numarası üretimi (E-Arşiv için EAR seri kodu)
    let invoiceNumber = invoice.fatura_no;
    if (!invoiceNumber) {
      console.log('📝 [E-Arşiv] Fatura numarası üretiliyor...');
      
      try {
        // E-Arşiv için seri kodu al
        const { data: formatParam } = await supabase
          .from('system_parameters')
          .select('parameter_value')
          .eq('parameter_key', 'earchive_invoice_number_format')
          .eq('company_id', profile.company_id)
          .maybeSingle();
        
        let serie = formatParam?.parameter_value || 'EAR';
        serie = serie.trim().toUpperCase().substring(0, 3);
        
        if (!serie || serie.length !== 3) {
          serie = 'EAR';
        }
        
        console.log('📋 [E-Arşiv] Seri Kodu:', serie);
        
        // Yıl
        const invoiceDate = invoice.fatura_tarihi ? new Date(invoice.fatura_tarihi) : new Date();
        const year = invoiceDate.getFullYear().toString();
        const prefix = `${serie}${year}`;
        
        // Veritabanından bu prefix ile başlayan en yüksek numarayı bul
        const { data: existingInvoices } = await supabase
          .from('sales_invoices')
          .select('fatura_no')
          .eq('company_id', profile.company_id)
          .eq('invoice_profile', 'EARSIVFATURA') // Sadece E-Arşiv faturaları
          .like('fatura_no', `${prefix}%`)
          .not('fatura_no', 'is', null)
          .order('fatura_no', { ascending: false })
          .limit(100);
        
        let maxSequence = 0;
        if (existingInvoices && existingInvoices.length > 0) {
          for (const inv of existingInvoices) {
            if (!inv.fatura_no || !inv.fatura_no.startsWith(prefix)) continue;
            const sequencePart = inv.fatura_no.substring(prefix.length);
            const num = parseInt(sequencePart);
            if (!isNaN(num) && num > maxSequence) {
              maxSequence = num;
            }
          }
        }
        
        // Veriban API kontrolü
        if (veribanAuth?.is_active) {
          try {
            console.log('🔍 [E-Arşiv] Veriban API\'sinden son fatura numarası kontrol ediliyor...');
            
            const loginResult = await VeribanSoapClient.login(
              { username: veribanAuth.username, password: veribanAuth.password },
              veribanAuth.webservice_url
            );
            
            if (loginResult.success && loginResult.sessionCode) {
              const sessionCode = loginResult.sessionCode;
              
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);
              
              const listResult = await VeribanSoapClient.getSalesInvoiceList(
                sessionCode,
                {
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  pageIndex: 1,
                  pageSize: 20,
                },
                veribanAuth.webservice_url
              );
              
              if (listResult.success && listResult.data?.invoices) {
                const invoicesToCheck = listResult.data.invoices.slice(0, 10);
                
                for (const veribanInv of invoicesToCheck) {
                  try {
                    const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
                      sessionCode,
                      veribanInv.invoiceUUID,
                      veribanAuth.webservice_url
                    );
                    
                    if (statusResult.success && statusResult.data?.invoiceNumber) {
                      const veribanInvoiceNumber = statusResult.data.invoiceNumber;
                      const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
                      
                      // Sadece E-Arşiv faturaları kontrol et
                      if (veribanInvoiceProfile !== 'EARSIVFATURA') {
                        continue;
                      }
                      
                      if (veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
                        const sequencePart = veribanInvoiceNumber.substring(prefix.length);
                        const num = parseInt(sequencePart);
                        if (!isNaN(num) && num > maxSequence) {
                          maxSequence = num;
                          console.log('✅ [E-Arşiv] Veriban\'dan daha yüksek numara bulundu:', veribanInvoiceNumber);
                        }
                      }
                    }
                  } catch (statusError) {
                    console.warn('⚠️ [E-Arşiv] Fatura durum sorgusu hatası:', statusError);
                  }
                }
              }
              
              try {
                await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
              } catch (e) {
                // Ignore
              }
            }
          } catch (veribanError) {
            console.warn('⚠️ [E-Arşiv] Veriban API kontrolü hatası:', veribanError);
          }
        }
        
        // Bir sonraki numarayı üret
        const nextSequence = maxSequence + 1;
        const sequence = nextSequence.toString().padStart(9, '0');
        invoiceNumber = `${serie}${year}${sequence}`;
        
        console.log('✅ [E-Arşiv] Fatura numarası üretildi:', invoiceNumber);
        
        // Fatura numarasını kaydet
        await supabase
          .from('sales_invoices')
          .update({
            fatura_no: invoiceNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        
        invoice.fatura_no = invoiceNumber;
      } catch (error) {
        console.error('❌ [E-Arşiv] Fatura numarası üretilirken hata:', error);
      }
    }

    // Durum kontrolü (tekrar gönderim engeli)
    if (!forceResend) {
      console.log('🔍 [E-Arşiv] Mevcut fatura durumu kontrol ediliyor...');
      
      try {
        const statusResponse = await fetch(
          `${supabaseUrl}/functions/v1/veriban-invoice-status`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({
              invoiceId: invoiceId,
              invoiceNumber: invoiceNumber
            })
          }
        );

        const statusData = await statusResponse.json();
        
        if (statusData?.success && statusData.status) {
          const stateCode = statusData.status.einvoice_invoice_state;
          
          if (stateCode === 5) {
            console.log('⛔ [E-Arşiv] Fatura zaten başarıyla gönderilmiş');
            
            return new Response(JSON.stringify({
              success: false,
              error: 'Bu E-Arşiv fatura zaten başarıyla gönderilmiş.',
              needsConfirmation: false,
              currentStatus: statusData.status
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (statusError) {
        console.warn('⚠️ [E-Arşiv] Durum kontrolü hatası:', statusError);
      }
    }

    // UBL XML oluştur
    let finalXmlContent = xmlContent;
    let ettn = invoice.xml_data?.ettn || '';
    
    if (!finalXmlContent) {
      console.log('📝 [E-Arşiv] UBL XML oluşturuluyor...');
      
      const ublResult = generateUBLTRXML(invoice, invoice.companies, invoice.customers, invoice.sales_invoice_items);
      
      if (!ublResult.success || !ublResult.xml) {
        return new Response(JSON.stringify({
          success: false,
          error: ublResult.error || 'UBL XML oluşturulamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      finalXmlContent = ublResult.xml;
      ettn = ublResult.ettn || '';
      
      console.log('✅ [E-Arşiv] UBL XML oluşturuldu, ETTN:', ettn);
    }

    // Customer alias belirle
    let finalCustomerAlias = customerAlias || '';
    if (!finalCustomerAlias && invoice.customers) {
      finalCustomerAlias = invoice.customers.einvoice_alias_name || 'urn:mail:defaultgb@vfrwsrvc.fitbulut.com';
    }

    // Login to Veriban
    console.log('🔐 [E-Arşiv] Veriban girişi yapılıyor...');
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      console.error('❌ [E-Arşiv] Veriban login başarısız:', loginResult.error);
      
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: loginResult.error || 'Veriban giriş başarısız',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = loginResult.sessionCode;
    console.log('✅ [E-Arşiv] Veriban login başarılı');

    try {
      // Create ZIP file from XML content
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      const xmlFileName = `${ettn}.xml`;
      zip.file(xmlFileName, finalXmlContent, { createFolders: false, date: new Date() });

      const zipBlob = await zip.generateAsync({ 
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        streamFiles: false,
        platform: 'DOS',
      });

      const base64Zip = VeribanSoapClient.encodeBase64(zipBlob);
      const md5Hash = await VeribanSoapClient.calculateMD5Async(zipBlob);

      console.log('📦 [E-Arşiv] ZIP dosyası oluşturuldu');
      console.log('📦 [E-Arşiv] ZIP boyutu:', zipBlob.length, 'bytes');
      console.log('🔐 [E-Arşiv] MD5 Hash:', md5Hash);

      const zipFileName = `${xmlFileName}.zip`;
      const finalIntegrationCode = integrationCode || invoice.id;

      // E-Arşiv Transfer parametreleri
      const eArchiveParams: EArchiveTransferParams = {
        fileName: zipFileName,
        fileDataType: 'XML_INZIP',
        binaryData: base64Zip,
        binaryDataHash: md5Hash,
        customerAlias: finalCustomerAlias,
        isDirectSend: isDirectSend,
        integrationCode: finalIntegrationCode,
        // E-Arşiv özel parametreleri
        invoiceTransportationType: invoiceTransportationType,
        isInvoiceCreatedAtDelivery: isInvoiceCreatedAtDelivery,
        isInternetSalesInvoice: isInternetSalesInvoice,
        receiverMailAddresses: receiverMailAddresses,
      };

      console.log('📨 [E-Arşiv] TransferEArchiveInvoice çağrılıyor...');
      console.log('📋 [E-Arşiv] Parametreler:', {
        invoiceTransportationType,
        isInvoiceCreatedAtDelivery,
        isInternetSalesInvoice,
        receiverMailAddresses: receiverMailAddresses.join(', ') || '(yok)'
      });

      // E-Arşiv transfer fonksiyonunu çağır
      const transferResult = await VeribanSoapClient.transferEArchiveInvoice(
        sessionCode,
        eArchiveParams,
        veribanAuth.webservice_url
      );

      console.log('📋 [E-Arşiv] TransferResult:', JSON.stringify(transferResult, null, 2));

      if (!transferResult.success || !transferResult.data?.operationCompleted) {
        console.error('❌ [E-Arşiv] TransferEArchiveInvoice başarısız');
        
        let errorMessage = 'E-Arşiv belge gönderilemedi';
        if (transferResult.error) {
          errorMessage = transferResult.error;
        } else if (transferResult.data?.errorMessage) {
          errorMessage = transferResult.data.errorMessage;
        }

        await supabase
          .from('sales_invoices')
          .update({
            durum: 'iptal',
            einvoice_status: 'error',
            einvoice_error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        return new Response(JSON.stringify({
          success: false,
          error: errorMessage
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const transferFileUniqueId = transferResult.data?.transferFileUniqueId;
      let veribanInvoiceNumber = transferResult.data?.invoiceNumber || '';
      
      // Geçersiz değerleri filtrele
      const invalidValues = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'];
      if (veribanInvoiceNumber && invalidValues.includes(veribanInvoiceNumber.toUpperCase())) {
        veribanInvoiceNumber = '';
      }
      
      console.log('✅ [E-Arşiv] Belge başarıyla gönderildi');
      console.log('🆔 [E-Arşiv] Transfer File Unique ID:', transferFileUniqueId);
      console.log('📄 [E-Arşiv] Fatura Numarası:', veribanInvoiceNumber || invoice.fatura_no || '(henüz atanmadı)');

      // Update invoice in database
      const xmlDataUpdate: any = { 
        ...(invoice.xml_data || {}), 
        ettn, 
        integrationCode: finalIntegrationCode,
        invoiceTransportationType,
        isInternetSalesInvoice,
        receiverMailAddresses,
      };

      const updateData: any = {
        durum: 'gonderildi',
        einvoice_status: 'sent',
        nilvera_transfer_id: transferFileUniqueId,
        einvoice_transfer_state: 2,
        einvoice_sent_at: new Date().toISOString(),
        einvoice_xml_content: finalXmlContent,
        xml_data: xmlDataUpdate,
        updated_at: new Date().toISOString(),
      };

      // Fatura numarası yönetimi
      if (invoice.fatura_no) {
        xmlDataUpdate.veribanInvoiceNumber = invoice.fatura_no;
        if (veribanInvoiceNumber && veribanInvoiceNumber !== invoice.fatura_no) {
          xmlDataUpdate.veribanReturnedNumber = veribanInvoiceNumber;
        }
      } else if (veribanInvoiceNumber) {
        updateData.fatura_no = veribanInvoiceNumber;
        xmlDataUpdate.veribanInvoiceNumber = veribanInvoiceNumber;
      }

      await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      // outgoing_invoices ile ilişkilendirme
      try {
        const { data: outgoingInvoice } = await supabase
          .from('outgoing_invoices')
          .select('id')
          .eq('ettn', ettn)
          .eq('company_id', profile.company_id)
          .maybeSingle();

        if (outgoingInvoice) {
          await supabase
            .from('sales_invoices')
            .update({ outgoing_invoice_id: outgoingInvoice.id })
            .eq('id', invoiceId);
        } else {
          const { data: newOutgoingInvoice } = await supabase
            .from('outgoing_invoices')
            .insert({
              company_id: profile.company_id,
              invoice_number: invoice.fatura_no || veribanInvoiceNumber,
              invoice_date: invoice.fatura_tarihi,
              due_date: invoice.vade_tarihi,
              customer_name: invoice.customers?.name,
              customer_tax_number: invoice.customers?.tax_number,
              ettn: ettn,
              envelope_id: transferFileUniqueId,
              invoice_type: invoice.invoice_type,
              invoice_profile: 'EARSIVFATURA',
              currency: invoice.para_birimi,
              payable_amount: invoice.toplam_tutar,
              status: 'sent',
              elogo_status: 2,
              xml_content: finalXmlContent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sent_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (newOutgoingInvoice) {
            await supabase
              .from('sales_invoices')
              .update({ outgoing_invoice_id: newOutgoingInvoice.id })
              .eq('id', invoiceId);
          }
        }
      } catch (linkingError: any) {
        console.warn('⚠️ [E-Arşiv] İlişkilendirme hatası:', linkingError.message);
      }

      return new Response(JSON.stringify({
        success: true,
        transferFileUniqueId,
        ettn,
        integrationCode: finalIntegrationCode,
        invoiceNumber: invoice.fatura_no || veribanInvoiceNumber,
        invoiceProfile: 'EARSIVFATURA',
        message: `E-Arşiv fatura başarıyla gönderildi. Fatura No: ${invoice.fatura_no || veribanInvoiceNumber || '(henüz atanmadı)'}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      try {
        await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
        console.log('✅ [E-Arşiv] Veriban oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ [E-Arşiv] Logout hatası:', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ [E-Arşiv] Veriban send E-Archive invoice hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
