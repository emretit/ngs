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
    const { startDate, endDate, forceRefresh = false } = requestBody;

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

    console.log('📋 Veriban gelen faturalar sorgulanıyor...');
    console.log('📅 Date Range:', formattedStartDate, '-', formattedEndDate);
    console.log('🔄 Force Refresh:', forceRefresh);

    // ============ CACHE CHECK ============
    // If not force refresh, first check DB cache
    if (!forceRefresh) {
      let cacheQuery = supabase
        .from('einvoices_received')
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
          id: inv.invoice_uuid,
          einvoice_id: inv.invoice_uuid,
          invoiceNumber: inv.invoice_id,
          invoiceDate: inv.invoice_date,
          dueDate: inv.due_date,
          supplierName: inv.supplier_name,
          supplierTaxNumber: inv.supplier_vkn,
          supplierVkn: inv.supplier_vkn,
          totalAmount: parseFloat(inv.total_amount) || 0,
          taxAmount: parseFloat(inv.tax_amount) || 0,
          currency: inv.currency || 'TRY',
          invoiceType: inv.invoice_type || 'TEMEL',
          invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
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

    try {
      // Get Purchase Invoice UUID List
      console.log('📊 GetPurchaseInvoiceUUIDList çağrılıyor...');
      const uuidListResult = await VeribanSoapClient.getPurchaseInvoiceUUIDList(
        sessionCode,
        { startDate: formattedStartDate, endDate: formattedEndDate },
        veribanAuth.webservice_url
      );

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

      if (uuidList.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          invoices: [],
          message: 'Seçili tarih aralığında fatura bulunamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check which invoices are already in cache
      const { data: existingInvoices } = await supabase
        .from('einvoices_received')
        .select('invoice_uuid')
        .eq('company_id', profile.company_id)
        .in('invoice_uuid', uuidList);

      const existingUUIDs = new Set((existingInvoices || []).map(inv => inv.invoice_uuid));
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
          console.log(`📄 Fatura ${globalIndex + 1}/${invoiceUUIDsToFetch.length} çekiliyor`);

          try {
            const downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
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
              invoice_uuid: invoiceUUID,
              invoice_id: parsedInvoice.invoiceNumber || '',
              supplier_vkn: parsedInvoice.supplierInfo?.taxNumber || '',
              supplier_name: parsedInvoice.supplierInfo?.name || '',
              // Tedarikçi ek bilgileri
              supplier_tax_office: parsedInvoice.supplierInfo?.taxOffice || null,
              supplier_address_street: parsedInvoice.supplierInfo?.address?.street || null,
              supplier_address_district: parsedInvoice.supplierInfo?.address?.district || null,
              supplier_address_city: parsedInvoice.supplierInfo?.address?.city || null,
              supplier_address_postal_code: parsedInvoice.supplierInfo?.address?.postalCode || null,
              supplier_address_country: parsedInvoice.supplierInfo?.address?.country || null,
              supplier_contact_email: parsedInvoice.supplierInfo?.contact?.email || null,
              supplier_contact_phone: parsedInvoice.supplierInfo?.contact?.phone || null,
              invoice_date: parsedInvoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
              due_date: parsedInvoice.dueDate?.split('T')[0] || null,
              subtotal: parsedInvoice.taxExclusiveAmount || 0,
              tax_amount: parsedInvoice.taxTotalAmount || 0,
              total_amount: parsedInvoice.payableAmount || 0,
              currency: parsedInvoice.currency || 'TRY',
              exchange_rate: parsedInvoice.exchangeRate || null, // Döviz kuru bilgisi
              invoice_type: parsedInvoice.invoiceType || 'TEMEL',
              invoice_profile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
              xml_content: xmlContent, // Ham XML içeriğini kaydet
              company_id: profile.company_id,
              fetched_at: new Date().toISOString(),
            };

            // Upsert to DB
            await supabase
              .from('einvoices_received')
              .upsert(invoiceData, { onConflict: 'invoice_uuid' });

            console.log(`✅ Fatura ${globalIndex + 1} kaydedildi: ${invoiceData.invoice_id}`);
            
            return {
              id: invoiceUUID,
              einvoice_id: invoiceUUID,
              invoiceNumber: invoiceData.invoice_id,
              invoiceDate: invoiceData.invoice_date,
              dueDate: invoiceData.due_date,
              supplierName: invoiceData.supplier_name,
              supplierTaxNumber: invoiceData.supplier_vkn,
              supplierVkn: invoiceData.supplier_vkn,
              totalAmount: invoiceData.total_amount,
              taxAmount: invoiceData.tax_amount,
              currency: invoiceData.currency,
              invoiceType: invoiceData.invoice_type,
              invoiceProfile: invoiceData.invoice_profile,
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
        .from('einvoices_received')
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
      // FORCE REFRESH: Update status for all cached incoming invoices
      // Her "E-Fatura Çek" butonuna basıldığında mevcut gelen faturaların durumunu da güncelleyelim
      // ============================================
      if (forceRefresh && allCachedInvoices && allCachedInvoices.length > 0) {
        console.log(`🔄 Gelen faturaların cache'sinde ${allCachedInvoices.length} fatura var - durum güncelleniyor...`);
        
        // Update status for cached invoices in smaller batches to avoid timeout
        const STATUS_UPDATE_BATCH_SIZE = 10;
        let statusUpdateCount = 0;
        
        for (let i = 0; i < allCachedInvoices.length; i += STATUS_UPDATE_BATCH_SIZE) {
          const batch = allCachedInvoices.slice(i, i + STATUS_UPDATE_BATCH_SIZE);
          
          const statusUpdatePromises = batch.map(async (cachedInvoice) => {
            try {
              // Her fatura için durum sorgulama yap
              const invoiceUUID = cachedInvoice.invoice_uuid;
              const invoiceNumber = cachedInvoice.invoice_id;
              
              if (!invoiceUUID) {
                console.warn(`⚠️ Fatura UUID yok, durum güncellemesi atlanıyor:`, cachedInvoice.invoice_id);
                return;
              }
              
              console.log(`📊 Gelen fatura durumu güncelleniyor: ${invoiceNumber || invoiceUUID}`);
              
              // Durum sorgulama - önce invoice number ile dene, yoksa UUID ile
              let statusResult;
              if (invoiceNumber) {
                statusResult = await VeribanSoapClient.getPurchaseInvoiceStatusWithInvoiceNumber(
                  sessionCode,
                  invoiceNumber,
                  veribanAuth.webservice_url
                );
              } else {
                statusResult = await VeribanSoapClient.getPurchaseInvoiceStatus(
                  sessionCode,
                  invoiceUUID,
                  veribanAuth.webservice_url
                );
              }
              
              if (!statusResult.success) {
                console.warn(`⚠️ Gelen fatura durumu sorgulanamadı: ${invoiceNumber || invoiceUUID}`, statusResult.error);
                return;
              }
              
              const statusData = statusResult.data;
              
              if (!statusData) {
                console.warn(`⚠️ Gelen fatura durum bilgisi alınamadı: ${invoiceNumber || invoiceUUID}`);
                return;
              }
              
              // Update database with latest status
              const updateData: any = {
                updated_at: new Date().toISOString(),
              };
              
              // Gelen faturalarda stateCode genellikle 5 (alındı) olur
              // Ancak cevap durumunu da güncelleyelim
              if (statusData.stateCode === 5) {
                updateData.status = 'received';
              }
              
              // Update answer information if available
              // AnswerTypeCode: 1=Bilinmiyor, 3=Iade Edildi, 4=Reddedildi, 5=Kabul edildi
              if (statusData.answerTypeCode && statusData.answerTypeCode !== 1) {
                updateData.answer_status = statusData.answerTypeCode === 5 ? 'KABUL' : (statusData.answerTypeCode === 4 ? 'RED' : 'IADE');
                updateData.answer_date = updateData.answer_date || new Date().toISOString();
              }
              
              // Update in database
              const { error: updateError } = await supabase
                .from('einvoices_received')
                .update(updateData)
                .eq('invoice_uuid', invoiceUUID);
              
              if (updateError) {
                console.error(`❌ Gelen fatura durumu güncellenemedi: ${invoiceNumber || invoiceUUID}`, updateError.message);
              } else {
                statusUpdateCount++;
                console.log(`✅ Gelen fatura durumu güncellendi: ${invoiceNumber || invoiceUUID}`);
              }
              
            } catch (err: any) {
              console.error(`❌ Gelen fatura durum güncelleme hatası:`, err.message);
            }
          });
          
          await Promise.all(statusUpdatePromises);
          
          // Rate limiting - wait 200ms between batches
          if (i + STATUS_UPDATE_BATCH_SIZE < allCachedInvoices.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log(`✅ ${statusUpdateCount} gelen faturanın durumu başarıyla güncellendi`);
        
        // Re-fetch updated invoices from DB - query'yi yeniden execute et
        let refetchQuery = supabase
          .from('einvoices_received')
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
        id: inv.invoice_uuid,
        einvoice_id: inv.invoice_uuid,
        invoiceNumber: inv.invoice_id,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        supplierName: inv.supplier_name,
        supplierTaxNumber: inv.supplier_vkn,
        supplierVkn: inv.supplier_vkn,
        totalAmount: parseFloat(inv.total_amount) || 0,
        taxAmount: parseFloat(inv.tax_amount) || 0,
        currency: inv.currency || 'TRY',
        invoiceType: inv.invoice_type || 'TEMEL',
        invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
      }));

      console.log(`✅ Toplam ${allInvoices.length} fatura döndürülüyor (${invoices.length} yeni)`);

      return new Response(JSON.stringify({
        success: true,
        invoices: allInvoices,
        totalCount: allInvoices.length,
        newCount: invoices.length,
        fromCache: false,
        message: `${allInvoices.length} fatura listelendi (${invoices.length} yeni)`
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
    console.error('❌ Veriban incoming invoices function hatası:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
