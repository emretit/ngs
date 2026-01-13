import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, EArchiveTransferParams } from '../_shared/veriban-soap-helper.ts';
import { generateEArchiveUBLTRXML } from '../_shared/ubl-generator.ts';

/**
 * Veriban E-Arşiv Fatura Gönderim Edge Function
 * 
 * E-Arşiv faturaları için özel parametreler:
 * - InvoiceTransportationType (ELEKTRONIK/KAGIT)
 * - IsInvoiceCreatedAtDelivery
 * - IsInternetSalesInvoice
 * - ReceiverMailTargetAddresses
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
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
      receiverMailAddresses = [],
      receiverGsmNo,
      invoiceTransportationType,
      isInvoiceCreatedAtDelivery,
      isInternetSalesInvoice,
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

    // Set default E-Archive parameters
    const finalTransportationType = invoiceTransportationType || 'ELEKTRONIK';
    const finalIsCreatedAtDelivery = isInvoiceCreatedAtDelivery !== undefined ? isInvoiceCreatedAtDelivery : false;
    const finalIsInternetSales = isInternetSalesInvoice !== undefined ? isInternetSalesInvoice : false;

    console.log('🚀 E-Arşiv fatura gönderimi:', invoiceId);

    // Get Veriban auth
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

    // E-Arşiv için özel webservice URL kullan
    // Eğer veriban_auth'ta earchive_webservice_url varsa onu kullan, yoksa varsayılan E-Arşiv URL'lerini kullan
    const isTestMode = veribanAuth.webservice_url?.includes('test') || false;
    const earchiveWebserviceUrl = (veribanAuth as any).earchive_webservice_url || 
      (isTestMode 
        ? 'http://earsivtransfertest.veriban.com.tr/IntegrationService.svc'
        : 'http://earsivtransfer.veriban.com.tr/IntegrationService.svc'
      );
    
    console.log('🌐 E-Arşiv Webservice URL:', earchiveWebserviceUrl);

    // Get invoice with related data
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

    // Generate invoice number if needed
    let invoiceNumber = invoice.fatura_no;
    const { data: formatParam } = await supabase
      .from('system_parameters')
      .select('parameter_value')
      .eq('parameter_key', 'earchive_invoice_number_format')
      .eq('company_id', profile.company_id)
      .maybeSingle();
    
    let earchiveSerie = formatParam?.parameter_value || 'EAR';
    earchiveSerie = earchiveSerie.trim().toUpperCase().substring(0, 3);
    if (!earchiveSerie || earchiveSerie.length !== 3) {
      earchiveSerie = 'EAR';
    }
    
    // Generate new invoice number if needed
    const needsNewNumber = !invoiceNumber || !invoiceNumber.startsWith(earchiveSerie);
    
    if (needsNewNumber) {
      console.log('📝 Fatura numarası üretiliyor...');
      
      try {
        const invoiceDate = invoice.fatura_tarihi ? new Date(invoice.fatura_tarihi) : new Date();
        const year = invoiceDate.getFullYear().toString();
        const prefix = `${earchiveSerie}${year}`;
        
        // Get max sequence from database
        const { data: existingInvoices } = await supabase
          .from('sales_invoices')
          .select('fatura_no')
          .eq('company_id', profile.company_id)
          .eq('invoice_profile', 'EARSIVFATURA')
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
        
        // Check Veriban API for latest invoice number
        if (veribanAuth?.is_active) {
          try {
            const loginResult = await VeribanSoapClient.login(
              { username: veribanAuth.username, password: veribanAuth.password },
              earchiveWebserviceUrl
            );
            
            if (loginResult.success && loginResult.sessionCode) {
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);
              
              const listResult = await VeribanSoapClient.getSalesInvoiceList(
                loginResult.sessionCode,
                {
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  pageIndex: 1,
                  pageSize: 20,
                },
                earchiveWebserviceUrl
              );
              
              if (listResult.success && listResult.data?.invoices) {
                for (const veribanInv of listResult.data.invoices.slice(0, 10)) {
                  try {
                    const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
                      loginResult.sessionCode,
                      veribanInv.invoiceUUID,
                      earchiveWebserviceUrl
                    );
                    
                    if (statusResult.success && statusResult.data?.invoiceNumber) {
                      const veribanInvoiceNumber = statusResult.data.invoiceNumber;
                      const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
                      
                      if (veribanInvoiceProfile === 'EARSIVFATURA' && 
                          veribanInvoiceNumber.startsWith(prefix) && 
                          veribanInvoiceNumber.length === 16) {
                        const sequencePart = veribanInvoiceNumber.substring(prefix.length);
                        const num = parseInt(sequencePart);
                        if (!isNaN(num) && num > maxSequence) {
                          maxSequence = num;
                        }
                      }
                    }
                  } catch (statusError) {
                    console.warn('⚠️ Fatura durum sorgusu hatası:', statusError);
                  }
                }
              }
              
              try {
                await VeribanSoapClient.logout(loginResult.sessionCode, earchiveWebserviceUrl);
              } catch (e) {
                // Ignore logout errors
              }
            }
          } catch (veribanError) {
            console.warn('⚠️ Veriban API kontrolü hatası:', veribanError);
          }
        }
        
        // Generate next invoice number
        const nextSequence = maxSequence + 1;
        const sequence = nextSequence.toString().padStart(9, '0');
        invoiceNumber = `${earchiveSerie}${year}${sequence}`;
        
        console.log('✅ Fatura numarası üretildi:', invoiceNumber);
        
        // Save invoice number
        await supabase
          .from('sales_invoices')
          .update({
            fatura_no: invoiceNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        
        invoice.fatura_no = invoiceNumber;
      } catch (error) {
        console.error('❌ Fatura numarası üretilirken hata:', error);
      }
    }

    // Check for duplicate send (unless forceResend)
    if (!forceResend && invoice.transfer_file_unique_id) {
      if (!['failed', 'cancelled'].includes(invoice.transfer_status || '')) {
        return new Response(JSON.stringify({
          success: false,
          error: `Bu E-Arşiv fatura zaten ${invoice.transfer_status || 'gönderilmiş'} durumunda.`,
          needsConfirmation: true,
          currentStatus: {
            transfer_file_unique_id: invoice.transfer_file_unique_id,
            transfer_status: invoice.transfer_status,
            gib_status: invoice.gib_status,
            last_check: invoice.last_status_check_at,
          },
          hint: 'Tekrar göndermek için forceResend: true parametresini kullanın.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate ETTN
    let ettn = invoice.xml_data?.ettn || '';
    if (!ettn) {
      ettn = crypto.randomUUID();
    }
    
    // Generate E-Archive UBL XML
    let finalXmlContent = xmlContent;
    if (!finalXmlContent) {
      try {
        finalXmlContent = generateEArchiveUBLTRXML(invoice, ettn);
        
        // ProfileID kontrolü
        const profileIdMatch = finalXmlContent.match(/<cbc:ProfileID[^>]*>(.*?)<\/cbc:ProfileID>/i);
        if (profileIdMatch) {
          console.log('🔍 ProfileID değeri:', profileIdMatch[1]);
        }
        
        // E-Arşiv XML validasyonu (sadece kritik elementler)
        if (!finalXmlContent.includes('cac:Signature')) {
          throw new Error('E-Arşiv XML\'inde VERİBAN mali mühür imzası eksik!');
        }
        if (!finalXmlContent.includes('AdditionalDocumentReference')) {
          throw new Error('E-Arşiv XML\'inde İrsaliye notu eksik!');
        }
        
        console.log('✅ E-Arşiv XML başarıyla oluşturuldu ve doğrulandı');
        console.log('📄 Üretilen XML ilk 2000 karakter:', finalXmlContent.substring(0, 2000));
      } catch (ublError) {
        console.error('❌ E-Arşiv UBL XML oluşturma hatası:', ublError);
        return new Response(JSON.stringify({
          success: false,
          error: `E-Arşiv UBL XML oluşturulamadı: ${ublError instanceof Error ? ublError.message : String(ublError)}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Extract ETTN from provided XML
      const ettnMatch = finalXmlContent.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
      if (ettnMatch) {
        ettn = ettnMatch[1].trim();
      }
    }

    // Determine customer alias
    let finalCustomerAlias = customerAlias || '';
    if (!finalCustomerAlias && invoice.customers) {
      finalCustomerAlias = invoice.customers.einvoice_alias_name || 'urn:mail:defaultgb@vfrwsrvc.fitbulut.com';
    }

    // Login to Veriban (E-Arşiv URL'i kullan)
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      earchiveWebserviceUrl
    );

    if (!loginResult.success || !loginResult.sessionCode) {
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

    try {
      // Create ZIP file from XML content
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      const xmlFileName = `${invoiceNumber}.xml`;
      
      // ProfileID kontrolü - ZIP'e eklemeden önce
      const profileIdInXml = finalXmlContent.match(/<cbc:ProfileID[^>]*>(.*?)<\/cbc:ProfileID>/i);
      if (profileIdInXml) {
        console.log('🔍 [ZIP ÖNCESİ] ProfileID değeri:', profileIdInXml[1]);
        console.log('🔍 [ZIP ÖNCESİ] ProfileID uzunluk:', profileIdInXml[1].length);
        // Deno'da Buffer yerine TextEncoder kullanıyoruz
        const encoder = new TextEncoder();
        const encoded = encoder.encode(profileIdInXml[1]);
        const hex = Array.from(encoded).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('🔍 [ZIP ÖNCESİ] ProfileID hex:', hex);
      }
      
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

      const zipFileName = `${invoiceNumber}.zip`;

      // E-Archive transfer parameters
      const eArchiveParams: EArchiveTransferParams = {
        fileName: zipFileName,
        fileDataType: 'XML_INZIP',
        binaryData: base64Zip,
        binaryDataHash: md5Hash,
        receiverMailAddresses: receiverMailAddresses && receiverMailAddresses.length > 0 ? receiverMailAddresses : undefined,
        receiverGsmNo: receiverGsmNo || undefined,
        invoiceTransportationType: finalTransportationType,
        isInvoiceCreatedAtDelivery: finalIsCreatedAtDelivery,
        isInternetSalesInvoice: finalIsInternetSales,
      };

      // Transfer E-Archive invoice (E-Arşiv URL'i kullan)
      const transferResult = await VeribanSoapClient.transferEArchiveInvoice(
        sessionCode,
        eArchiveParams,
        earchiveWebserviceUrl
      );

      if (!transferResult.success || !transferResult.data?.operationCompleted) {
        let errorMessage = 'E-Arşiv belge gönderilemedi';
        if (transferResult.error) {
          errorMessage = transferResult.error;
        } else if (transferResult.data?.errorMessage) {
          errorMessage = transferResult.data.errorMessage;
        }

        const retryCount = (invoice.transfer_retry_count || 0) + 1;
        const maxRetries = 3;

        const retryableErrors = [
          'timeout', 'network', 'connection', 'ECONNREFUSED', 'ETIMEDOUT',
          '5000', '5103',
        ];

        const shouldRetry = retryCount < maxRetries && 
                           retryableErrors.some(err => 
                             errorMessage.toLowerCase().includes(err.toLowerCase())
                           );

        const updateData: any = {
          einvoice_status: 'error',
          einvoice_error_message: errorMessage,
          updated_at: new Date().toISOString(),
          transfer_retry_count: retryCount,
          transfer_error_details: {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            transferResult: transferResult.data,
            retryCount,
            shouldRetry,
          },
        };

        if (shouldRetry) {
          updateData.transfer_status = 'pending';
          updateData.durum = 'taslak';
          const retryAfter = new Date(Date.now() + 5 * 60 * 1000);
          updateData.transfer_error_details.retryAfter = retryAfter.toISOString();
        } else {
          updateData.transfer_status = 'failed';
          updateData.durum = 'iptal';
        }

        await supabase
          .from('sales_invoices')
          .update(updateData)
          .eq('id', invoiceId);

        return new Response(JSON.stringify({
          success: false,
          error: errorMessage,
          canRetry: shouldRetry,
          retryCount,
          maxRetries,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const transferFileUniqueId = transferResult.data?.transferFileUniqueId;
      
      // Extract invoice number from XML
      let finalInvoiceNumber = '';
      const invoiceNumberMatch = finalXmlContent.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/i);
      if (invoiceNumberMatch && invoiceNumberMatch[1]) {
        finalInvoiceNumber = invoiceNumberMatch[1].trim();
      }
      
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = invoice.fatura_no || invoiceNumber;
      }

      // Update invoice in database
      const finalIntegrationCode = integrationCode || '';
      
      const xmlDataUpdate: any = { 
        ...(invoice.xml_data || {}), 
        ettn, 
        integrationCode: finalIntegrationCode,
        receiverMailAddresses: receiverMailAddresses && receiverMailAddresses.length > 0 ? receiverMailAddresses : undefined,
      };

      const updateData: any = {
        durum: 'gonderildi',
        einvoice_status: 'sent',
        nilvera_transfer_id: transferFileUniqueId,
        einvoice_transfer_state: 2,
        elogo_status: 2, // 2 = GİB'e gönderildi (İşlenmeyi bekliyor)
        einvoice_sent_at: new Date().toISOString(),
        einvoice_xml_content: finalXmlContent,
        xml_data: xmlDataUpdate,
        updated_at: new Date().toISOString(),
      };

      if (finalInvoiceNumber && !invoice.fatura_no) {
        updateData.fatura_no = finalInvoiceNumber;
      }
      xmlDataUpdate.veribanInvoiceNumber = finalInvoiceNumber;

      await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      // Link to outgoing_invoices
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
              invoice_number: finalInvoiceNumber,
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
        console.warn('⚠️ İlişkilendirme hatası:', linkingError.message);
      }

      return new Response(JSON.stringify({
        success: true,
        transferFileUniqueId,
        ettn,
        integrationCode: finalIntegrationCode,
        invoiceNumber: finalInvoiceNumber,
        invoiceProfile: 'EARSIVFATURA',
        message: `E-Arşiv fatura başarıyla gönderildi. Fatura No: ${finalInvoiceNumber}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      try {
        await VeribanSoapClient.logout(sessionCode, earchiveWebserviceUrl);
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası:', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban send E-Archive invoice hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
