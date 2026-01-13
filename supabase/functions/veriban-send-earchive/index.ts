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
      // E-Arşiv özel parametreleri - Veriban'ın varsayılan değerlerini kullanalım
      // invoiceTransportationType parametresini GÖNDERMİYORUZ (Veriban otomatik belirlesin)
      // isInvoiceCreatedAtDelivery = false,
      // isInternetSalesInvoice = false,
      receiverMailAddresses = [], // Alıcı mail adresleri (opsiyonel)
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

    // E-Arşiv için invoice_profile kontrolü (zaten müşteri seçiminde otomatik belirlenir)
    // Edge function'da profile ayarlamaya gerek yok - sadece kontrol edelim
    console.log('📋 [E-Arşiv] Mevcut invoice_profile:', invoice.invoice_profile || 'belirtilmemiş');

    // Fatura numarası üretimi (E-Arşiv için EAR seri kodu)
    let invoiceNumber = invoice.fatura_no;
    
    // E-Arşiv için seri kodu al (varsayılan EAR)
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
    
    // ⭐ KRİTİK: Fatura numarası yoksa VEYA E-Arşiv serisi ile başlamıyorsa yeni numara üret
    // Bu sayede FAT serili fatura E-Arşiv'e gönderilirken EAR serili numara alır
    const needsNewNumber = !invoiceNumber || !invoiceNumber.startsWith(earchiveSerie);
    
    if (needsNewNumber) {
      console.log('📝 [E-Arşiv] Fatura numarası üretiliyor...');
      console.log('📋 [E-Arşiv] Mevcut numara:', invoiceNumber || '(yok)');
      console.log('📋 [E-Arşiv] Beklenen seri:', earchiveSerie);
      
      try {
        const serie = earchiveSerie;
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
                      
                      // ⭐ ÖNEMLİ: Sadece E-Arşiv faturaları kontrol et
                      // E-Fatura ve E-Arşiv numaraları karışmamalı
                      if (veribanInvoiceProfile !== 'EARSIVFATURA') {
                        console.log('⏭️ [E-Arşiv] E-Arşiv değil, atlanıyor:', {
                          invoiceNumber: veribanInvoiceNumber,
                          profile: veribanInvoiceProfile,
                          expected: 'EARSIVFATURA'
                        });
                        continue;
                      }
                      
                      // GİB formatı kontrolü: 16 karakter ve prefix ile başlamalı
                      if (veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
                        const sequencePart = veribanInvoiceNumber.substring(prefix.length);
                        const num = parseInt(sequencePart);
                        if (!isNaN(num) && num > maxSequence) {
                          maxSequence = num;
                          console.log('✅ [E-Arşiv] Veriban\'dan daha yüksek numara bulundu:', {
                            invoiceNumber: veribanInvoiceNumber,
                            profile: veribanInvoiceProfile,
                            sequence: num,
                            prefix
                          });
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

    // ✅ Çift gönderim önleme mekanizması
    if (!forceResend) {
      console.log('🔍 [E-Arşiv] Çift gönderim kontrolü yapılıyor...');
      
      // 1) Transfer File Unique ID ile kontrol
      if (invoice.transfer_file_unique_id) {
        console.log('⚠️ [E-Arşiv] Bu fatura daha önce gönderilmiş!');
        console.log('📋 Transfer File ID:', invoice.transfer_file_unique_id);
        console.log('📋 Transfer Status:', invoice.transfer_status);
        
        // Sadece failed veya cancelled durumlarında tekrar gönderime izin ver
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
        } else {
          console.log('✅ [E-Arşiv] Fatura failed/cancelled durumunda, yeniden gönderiliyor...');
        }
      }
      
      // 2) Veriban API'sinden durum kontrolü
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
            console.log('⛔ [E-Arşiv] Fatura zaten GİB\'de başarılı durumda');
            
            return new Response(JSON.stringify({
              success: false,
              error: 'Bu E-Arşiv fatura zaten GİB\'e başarıyla gönderilmiş.',
              needsConfirmation: false,
              currentStatus: statusData.status
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (statusError) {
        console.warn('⚠️ [E-Arşiv] API durum kontrolü hatası:', statusError);
      }
    } else {
      console.log('🔄 [E-Arşiv] forceResend=true, kontroller atlanıyor...');
    }

    // UBL XML oluştur
    let finalXmlContent = xmlContent;
    
    // ⭐ KRİTİK FİX: ETTN'i ÖNCE oluştur, SONRA XML'e yaz
    let ettn = invoice.xml_data?.ettn || '';
    if (!ettn) {
      ettn = crypto.randomUUID();
      console.log('🆔 [E-Arşiv] Yeni ETTN oluşturuldu:', ettn);
    } else {
      console.log('🆔 [E-Arşiv] Mevcut ETTN kullanılıyor:', ettn);
    }
    
    if (!finalXmlContent) {
      console.log('📝 [E-Arşiv] UBL XML oluşturuluyor...');
      
      try {
        // ⭐ ETTN'i XML'e yaz (artık boş değil!)
        finalXmlContent = generateUBLTRXML(invoice, ettn);
        
        console.log('✅ [E-Arşiv] UBL XML oluşturuldu, ETTN:', ettn);
      } catch (ublError) {
        console.error('❌ [E-Arşiv] UBL XML oluşturma hatası:', ublError);
        return new Response(JSON.stringify({
          success: false,
          error: `UBL XML oluşturulamadı: ${ublError instanceof Error ? ublError.message : String(ublError)}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // XML içeriği sağlanmışsa, ETTN'i XML'den çıkar
      const ettnMatch = finalXmlContent.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
      if (ettnMatch) {
        ettn = ettnMatch[1].trim();
        console.log('🆔 [E-Arşiv] XML\'den ETTN çıkarıldı:', ettn);
      }
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
      console.log('📄 [E-Arşiv] ZIP içindeki XML dosya adı:', xmlFileName);
      console.log('📦 [E-Arşiv] ZIP boyutu:', zipBlob.length, 'bytes');
      console.log('🔐 [E-Arşiv] MD5 Hash:', md5Hash);
      console.log('📄 [E-Arşiv] XML içeriği (ilk 500 karakter):', finalXmlContent.substring(0, 500));
      console.log('📄 [E-Arşiv] XML içinde ProfileID:', finalXmlContent.match(/<cbc:ProfileID>(.*?)<\/cbc:ProfileID>/)?.[1] || 'BULUNAMADI');
      console.log('📄 [E-Arşiv] XML içinde UUID:', finalXmlContent.match(/<cbc:UUID>(.*?)<\/cbc:UUID>/)?.[1] || 'BULUNAMADI');
      console.log('📄 [E-Arşiv] XML içinde ID (fatura no):', finalXmlContent.match(/<cbc:ID>(.*?)<\/cbc:ID>/)?.[1] || 'BULUNAMADI');

      // ⭐ KRİTİK: ZIP dosya adı = ETTN.zip (içindeki XML adı ETTN.xml olmalı)
      // Veriban kuralı: ZIP dosya adı ile içindeki XML dosya adı aynı olmalı (sadece uzantı farklı)
      const zipFileName = `${ettn}.zip`;

      // E-Arşiv Transfer parametreleri
      // NOT: Minimum parametrelerle gönderiyoruz, Veriban varsayılan değerleri kullansın
      // CustomerAlias, IsDirectSend, IntegrationCode E-Arşiv için kullanılmıyor
      // InvoiceTransportationType, IsInvoiceCreatedAtDelivery, IsInternetSalesInvoice GÖNDERİLMİYOR
      const eArchiveParams: EArchiveTransferParams = {
        fileName: zipFileName,
        fileDataType: 'XML_INZIP',  // ✅ String olarak gönder, helper içinde enum'a çevrilecek
        binaryData: base64Zip,
        binaryDataHash: md5Hash,
        // ❌ Tüm opsiyonel parametreler ÇIKARILDI - Veriban varsayılan değerleri kullansın
        receiverMailAddresses: receiverMailAddresses && receiverMailAddresses.length > 0 ? receiverMailAddresses : undefined,
      };

      console.log('📨 [E-Arşiv] TransferEArchiveInvoice çağrılıyor...');
      console.log('📋 [E-Arşiv] Parametreler:', {
        fileDataType: 'XML_INZIP',
        receiverMailAddresses: receiverMailAddresses && receiverMailAddresses.length > 0 ? receiverMailAddresses.join(', ') : '(yok)',
        note: 'Diğer parametreler gönderilmiyor - Veriban varsayılanları kullanacak'
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

        const retryCount = (invoice.transfer_retry_count || 0) + 1;
        const maxRetries = 3;

        // ✅ Retry mekanizması: Belirli hatalarda otomatik yeniden deneme
        const retryableErrors = [
          'timeout',
          'network',
          'connection',
          'ECONNREFUSED',
          'ETIMEDOUT',
          '5000', // Sistem hatası
          '5103', // Kuyruk ekleme hatası
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
          // Geçici hata - retry edilebilir
          updateData.transfer_status = 'pending'; // Tekrar denenebilir
          updateData.durum = 'taslak'; // Taslak olarak kalsın
          console.log(`⚠️ [E-Arşiv] Geçici hata, retry edilebilir (${retryCount}/${maxRetries})`);
          
          // 5 dakika sonra otomatik retry için işaretle
          const retryAfter = new Date(Date.now() + 5 * 60 * 1000);
          updateData.transfer_error_details.retryAfter = retryAfter.toISOString();
        } else {
          // Kalıcı hata veya max retry aşıldı
          updateData.transfer_status = 'failed';
          updateData.durum = 'iptal';
          console.log(`❌ [E-Arşiv] Kalıcı hata veya max retry aşıldı (${retryCount}/${maxRetries})`);
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
      
      // ⭐ KRİTİK FİX: E-Arşiv için fatura numarasını doğru yerden al
      // Veriban E-Arşiv response'unda InvoiceNumber alanı YOK!
      // Fatura numarası bizim gönderdiğimiz XML'de var
      
      // 1) Önce XML'den parse et (en güvenilir kaynak)
      let finalInvoiceNumber = '';
      const invoiceNumberMatch = finalXmlContent.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/i);
      if (invoiceNumberMatch && invoiceNumberMatch[1]) {
        finalInvoiceNumber = invoiceNumberMatch[1].trim();
        console.log('✅ [E-Arşiv] Fatura numarası XML\'den alındı:', finalInvoiceNumber);
      }
      
      // 2) XML'de bulunamadıysa, veritabanındaki numarayı kullan
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = invoice.fatura_no || invoiceNumber;
        console.log('⚠️ [E-Arşiv] Fatura numarası XML\'de bulunamadı, veritabanından alındı:', finalInvoiceNumber);
      }
      
      console.log('✅ [E-Arşiv] Belge başarıyla gönderildi');
      console.log('🆔 [E-Arşiv] Transfer File Unique ID:', transferFileUniqueId);
      console.log('📄 [E-Arşiv] Fatura Numarası:', finalInvoiceNumber);
      console.log('📄 [E-Arşiv] ETTN:', ettn);

      // Update invoice in database
      // ⚠️ E-Arşiv için integrationCode genelde kullanılmaz, ama kaydedelim
      const finalIntegrationCode = integrationCode || '';
      
      const xmlDataUpdate: any = { 
        ...(invoice.xml_data || {}), 
        ettn, 
        integrationCode: finalIntegrationCode,
        // invoiceTransportationType, isInternetSalesInvoice parametreleri GÖNDERİLMEDİ
        receiverMailAddresses: receiverMailAddresses && receiverMailAddresses.length > 0 ? receiverMailAddresses : undefined,
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
        // ✅ Yeni tracking alanları
        transfer_file_unique_id: transferFileUniqueId,
        transfer_status: 'queued', // Kuyruğa eklendi
        last_status_check_at: new Date().toISOString(),
        transfer_error_details: null, // Hata yok
      };

      // Fatura numarası yönetimi
      // ⭐ E-Arşiv için: finalInvoiceNumber bizim ürettiğimiz numara
      if (finalInvoiceNumber) {
        // Veritabanında henüz fatura_no yoksa, finalInvoiceNumber'ı kaydet
        if (!invoice.fatura_no) {
          updateData.fatura_no = finalInvoiceNumber;
        }
        xmlDataUpdate.veribanInvoiceNumber = finalInvoiceNumber;
        
        // Eğer Veriban gerçekten bir numara döndürdüyse (nadiren olur), onu da kaydet
        if (veribanInvoiceNumber && veribanInvoiceNumber !== finalInvoiceNumber) {
          xmlDataUpdate.veribanReturnedNumber = veribanInvoiceNumber;
        }
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
              invoice_number: finalInvoiceNumber, // ⭐ finalInvoiceNumber kullan
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
        invoiceNumber: finalInvoiceNumber, // ⭐ finalInvoiceNumber kullan
        invoiceProfile: 'EARSIVFATURA',
        message: `E-Arşiv fatura başarıyla gönderildi. Fatura No: ${finalInvoiceNumber}`
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
