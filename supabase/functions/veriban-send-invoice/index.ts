import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';
import { generateUBLTRXML } from '../_shared/ubl-generator.ts';

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

    // Parse request body first to get invoiceId
    const {
      invoiceId,
      xmlContent, // Optional - if not provided, will be generated
      customerAlias,
      isDirectSend = true,
      integrationCode,
      forceResend = false, // YENİ: Kullanıcı onayı ile zorla tekrar gönder
      skipStatusCheck = false, // YENİ: Durum kontrolünü atla (opsiyonel, debug için)
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

    // Get Veriban auth settings
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      // Update invoice status to error
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 Veriban fatura gönderimi başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);

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

    // 🆕 OTOMATİK INVOICE_PROFILE SEÇİMİ
    // Müşteri mükellef durumuna göre otomatik olarak e-fatura veya e-arşiv seç
    let finalInvoiceProfile = invoice.invoice_profile;
    
    if (!finalInvoiceProfile) {
      // Eğer invoice_profile boşsa, müşteri durumuna göre otomatik belirle
      if (invoice.customers?.is_einvoice_mukellef) {
        // Müşteri e-fatura mükellefi ise TEMELFATURA
        finalInvoiceProfile = 'TEMELFATURA';
        console.log('✅ [Auto] Müşteri e-fatura mükellefi -> TEMELFATURA seçildi');
      } else {
        // Müşteri e-fatura mükellefi değilse EARSIVFATURA
        finalInvoiceProfile = 'EARSIVFATURA';
        console.log('✅ [Auto] Müşteri e-fatura mükellefi DEĞİL -> EARSIVFATURA seçildi');
      }
      
      // Otomatik seçilen profili veritabanına kaydet
      await supabase
        .from('sales_invoices')
        .update({
          invoice_profile: finalInvoiceProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
        
      console.log(`📋 invoice_profile otomatik olarak '${finalInvoiceProfile}' olarak ayarlandı`);
    } else {
      console.log(`📋 Mevcut invoice_profile kullanılıyor: ${finalInvoiceProfile}`);
    }
    
    // Invoice objesini güncelle
    invoice.invoice_profile = finalInvoiceProfile;

    // Fatura numarası yoksa Veriban formatına göre üret
    let invoiceNumber = invoice.fatura_no;
    if (!invoiceNumber) {
      console.log('📝 Fatura numarası bulunamadı, Veriban formatına göre üretiliyor...');
      
      try {
        // 🆕 E-Arşiv veya E-Fatura formatına göre seri kodu seç
        let formatKey = 'veriban_invoice_number_format'; // Varsayılan: E-Fatura
        
        if (finalInvoiceProfile === 'EARSIVFATURA') {
          formatKey = 'earchive_invoice_number_format'; // E-Arşiv için özel format
          console.log('📋 E-Arşiv fatura için özel seri numarası formatı kullanılacak');
        }
        
        // System parameters'dan seri kodunu al
        const { data: formatParam } = await supabase
          .from('system_parameters')
          .select('parameter_value')
          .eq('parameter_key', formatKey)
          .eq('company_id', profile.company_id)
          .maybeSingle();
        
        // Seri kodu (3 karakter, örn: FAT)
        let serie = formatParam?.parameter_value || 'FAT';
        serie = serie.trim().toUpperCase().substring(0, 3);
        
        if (!serie || serie.length !== 3) {
          serie = 'FAT'; // Varsayılan seri
        }
        
        console.log('📋 Seri Kodu:', serie);
        
        // Yıl
        const invoiceDate = invoice.fatura_tarihi ? new Date(invoice.fatura_tarihi) : new Date();
        const year = invoiceDate.getFullYear().toString();
        const prefix = `${serie}${year}`;
        
        // Veritabanından bu prefix ile başlayan en yüksek numarayı bul
        const { data: existingInvoices } = await supabase
          .from('sales_invoices')
          .select('fatura_no')
          .eq('company_id', profile.company_id)
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
        
        // Veriban entegrasyonu aktifse, Veriban API'sinden son fatura numarasını al
        if (veribanAuth?.is_active) {
          try {
            console.log('🔍 Veriban API\'sinden son fatura numarası kontrol ediliyor...');
            
            // Veriban'a login ol
            const loginResult = await VeribanSoapClient.login(
              {
                username: veribanAuth.username,
                password: veribanAuth.password,
              },
              veribanAuth.webservice_url
            );
            
            if (!loginResult.success || !loginResult.sessionCode) {
              console.warn('⚠️ Veriban login başarısız, sadece veritabanı kontrolü yapılacak');
            } else {
              const sessionCode = loginResult.sessionCode;
              console.log('✅ Veriban session code alındı');
              
              // Son 30 günün faturalarını al (Veriban'dan)
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);
              
              const formattedStartDate = startDate.toISOString().split('T')[0];
              const formattedEndDate = endDate.toISOString().split('T')[0];
              
              // Veriban'dan son faturaların UUID listesini al
              const listResult = await VeribanSoapClient.getSalesInvoiceList(
                sessionCode,
                {
                  startDate: formattedStartDate,
                  endDate: formattedEndDate,
                  pageIndex: 1,
                  pageSize: 20, // Son 20 faturayı kontrol et (performans için)
                },
                veribanAuth.webservice_url
              );
              
              if (listResult.success && listResult.data?.invoices) {
                console.log(`📊 Veriban'dan ${listResult.data.invoices.length} fatura UUID'si alındı`);
                
                // Her fatura için durum sorgusu yaparak fatura numarasını al
                // Sadece ilk 10 faturayı kontrol et (performans için)
                const invoicesToCheck = listResult.data.invoices.slice(0, 10);
                
                for (const veribanInv of invoicesToCheck) {
                  try {
                    // Fatura durumunu sorgula (bu fatura numarasını da döndürür)
                    const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
                      sessionCode,
                      veribanInv.invoiceUUID,
                      veribanAuth.webservice_url
                    );
                    
                    if (statusResult.success && statusResult.data?.invoiceNumber) {
                      const veribanInvoiceNumber = statusResult.data.invoiceNumber;
                      const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
                      
                      // ========================================
                      // ÖNEMLİ: InvoiceProfile kontrolü
                      // E-Arşiv ve E-Fatura numaralarını ayrı tut
                      // ========================================
                      const isMatchingProfile = 
                        (finalInvoiceProfile === 'EARSIVFATURA' && veribanInvoiceProfile === 'EARSIVFATURA') ||
                        (finalInvoiceProfile !== 'EARSIVFATURA' && veribanInvoiceProfile !== 'EARSIVFATURA');
                      
                      if (!isMatchingProfile) {
                        console.log('⏭️ Profile eşleşmiyor, atlaniyor:', {
                          targetProfile: finalInvoiceProfile,
                          foundProfile: veribanInvoiceProfile,
                          invoiceNumber: veribanInvoiceNumber
                        });
                        continue; // Bu faturayı atla
                      }
                      
                      // GİB formatı kontrolü: 16 karakter ve prefix ile başlamalı
                      if (veribanInvoiceNumber && veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
                        const sequencePart = veribanInvoiceNumber.substring(prefix.length);
                        const num = parseInt(sequencePart);
                        if (!isNaN(num) && num > maxSequence) {
                          maxSequence = num;
                          console.log('✅ Veriban API\'sinden daha yüksek numara bulundu:', {
                            invoiceNumber: veribanInvoiceNumber,
                            profile: veribanInvoiceProfile,
                            sequence: num
                          });
                        }
                      }
                    }
                  } catch (statusError) {
                    // Bir fatura için hata olsa bile devam et
                    console.warn('⚠️ Fatura durum sorgusu hatası (devam ediliyor):', statusError);
                  }
                }
              } else {
                console.warn('⚠️ Veriban API\'sinden fatura listesi alınamadı:', listResult.error);
              }
              
              // Logout
              try {
                await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
              } catch (logoutError) {
                // Logout hatası önemli değil
                console.warn('⚠️ Veriban logout hatası (önemsiz):', logoutError);
              }
            }
          } catch (veribanError) {
            console.warn('⚠️ Veriban API kontrolü sırasında hata (devam ediliyor):', veribanError);
            // Hata olsa bile devam et, veritabanı kontrolü yeterli
          }
        }
        
        // Bir sonraki numarayı üret
        const nextSequence = maxSequence + 1;
        const sequence = nextSequence.toString().padStart(9, '0');
        invoiceNumber = `${serie}${year}${sequence}`;
        
        console.log('✅ Fatura numarası üretildi:', invoiceNumber);
        
        // Fatura numarasını veritabanına kaydet
        await supabase
          .from('sales_invoices')
          .update({
            fatura_no: invoiceNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        
        // Invoice objesini güncelle
        invoice.fatura_no = invoiceNumber;
      } catch (error) {
        console.error('❌ Fatura numarası üretilirken hata:', error);
        // Hata olsa bile devam et, UBL generator geçici numara üretebilir
      }
    } else {
      console.log('✅ Mevcut fatura numarası kullanılıyor:', invoiceNumber);
    }

    // ==========================================
    // DURUM KONTROLÜ: Fatura zaten gönderilmiş mi?
    // ==========================================
    if (!forceResend && !skipStatusCheck) {
      console.log('🔍 Fatura durumu kontrol ediliyor...');
      
      try {
        // veriban-invoice-status fonksiyonunu çağır
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
          const stateName = statusData.status.stateName || 'Bilinmiyor';
          const userFriendlyStatus = statusData.status.userFriendlyStatus || stateName;
          
          console.log('📊 Mevcut fatura durumu:', {
            stateCode,
            stateName,
            userFriendlyStatus
          });
          
          // StateCode 5: Başarılı - Faturayı tekrar gönderme
          if (stateCode === 5) {
            console.log('⛔ Fatura zaten başarıyla gönderilmiş, tekrar gönderilmeyecek');
            
            // Veritabanını güncelle
            await supabase
              .from('sales_invoices')
              .update({
                einvoice_invoice_state: 5,
                einvoice_status: 'delivered',
                einvoice_delivered_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', invoiceId);
            
            return new Response(JSON.stringify({
              success: false,
              error: 'Bu fatura zaten başarıyla gönderilmiş ve alıcıya ulaşmış. Tekrar gönderilemez.',
              needsConfirmation: false,
              currentStatus: {
                stateCode: 5,
                stateName: stateName,
                userFriendlyStatus: userFriendlyStatus
              }
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // StateCode 1,2,3,4: Taslak/İşleniyor/Hatalı - Kullanıcı onayı gerekli
          if ([1, 2, 3, 4].includes(stateCode)) {
            console.log('⚠️ Fatura zaten işlem görmüş, kullanıcı onayı gerekli');
            
            const statusMessages: Record<number, string> = {
              1: 'Bu fatura taslak durumda.',
              2: 'Bu fatura imza bekliyor.',
              3: 'Bu fatura işleniyor.',
              4: 'Bu fatura hatalı durumda.'
            };
            
            const message = statusMessages[stateCode] || 'Bu fatura zaten işlem görmüş.';
            
            return new Response(JSON.stringify({
              success: false,
              error: `${message} Tekrar göndermek için onay gerekli.`,
              needsConfirmation: true,
              currentStatus: {
                stateCode: stateCode,
                stateName: stateName,
                userFriendlyStatus: userFriendlyStatus
              }
            }), {
              status: 409, // Conflict
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // StateCode 0 veya bilinmiyor: Normal akış devam eder
          console.log('✅ Durum kontrolü geçti, gönderim işlemine devam ediliyor');
        }
      } catch (statusError) {
        // Durum sorgulama hatası olsa bile gönderimi engelleme
        console.warn('⚠️ Durum sorgulama hatası (gönderime devam ediliyor):', statusError);
      }
    } else if (forceResend) {
      console.log('🔄 forceResend=true, durum kontrolü atlandı');
    } else if (skipStatusCheck) {
      console.log('⏭️ skipStatusCheck=true, durum kontrolü atlandı');
    }

    // Update status to "sending" at the start
    await supabase
      .from('sales_invoices')
      .update({
        einvoice_status: 'sending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);
    
    console.log('📤 Fatura durumu "gönderiliyor" olarak güncellendi');

    // Validate required data
    if (!invoice.companies?.tax_number) {
      // Update invoice status to error
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: 'Şirket vergi numarası bulunamadı. Lütfen şirket bilgilerini tamamlayın.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Şirket vergi numarası bulunamadı. Lütfen şirket bilgilerini tamamlayın.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!invoice.customers?.tax_number) {
      // Update invoice status to error
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: 'Müşteri vergi numarası bulunamadı. Lütfen müşteri bilgilerini tamamlayın.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Müşteri vergi numarası bulunamadı. Lütfen müşteri bilgilerini tamamlayın.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate XML if not provided
    let finalXmlContent = xmlContent;
    let ettn: string;

    if (!finalXmlContent) {
      console.log('📝 UBL-TR XML oluşturuluyor...');
      
      // Extract ETTN from existing data if available
      if (invoice.xml_data && invoice.xml_data.ettn) {
        ettn = invoice.xml_data.ettn;
      } else if (invoice.einvoice_xml_content) {
        const ettnMatch = invoice.einvoice_xml_content.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
        if (ettnMatch) {
          ettn = ettnMatch[1].trim();
        } else {
          ettn = generateETTN();
        }
      } else {
        ettn = generateETTN();
      }

      // Generate UBL-TR XML
      finalXmlContent = generateUBLTRXML(invoice, ettn);
      
      console.log('✅ UBL-TR XML oluşturuldu');
      console.log('🆔 ETTN:', ettn);

      // Save XML content and ETTN to database
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_xml_content: finalXmlContent,
          xml_data: { ...(invoice.xml_data || {}), ettn },
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    } else {
      // Extract ETTN from provided XML
      const ettnMatch = finalXmlContent.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
      if (ettnMatch) {
        ettn = ettnMatch[1].trim();
      } else {
        ettn = invoice.id;
      }
    }

    // Determine customer alias
    let finalCustomerAlias = customerAlias || '';
    if (!finalCustomerAlias && invoice.customers?.is_einvoice_mukellef) {
      finalCustomerAlias = invoice.customers?.einvoice_alias_name || '';
      if (finalCustomerAlias === 'undefined' || finalCustomerAlias === 'null') {
        finalCustomerAlias = '';
      }
    }

    // Helper function to generate ETTN
    function generateETTN(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
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
      
      // Update invoice status to error
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
    console.log('✅ Veriban login başarılı, sessionCode alındı');

    try {
      // Create ZIP file from XML content
      // Veriban dokümanına göre: UBL-TR formatında XML dosyası ZIP formatına çevrilmeli
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      // Add XML to zip
      // ZIP içindeki XML dosya adı: ETTN.xml formatında
      // Örnek: 976b9ccc-c5c0-4b2b-9a06-a467fb499877.xml
      const xmlFileName = `${ettn}.xml`;
      
      // XML içeriğini UTF-8 encoding ile ekle (BOM olmadan)
      // Veriban UTF-8 encoding bekliyor
      zip.file(xmlFileName, finalXmlContent, {
        createFolders: false, // Klasör oluşturma
        date: new Date(), // Mevcut tarih
      });

      // Generate ZIP
      // Veriban standart ZIP formatı bekliyor (DEFLATE compression)
      const zipBlob = await zip.generateAsync({ 
        type: 'uint8array',
        compression: 'DEFLATE', // Standart ZIP compression
        compressionOptions: { 
          level: 6 // Orta seviye compression (1-9 arası, 6 optimal)
        },
        streamFiles: false, // Tüm dosyalar bellekte
        platform: 'DOS', // DOS platform (Windows uyumlu)
      });

      // Convert to Base64
      const base64Zip = VeribanSoapClient.encodeBase64(zipBlob);

      // Calculate MD5 hash
      const md5Hash = await VeribanSoapClient.calculateMD5Async(zipBlob);

      console.log('📦 ZIP dosyası oluşturuldu');
      console.log('📄 XML dosya adı:', xmlFileName);
      console.log('📦 ZIP boyutu:', zipBlob.length, 'bytes');
      console.log('🔐 MD5 Hash:', md5Hash);

      // ZIP dosya adı: Veriban dokümanına göre FileNameWithExtension
      // Format: ETTN.xml.zip (ZIP içindeki XML dosya adı + .zip uzantısı)
      // Alternatif olarak sadece ETTN.zip de kullanılabilir ama dokümanlarda açık değil
      // Mevcut format: ETTN.xml.zip (örn: 976b9ccc-c5c0-4b2b-9a06-a467fb499877.xml.zip)
      const zipFileName = `${xmlFileName}.zip`;

      // Transfer Sales Invoice File
      console.log('📨 TransferSalesInvoiceFile çağrılıyor...');

      // Generate integration code if not provided (use invoice ID)
      const finalIntegrationCode = integrationCode || invoice.id;

      // Dokümantasyona göre FileDataType değerleri:
      // XML_INZIP, TXT_INZIP, CSV_INZIP, XLS_INZIP
      // Veriban SOAP enum bekliyor, enum adı olarak gönderiyoruz (sayısal değil!)
      const transferResult = await VeribanSoapClient.transferSalesInvoice(
        sessionCode,
        {
          fileName: zipFileName,
          fileDataType: 'XML_INZIP', // Enum adı olarak gönderilmeli (0 değil!)
          binaryData: base64Zip,
          binaryDataHash: md5Hash,
          customerAlias: finalCustomerAlias,
          isDirectSend: isDirectSend,
          integrationCode: finalIntegrationCode,
        },
        veribanAuth.webservice_url
      );

      console.log('📋 TransferResult tam detay:', JSON.stringify(transferResult, null, 2));
      console.log('📋 TransferResult.success:', transferResult.success);
      console.log('📋 TransferResult.data:', JSON.stringify(transferResult.data, null, 2));
      console.log('📋 TransferResult.error:', transferResult.error);

      if (!transferResult.success || !transferResult.data?.operationCompleted) {
        console.error('❌ TransferSalesInvoiceFile başarısız');
        console.error('❌ TransferResult tam objesi:', JSON.stringify(transferResult, null, 2));
        
        // Extract detailed error message
        let errorMessage = 'Belge gönderilemedi';
        if (transferResult.error) {
          errorMessage = transferResult.error;
        } else if (transferResult.data?.errorMessage) {
          errorMessage = transferResult.data.errorMessage;
        } else if (transferResult.data?.message) {
          errorMessage = transferResult.data.message;
        } else if (transferResult.data && typeof transferResult.data === 'string') {
          errorMessage = transferResult.data;
        } else if (transferResult.data) {
          // Try to find any error field in the data object
          const dataStr = JSON.stringify(transferResult.data);
          if (dataStr.includes('error') || dataStr.includes('Error') || dataStr.includes('hata')) {
            errorMessage = `Veriban hatası: ${dataStr}`;
          }
        }

        console.error('❌ Detaylı hata mesajı:', errorMessage);

        // Update invoice status to failed
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
      
      // Mevcut fatura numarasını logla
      console.log('📋 [Veriban Send] Fatura numarası bilgileri:', {
        mevcutFaturaNo: invoice.fatura_no || '(yok)',
        veribanDondurdu: veribanInvoiceNumber || '(henüz atanmadı)',
        invoiceId: invoice.id
      });
      
      // Geçersiz değerleri filtrele (DOKUMAN, TASLAK, vb. gibi)
      const invalidValues = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'];
      if (veribanInvoiceNumber && invalidValues.includes(veribanInvoiceNumber.toUpperCase())) {
        console.warn('⚠️ [Veriban Send] Geçersiz fatura numarası filtrelendi:', veribanInvoiceNumber);
        veribanInvoiceNumber = '';
      }
      
      console.log('✅ [Veriban Send] Belge başarıyla gönderildi');
      console.log('🆔 [Veriban Send] Transfer File Unique ID:', transferFileUniqueId);
      console.log('📄 [Veriban Send] Veriban Fatura Numarası:', veribanInvoiceNumber || '(henüz atanmadı)');

      // Update invoice in database
      const xmlDataUpdate: any = { 
        ...(invoice.xml_data || {}), 
        ettn, 
        integrationCode: finalIntegrationCode 
      };

      const updateData: any = {
        durum: 'gonderildi',
        einvoice_status: 'sent',
        nilvera_transfer_id: transferFileUniqueId, // Using nilvera_transfer_id field for Veriban transfer ID
        einvoice_transfer_state: 2, // İşlenmeyi bekliyor
        einvoice_sent_at: new Date().toISOString(),
        einvoice_xml_content: finalXmlContent, // Save generated XML
        xml_data: xmlDataUpdate,
        updated_at: new Date().toISOString(),
      };

      // 🆕 Fatura numarası yönetimi:
      // Öncelik: Bizim oluşturduğumuz numara > Veriban'dan dönen numara
      // Çünkü bizim numara invoice_profile'a göre doğru seri kodu kullanıyor (EAR/NGS)
      
      console.log('🔍 [Debug] Fatura numarası kontrolü:', {
        invoiceFaturaNo: invoice.fatura_no,
        veribanInvoiceNumber: veribanInvoiceNumber,
        invoiceProfile: finalInvoiceProfile
      });
      
      if (invoice.fatura_no) {
        // Bizim oluşturduğumuz fatura numarası varsa, onu koru
        console.log('✅ [Veriban Send] Mevcut fatura numarası korunuyor:', invoice.fatura_no);
        xmlDataUpdate.veribanInvoiceNumber = invoice.fatura_no;
        
        // Veriban'dan farklı bir numara döndüyse, onu da xml_data'ya kaydet (referans için)
        if (veribanInvoiceNumber && veribanInvoiceNumber !== invoice.fatura_no) {
          xmlDataUpdate.veribanReturnedNumber = veribanInvoiceNumber;
          console.log('ℹ️ [Veriban Send] Veriban farklı bir numara döndürdü (referans için kaydedildi):', veribanInvoiceNumber);
        }
      } else if (veribanInvoiceNumber) {
        // Bizim numara yoksa ama Veriban'dan numara döndüyse, onu kullan
        updateData.fatura_no = veribanInvoiceNumber;
        xmlDataUpdate.veribanInvoiceNumber = veribanInvoiceNumber;
        console.log('✅ [Veriban Send] Veriban fatura numarası kullanılıyor:', veribanInvoiceNumber);
      } else {
        // Hiçbir numara yoksa uyarı ver
        console.warn('⚠️ [Veriban Send] Ne bizim ne de Veriban\'dan fatura numarası var. Fatura henüz işlenmemiş olabilir.');
      }

      const { error: updateError } = await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (updateError) {
        console.error('❌ Veritabanı güncelleme hatası:', updateError);
      }

      // ============================================
      // İLİŞKİLENDİRME: outgoing_invoices ile bağla
      // ============================================
      console.log('🔗 outgoing_invoices ile ilişkilendirme yapılıyor...');
      console.log('🆔 ETTN:', ettn);
      
      try {
        // ETTN ile outgoing_invoices'da ara
        const { data: outgoingInvoice, error: outgoingError } = await supabase
          .from('outgoing_invoices')
          .select('id, invoice_number, status')
          .eq('ettn', ettn)
          .eq('company_id', profile.company_id)
          .maybeSingle();

        if (outgoingError) {
          console.warn('⚠️ outgoing_invoices sorgusu hatası:', outgoingError.message);
        } else if (outgoingInvoice) {
          console.log('✅ outgoing_invoices\'da eşleşme bulundu:', outgoingInvoice.invoice_number);
          
          // İlişkilendir
          const { error: linkError } = await supabase
            .from('sales_invoices')
            .update({ outgoing_invoice_id: outgoingInvoice.id })
            .eq('id', invoiceId);

          if (linkError) {
            console.error('❌ İlişkilendirme hatası:', linkError.message);
          } else {
            console.log('✅ sales_invoices ve outgoing_invoices ilişkilendirildi');
          }
        } else {
          console.log('ℹ️ outgoing_invoices\'da henüz kayıt yok, oluşturuluyor...');
          
          // outgoing_invoices'a kayıt ekle
          const outgoingInvoiceData = {
            company_id: profile.company_id,
            invoice_number: veribanInvoiceNumber || invoice.fatura_no,
            invoice_date: invoice.fatura_tarihi,
            due_date: invoice.vade_tarihi,
            customer_name: invoice.customers?.contact_name || invoice.customers?.company_name,
            customer_tax_number: invoice.customers?.tax_number,
            customer_tax_office: invoice.customers?.tax_office,
            ettn: ettn, // ← ETTN kaydediliyor
            envelope_id: transferFileUniqueId,
            invoice_type: invoice.invoice_type,
            invoice_profile: invoice.invoice_profile,
            currency: invoice.para_birimi,
            tax_exclusive_amount: invoice.ara_toplam - invoice.indirim_tutari,
            tax_total_amount: invoice.kdv_tutari,
            payable_amount: invoice.toplam_tutar,
            status: 'sent', // Gönderildi
            elogo_status: 2, // StateCode 2 = İmza bekliyor / GİB'e iletilmeyi bekliyor
            xml_content: finalXmlContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
          };
          
          const { data: newOutgoingInvoice, error: insertError } = await supabase
            .from('outgoing_invoices')
            .insert(outgoingInvoiceData)
            .select('id')
            .single();
          
          if (insertError) {
            console.error('❌ outgoing_invoices ekleme hatası:', insertError.message);
          } else if (newOutgoingInvoice) {
            console.log('✅ outgoing_invoices kaydı oluşturuldu:', newOutgoingInvoice.id);
            
            // İlişkilendir
            const { error: linkError } = await supabase
              .from('sales_invoices')
              .update({ outgoing_invoice_id: newOutgoingInvoice.id })
              .eq('id', invoiceId);
            
            if (linkError) {
              console.error('❌ İlişkilendirme hatası:', linkError.message);
            } else {
              console.log('✅ sales_invoices ve outgoing_invoices ilişkilendirildi');
            }
          }
        }
      } catch (linkingError: any) {
        // İlişkilendirme hatası olsa bile fatura gönderimi başarılı
        console.warn('⚠️ İlişkilendirme/Ekleme hatası (kritik değil):', linkingError.message);
      }

      return new Response(JSON.stringify({
        success: true,
        transferFileUniqueId,
        ettn,
        integrationCode: finalIntegrationCode,
        invoiceNumber: veribanInvoiceNumber,
        message: veribanInvoiceNumber 
          ? `Fatura başarıyla Veriban sistemine gönderildi ve fatura numarası atandı: ${veribanInvoiceNumber}`
          : 'Fatura başarıyla Veriban sistemine gönderildi. Fatura numarası henüz atanmadı, birkaç dakika sonra tekrar kontrol edin.'
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
    console.error('❌ Veriban send invoice function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

