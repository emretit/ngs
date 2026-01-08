import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

// Kaynak limitini aşmamak için maksimum fatura sayısı
const MAX_INVOICES_PER_REQUEST = 30;

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
    const requestBody = await req.json();
    const { startDate, endDate, forceRefresh = false, customerTaxNumber } = requestBody;

    // customerTaxNumber zorunlu - girilmezse hata döndür
    if (!customerTaxNumber || customerTaxNumber.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Müşteri VKN zorunludur (10-11 haneli)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate dates
    let formattedStartDate: string | undefined;
    let formattedEndDate: string | undefined;

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz startDate formatı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedStartDate = parsedStart.toISOString().split('T')[0];
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz endDate formatı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedEndDate = parsedEnd.toISOString().split('T')[0];
    }

    console.log('📋 Veriban giden faturalar sorgulanıyor... (v56-customer-filter)');
    console.log('📅 Date Range:', formattedStartDate, '-', formattedEndDate);
    console.log('🔄 Force Refresh:', forceRefresh);
    console.log('🏢 Müşteri VKN:', customerTaxNumber);
    console.log('👤 User ID:', user.id);
    console.log('🏢 Company ID:', profile.company_id);

    // ============ CACHE CHECK ============
    // If not force refresh, first check DB cache
    if (!forceRefresh) {
      let cacheQuery = supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('invoice_date', { ascending: false });

      if (formattedStartDate) {
        cacheQuery = cacheQuery.gte('invoice_date', formattedStartDate);
      }
      if (formattedEndDate) {
        cacheQuery = cacheQuery.lte('invoice_date', formattedEndDate);
      }

      const { data: cachedInvoices, error: cacheError } = await cacheQuery;

      if (!cacheError && cachedInvoices && cachedInvoices.length > 0) {
        console.log(`✅ Cache'den ${cachedInvoices.length} fatura döndürülüyor`);
        
        // Transform cached data to expected format
        const formattedInvoices = cachedInvoices.map(inv => ({
          id: inv.id,
          invoiceUUID: inv.ettn || inv.id,
          invoiceNumber: inv.invoice_number || '',
          invoiceDate: inv.invoice_date || '',
          dueDate: inv.due_date || null,
          customerName: inv.customer_name || '',
          customerTaxNumber: inv.customer_tax_number || '',
          totalAmount: parseFloat(inv.payable_amount as any) || 0,
          taxAmount: parseFloat(inv.tax_total_amount as any) || 0,
          taxExclusiveAmount: parseFloat(inv.tax_exclusive_amount as any) || 0,
          currency: inv.currency || 'TRY',
          invoiceType: inv.invoice_type || 'TEMEL',
          invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
          status: inv.status || 'sent',
          sentAt: inv.sent_at || null,
          deliveredAt: inv.delivered_at || null,
        }));

        return new Response(JSON.stringify({
          success: true,
          invoices: formattedInvoices,
          totalCount: formattedInvoices.length,
          fromCache: true,
          message: `${formattedInvoices.length} fatura cache'den yüklendi`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============ FETCH FROM VERIBAN API ============
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

    // Get company info for logging
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error('❌ Şirket bilgisi alınamadı:', companyError);
    }
    
    console.log('🏢 Şirket Bilgileri:', {
      name: companyData?.name,
      companyId: profile.company_id
    });
    console.log('🔍 Sorgulanacak Müşteri VKN:', customerTaxNumber);


    // Get valid session code
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

    // Veriban API'si maksimum 6 ay geriye izin veriyor - tarih validasyonu
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() + 1); // 1 gün buffer
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    if (formattedStartDate) {
      const startDateObj = new Date(formattedStartDate);
      if (startDateObj < sixMonthsAgo) {
        console.log('⚠️ startDate 6 aydan eski, düzeltiliyor:', formattedStartDate, '->', sixMonthsAgoStr);
        formattedStartDate = sixMonthsAgoStr;
      }
    }

    try {
      // Get Sales Invoice UUID List
      console.log('📊 GetSalesInvoiceUUIDList çağrılıyor...');
      console.log('📅 Tarih Aralığı:', { 
        startDate: formattedStartDate, 
        endDate: formattedEndDate,
        rawStartDate: startDate,
        rawEndDate: endDate
      });
      console.log('🌐 Webservice URL:', veribanAuth.webservice_url);
      console.log('🔑 Session Code mevcut:', !!sessionCode);
      
      // customerRegisterNumber parametresi - müşteriye göre filtreleme için (ZORUNLU)
      console.log('📤 API Parametreleri:', {
        startDate: formattedStartDate, 
        endDate: formattedEndDate,
        customerRegisterNumber: customerTaxNumber,
        webserviceUrl: veribanAuth.webservice_url
      });
      
      const uuidListResult = await VeribanSoapClient.getSalesInvoiceUUIDList(
        sessionCode,
        { 
          startDate: formattedStartDate, 
          endDate: formattedEndDate,
          customerRegisterNumber: customerTaxNumber // Müşteri VKN'si (ZORUNLU)
        },
        veribanAuth.webservice_url
      );

      console.log('📦 UUID List Response:', JSON.stringify(uuidListResult, null, 2));
      console.log('📊 UUID List Data Type:', typeof uuidListResult.data);
      console.log('📊 UUID List Data:', uuidListResult.data);

      if (!uuidListResult.success) {
        console.error('❌ UUID listesi alınamadı:', uuidListResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: uuidListResult.error || 'UUID listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uuidList = uuidListResult.data || [];
      console.log(`✅ ${uuidList.length} adet fatura UUID'si bulundu`);
      
      if (uuidList.length > 0) {
        console.log('📄 İlk 5 UUID:', uuidList.slice(0, 5));
      }

      if (uuidList.length === 0) {
        console.log('⚠️ Veriban API boş UUID listesi döndürdü');
        console.log('📊 UUID List Result detayları:', {
          success: uuidListResult.success,
          dataType: typeof uuidListResult.data,
          dataLength: uuidListResult.data?.length || 0,
          error: uuidListResult.error || 'yok',
          rawData: JSON.stringify(uuidListResult.data),
          customerTaxNumber
        });
        
        return new Response(JSON.stringify({
          success: true,
          invoices: [],
          totalCount: 0,
          fromCache: false,
          debug: {
            apiResponseSuccess: uuidListResult.success,
            uuidCount: 0,
            dateRange: { startDate: formattedStartDate, endDate: formattedEndDate },
            sessionCodeExists: !!sessionCode,
            customerTaxNumber
          },
          message: `Müşteri VKN ${customerTaxNumber} için seçili tarih aralığında giden fatura bulunamadı`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check which invoices are already in cache
      const { data: existingInvoices } = await supabase
        .from('outgoing_invoices')
        .select('ettn, id')
        .eq('company_id', profile.company_id)
        .in('ettn', uuidList);

      const existingUUIDs = new Set((existingInvoices || []).map(inv => inv.ettn || inv.id));
      const newUUIDs = uuidList.filter((uuid: string) => !existingUUIDs.has(uuid));

      console.log(`📦 ${existingUUIDs.size} fatura zaten cache'de, ${newUUIDs.length} yeni fatura çekilecek`);

      // Limit new invoices to process
      const invoiceUUIDsToFetch = newUUIDs.slice(0, MAX_INVOICES_PER_REQUEST);
      const invoices: any[] = [];

      // Fetch new invoices in batches
      const BATCH_SIZE = 5;
      
      for (let batchStart = 0; batchStart < invoiceUUIDsToFetch.length; batchStart += BATCH_SIZE) {
        const batch = invoiceUUIDsToFetch.slice(batchStart, batchStart + BATCH_SIZE);
        console.log(`📦 Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${batch.length} fatura işleniyor...`);

        const batchPromises = batch.map(async (invoiceUUID: string, batchIndex: number) => {
          const globalIndex = batchStart + batchIndex;
          
          // Validate UUID format (should be XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(invoiceUUID)) {
            console.error(`❌ Geçersiz UUID formatı: "${invoiceUUID}"`);
            console.log(`📝 UUID uzunluğu: ${invoiceUUID.length}, İçerik: "${invoiceUUID}"`);
            return null;
          }
          
          console.log(`📄 Fatura ${globalIndex + 1}/${invoiceUUIDsToFetch.length} çekiliyor: ${invoiceUUID}`);

          try {
            const downloadResult = await VeribanSoapClient.downloadSalesInvoice(
              sessionCode,
              { invoiceUUID, downloadDataType: 'XML_INZIP' },
              veribanAuth.webservice_url
            );

            if (!downloadResult.success || !downloadResult.data?.binaryData) {
              console.error(`❌ Fatura indirilemedi: ${invoiceUUID}`);
              return null;
            }

            const xmlContent = await decodeZIPAndExtractXML(downloadResult.data.binaryData);
            if (!xmlContent) return null;

            const parsedInvoice = parseUBLTRXML(xmlContent);
            if (!parsedInvoice) return null;

            // Save to cache
            const invoiceData = {
              ettn: invoiceUUID,
              invoice_number: parsedInvoice.invoiceNumber || '',
              customer_tax_number: parsedInvoice.customerInfo?.taxNumber || '',
              customer_name: parsedInvoice.customerInfo?.name || '',
              invoice_date: parsedInvoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
              due_date: parsedInvoice.dueDate?.split('T')[0] || null,
              tax_exclusive_amount: parsedInvoice.taxExclusiveAmount || 0,
              tax_total_amount: parsedInvoice.taxTotalAmount || 0,
              payable_amount: parsedInvoice.payableAmount || 0,
              currency: parsedInvoice.currency || 'TRY',
              invoice_type: parsedInvoice.invoiceType || 'TEMEL',
              invoice_profile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
              company_id: profile.company_id,
              status: 'sent',
              sent_at: parsedInvoice.invoiceDate || new Date().toISOString(),
            };

            // Upsert to DB
            const { data: upsertedInvoice, error: upsertError } = await supabase
              .from('outgoing_invoices')
              .upsert(invoiceData, { onConflict: 'ettn' })
              .select()
              .single();

            if (upsertError) {
              console.error(`❌ Fatura kaydedilemedi: ${upsertError.message}`);
              return null;
            }

            console.log(`✅ Fatura ${globalIndex + 1} kaydedildi: ${invoiceData.invoice_number}`);
            
            return {
              id: upsertedInvoice?.id || invoiceUUID,
              invoiceUUID: invoiceUUID,
              invoiceNumber: invoiceData.invoice_number,
              invoiceDate: invoiceData.invoice_date,
              dueDate: invoiceData.due_date,
              customerName: invoiceData.customer_name,
              customerTaxNumber: invoiceData.customer_tax_number,
              totalAmount: invoiceData.payable_amount,
              taxAmount: invoiceData.tax_total_amount,
              taxExclusiveAmount: invoiceData.tax_exclusive_amount,
              currency: invoiceData.currency,
              invoiceType: invoiceData.invoice_type,
              invoiceProfile: invoiceData.invoice_profile,
              status: invoiceData.status,
              sentAt: invoiceData.sent_at,
            };

          } catch (invoiceError: any) {
            console.error(`❌ Fatura işleme hatası:`, invoiceError.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        invoices.push(...batchResults.filter(inv => inv !== null));
        
        if (batchStart + BATCH_SIZE < invoiceUUIDsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Also fetch cached invoices for the date range
      let allInvoicesQuery = supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('invoice_date', { ascending: false });

      if (formattedStartDate) {
        allInvoicesQuery = allInvoicesQuery.gte('invoice_date', formattedStartDate);
      }
      if (formattedEndDate) {
        allInvoicesQuery = allInvoicesQuery.lte('invoice_date', formattedEndDate);
      }

      const { data: allCachedInvoices } = await allInvoicesQuery;
      
      // ============================================
      // FORCE REFRESH: Update status for all cached invoices
      // Her "E-Fatura Çek" butonuna basıldığında mevcut faturaların durumunu da güncelleyelim
      // ============================================
      if (forceRefresh && allCachedInvoices && allCachedInvoices.length > 0) {
        console.log(`🔄 Cache'deki ${allCachedInvoices.length} faturanın durumu güncelleniyor...`);
        
        // Update status for cached invoices in smaller batches to avoid timeout
        const STATUS_UPDATE_BATCH_SIZE = 10;
        let statusUpdateCount = 0;
        
        for (let i = 0; i < allCachedInvoices.length; i += STATUS_UPDATE_BATCH_SIZE) {
          const batch = allCachedInvoices.slice(i, i + STATUS_UPDATE_BATCH_SIZE);
          
          const statusUpdatePromises = batch.map(async (cachedInvoice) => {
            try {
              // Her fatura için durum sorgulama yap
              const invoiceUUID = cachedInvoice.ettn || cachedInvoice.id;
              const invoiceNumber = cachedInvoice.invoice_number;
              
              if (!invoiceUUID) {
                console.warn(`⚠️ Fatura UUID yok, durum güncellemesi atlanıyor:`, cachedInvoice.id);
                return;
              }
              
              console.log(`📊 Durum güncelleniyor: ${invoiceNumber || invoiceUUID}`);
              
              // Durum sorgulama - önce invoice number ile dene, yoksa UUID ile
              let statusResult;
              if (invoiceNumber) {
                statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
                  sessionCode,
                  invoiceNumber,
                  veribanAuth.webservice_url
                );
              } else {
                statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
                  sessionCode,
                  invoiceUUID,
                  veribanAuth.webservice_url
                );
              }
              
              if (!statusResult.success) {
                console.warn(`⚠️ Durum sorgulanamadı: ${invoiceNumber || invoiceUUID}`, statusResult.error);
                return;
              }
              
              const statusData = statusResult.data;
              
              if (!statusData) {
                console.warn(`⚠️ Durum bilgisi alınamadı: ${invoiceNumber || invoiceUUID}`);
                return;
              }
              
              // Update database with latest status
              const updateData: any = {
                updated_at: new Date().toISOString(),
              };
              
              // StateCode: 1=TASLAK, 2=Gönderilmeyi bekliyor, 3=Gönderim listesinde, 4=HATALI, 5=Başarıyla iletildi
              if (statusData.stateCode === 5) {
                updateData.status = 'delivered';
                updateData.delivered_at = updateData.delivered_at || new Date().toISOString();
              } else if (statusData.stateCode === 4) {
                updateData.status = 'failed';
              } else if (statusData.stateCode === 3 || statusData.stateCode === 2) {
                updateData.status = 'sent';
              } else if (statusData.stateCode === 1) {
                updateData.status = 'draft';
              }
              
              // Update answer information if available
              if (statusData.answerTypeCode && statusData.answerTypeCode !== 1) {
                updateData.is_answered = true;
                updateData.answer_type = statusData.answerTypeCode === 5 ? 'KABUL' : (statusData.answerTypeCode === 4 ? 'RED' : 'IADE');
                updateData.answer_date = updateData.answer_date || new Date().toISOString();
              }
              
              // Update in database
              const { error: updateError } = await supabase
                .from('outgoing_invoices')
                .update(updateData)
                .eq('id', cachedInvoice.id);
              
              if (updateError) {
                console.error(`❌ Durum güncellenemedi: ${invoiceNumber || invoiceUUID}`, updateError.message);
              } else {
                statusUpdateCount++;
                console.log(`✅ Durum güncellendi: ${invoiceNumber || invoiceUUID} -> ${updateData.status}`);
              }
              
            } catch (err: any) {
              console.error(`❌ Durum güncelleme hatası:`, err.message);
            }
          });
          
          await Promise.all(statusUpdatePromises);
          
          // Rate limiting - wait 200ms between batches
          if (i + STATUS_UPDATE_BATCH_SIZE < allCachedInvoices.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log(`✅ ${statusUpdateCount} faturanın durumu başarıyla güncellendi`);
        
        // Re-fetch updated invoices from DB - query'yi yeniden execute et
        let refetchQuery = supabase
          .from('outgoing_invoices')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('invoice_date', { ascending: false });

        if (formattedStartDate) {
          refetchQuery = refetchQuery.gte('invoice_date', formattedStartDate);
        }
        if (formattedEndDate) {
          refetchQuery = refetchQuery.lte('invoice_date', formattedEndDate);
        }

        const { data: updatedInvoices } = await refetchQuery;
        if (updatedInvoices) {
          allCachedInvoices.length = 0;
          allCachedInvoices.push(...updatedInvoices);
        }
      }
      
      const allInvoices = (allCachedInvoices || []).map(inv => ({
        id: inv.id,
        invoiceUUID: inv.ettn || inv.id,
        invoiceNumber: inv.invoice_number || '',
        invoiceDate: inv.invoice_date || '',
        dueDate: inv.due_date || null,
        customerName: inv.customer_name || '',
        customerTaxNumber: inv.customer_tax_number || '',
        totalAmount: parseFloat(inv.payable_amount as any) || 0,
        taxAmount: parseFloat(inv.tax_total_amount as any) || 0,
        taxExclusiveAmount: parseFloat(inv.tax_exclusive_amount as any) || 0,
        currency: inv.currency || 'TRY',
        invoiceType: inv.invoice_type || 'TEMEL',
        invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
        status: inv.status || 'sent',
        sentAt: inv.sent_at || null,
        deliveredAt: inv.delivered_at || null,
        // Veriban durum bilgileri - XML'den gelen ve DB'ye kaydedilen bilgiler
        stateCode: inv.elogo_status || null,
        answerStateCode: inv.elogo_code || null,
        statusDescription: inv.elogo_description || null,
        answerType: inv.answer_type || null,
        isAnswered: inv.is_answered || false,
        xmlContent: inv.xml_content || null,
      }));

      console.log(`✅ Toplam ${allInvoices.length} fatura döndürülüyor (${invoices.length} yeni)`);
      console.log(`🎯 Müşteri VKN ${customerTaxNumber} için faturalar getirildi`);

      return new Response(JSON.stringify({
        success: true,
        invoices: allInvoices,
        totalCount: allInvoices.length,
        newCount: invoices.length,
        fromCache: false,
        customerTaxNumber,
        message: `Müşteri VKN ${customerTaxNumber} için ${allInvoices.length} fatura listelendi (${invoices.length} yeni)`
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

  } catch (error: any) {
    console.error('❌ Veriban outgoing invoices function hatası:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

