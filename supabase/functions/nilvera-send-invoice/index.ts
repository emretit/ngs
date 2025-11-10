 import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Nilvera send invoice function started');
    console.log('📋 Request method:', req.method);
    
    const SUPABASE_URL = 'https://vwhwufnckpqirxptwncw.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client created');

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Invalid user token:', userError);
      throw new Error('Invalid user token');
    }

    console.log('📨 Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 Raw request body:', requestBody);
    
    const { salesInvoiceId } = requestBody;
    console.log('📨 Parsed request body:', { salesInvoiceId });
    console.log('👤 User ID:', user.id);

    // Validate required fields
    if (!salesInvoiceId) {
      console.error('❌ salesInvoiceId is required');
      throw new Error('salesInvoiceId is required');
    }

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    console.log('🏢 Profile query result:', { profile, profileError });

    if (profileError || !profile?.company_id) {
      console.error('❌ User profile or company not found');
      throw new Error('User profile or company not found');
    }

    console.log('🏢 Company ID:', profile.company_id);

    // 1. IDEMPOTENCY CONTROL - Check if invoice is already being processed or sent
    console.log('🔍 Checking for duplicate invoice processing...');
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select('id, einvoice_status, nilvera_invoice_id, einvoice_sent_at, einvoice_nilvera_response')
      .eq('id', salesInvoiceId)
      .eq('company_id', profile.company_id)
      .single();

    console.log('🔍 Existing invoice data:', { existingInvoice, invoiceError });

    if (existingInvoice) {
      const status = existingInvoice.einvoice_status;
      console.log('📊 Current invoice status:', status);
      
      // Check if invoice is already in progress or completed
      if (['sending', 'sent', 'delivered', 'accepted'].includes(status)) {
        console.log('⚠️ Invoice already processed with status:', status);
        
        // Return appropriate response based on status
        if (status === 'sending') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Fatura şu anda gönderiliyor. Lütfen birkaç dakika bekleyin.',
            status: 'sending',
            message: 'Invoice is currently being sent'
          }), {
            status: 409, // Conflict
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else if (['sent', 'delivered', 'accepted'].includes(status)) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Fatura daha önce gönderilmiş',
            status: status,
            nilvera_invoice_id: existingInvoice.nilvera_invoice_id,
            sent_at: existingInvoice.einvoice_sent_at,
            data: existingInvoice.einvoice_nilvera_response
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (status === 'error') {
        console.log('🔄 Previous attempt failed, retrying...');
        // Allow retry for failed invoices
      }
    }

    // 2. LOCKING MECHANISM - Mark as 'sending' to prevent duplicate processing
    console.log('🔒 Setting invoice status to sending (locking)...');
    const { error: lockError } = await supabase
      .from('sales_invoices')
      .update({
        einvoice_status: 'sending',
        einvoice_transfer_state: 0,
        einvoice_invoice_state: 0,
        einvoice_sent_at: new Date().toISOString(),
        einvoice_error_message: null,
        einvoice_error_code: null
      })
      .eq('id', salesInvoiceId)
      .eq('company_id', profile.company_id);

    if (lockError) {
      console.error('❌ Failed to set sending status:', lockError);
      throw new Error('Fatura durumu güncellenemedi');
    }

    console.log('✅ Invoice locked for processing');

    // Get the company's Nilvera authentication data
    const { data: nilveraAuth, error: authError } = await supabase
      .from('nilvera_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    console.log('🔐 Nilvera auth query result:', { 
      hasAuth: !!nilveraAuth, 
      authError, 
      companyId: profile.company_id 
    });

    if (authError || !nilveraAuth) {
      console.error('❌ Nilvera auth bulunamadı:', authError);
      throw new Error('Nilvera kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Nilvera bilgilerinizi girin.');
    }

    // Send invoice to Nilvera
    try {
      console.log('🚀 Starting e-invoice send process...');
      console.log('📊 Request data:', { salesInvoiceId, companyId: profile.company_id });
      
      // Get sales invoice with items and company info
      console.log('📋 Fetching sales invoice:', { salesInvoiceId, companyId: profile.company_id });
      const { data: salesInvoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          sales_invoice_items(*),
          customers(*),
          companies!sales_invoices_company_id_fkey(*)
        `)
        .eq('id', salesInvoiceId)
        .eq('company_id', profile.company_id)
        .single();

      if (invoiceError || !salesInvoice) {
        console.error('❌ Sales invoice not found:', {
          salesInvoiceId,
          companyId: profile.company_id,
          error: invoiceError
        });
        throw new Error(`Sales invoice not found: ${invoiceError?.message || 'Unknown error'}`);
      }

      console.log('📄 Sales invoice data:', {
        id: salesInvoice.id,
        fatura_no: salesInvoice.fatura_no,
        customer: salesInvoice.customers?.name,
        customer_tax_number: salesInvoice.customers?.tax_number,
        items: salesInvoice.sales_invoice_items?.length,
        company: salesInvoice.companies?.name
      });

      // Validate required customer data
      if (!salesInvoice.customers?.tax_number) {
        console.error('❌ Customer tax number is missing');
        throw new Error('Müşteri vergi numarası bulunamadı. Lütfen müşteri bilgilerini tamamlayın.');
      }

      // Validate required company data
      if (!salesInvoice.companies?.tax_number) {
        console.error('❌ Company tax number is missing');
        throw new Error('Şirket vergi numarası bulunamadı. Lütfen şirket bilgilerini tamamlayın.');
      }

      // Get invoice series from nilvera_auth table
      // Each company has its own invoice series configured in the portal
      const invoiceSerieOrNumber = nilveraAuth.invoice_series || 'NGS';
      console.log('🔍 Using invoice series from nilvera_auth:', invoiceSerieOrNumber);
      
      // Validate series format (should be 3 characters)
      if (!invoiceSerieOrNumber || invoiceSerieOrNumber.length !== 3) {
        console.error('❌ Invalid invoice series format:', invoiceSerieOrNumber);
        throw new Error(`Geçersiz fatura seri formatı: ${invoiceSerieOrNumber}. Seri 3 karakter olmalıdır.`);
      }

      // Create standard Nilvera invoice model
      const nilveraInvoiceData: any = {
        EInvoice: {
          InvoiceInfo: {
            UUID: crypto.randomUUID ? crypto.randomUUID() : 'uuid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            InvoiceType: 'SATIS',
            InvoiceSerieOrNumber: invoiceSerieOrNumber,
            IssueDate: new Date(salesInvoice.fatura_tarihi).toISOString(),
            CurrencyCode: salesInvoice.para_birimi || 'TL',
            ExchangeRate: 1,
                          InvoiceProfile: 'TEMELFATURA' // Will be changed to TICARIFATURA if e-fatura mükellefi
          },
          CompanyInfo: {
            TaxNumber: salesInvoice.companies?.tax_number,
            Name: salesInvoice.companies?.name || 'Şirket Adı',
            Address: salesInvoice.companies?.address || 'Şirket Adresi',
            District: 'Merkez',
            City: 'İstanbul', // Default şehir
            Country: 'Türkiye',
            Phone: salesInvoice.companies?.phone || '',
            Mail: salesInvoice.companies?.email || ''
          },
          CustomerInfo: {
            TaxNumber: salesInvoice.customers?.tax_number,
            Name: salesInvoice.customers?.name || salesInvoice.customers?.company,
            TaxOffice: salesInvoice.customers?.tax_office,
            Address: salesInvoice.customers?.address || '-',
            District: salesInvoice.customers?.district || salesInvoice.customers?.city || 'Merkez',
            City: salesInvoice.customers?.city || 'İstanbul',
            Country: 'Türkiye',
            Phone: salesInvoice.customers?.mobile_phone || salesInvoice.customers?.office_phone || '',
            Mail: salesInvoice.customers?.email || ''
          },
          InvoiceLines: salesInvoice.sales_invoice_items?.map((item: any) => {
            // Birim kodunu UBL-TR standart koduna çevir
            const mapUnitToUBLTR = (unit: string): string => {
              if (!unit) return 'C62'; // Varsayılan: adet
              
              const unitUpper = unit.toUpperCase();
              const unitLower = unit.toLowerCase();
              
              // UBL-TR kodları direkt döndür
              const ubltrCodes: Record<string, string> = {
                'C62': 'C62', 'MTR': 'MTR', 'MTK': 'MTK', 'MTQ': 'MTQ',
                'KGM': 'KGM', 'GRM': 'GRM', 'LTR': 'LTR', 'MLT': 'MLT',
                'HUR': 'HUR', 'DAY': 'DAY', 'MON': 'MON', 'WEE': 'WEE',
                'PA': 'PA', 'CT': 'CT'
              };
              if (ubltrCodes[unitUpper]) return unitUpper;
              
              // Dropdown değerlerini ve okunabilir formatları UBL-TR kodlarına çevir
              const unitMap: Record<string, string> = {
                'adet': 'C62', 'kilogram': 'KGM', 'gram': 'GRM',
                'metre': 'MTR', 'metrekare': 'MTK', 'metreküp': 'MTQ',
                'litre': 'LTR', 'mililitre': 'MLT', 'paket': 'PA', 'kutu': 'CT',
                'saat': 'HUR', 'gün': 'DAY', 'hafta': 'WEE', 'ay': 'MON',
                'kg': 'KGM', 'g': 'GRM', 'm': 'MTR', 'm2': 'MTK', 'm3': 'MTQ',
                'lt': 'LTR', 'ml': 'MLT',
                'Adet': 'C62', 'Kg': 'KGM', 'Lt': 'LTR', 'M': 'MTR',
                'M2': 'MTK', 'M3': 'MTQ', 'Paket': 'PA', 'Kutu': 'CT'
              };
              
              return unitMap[unitLower] || unitMap[unit] || 'C62';
            };
            
            return {
            Name: item.urun_adi,
            Quantity: parseFloat(item.miktar),
              UnitType: mapUnitToUBLTR(item.birim), // UBL-TR standart birim kodları
            Price: parseFloat(item.birim_fiyat),
            KDVPercent: parseFloat(item.kdv_orani),
            DiscountPercent: parseFloat(item.indirim_orani || 0),
            LineTotal: parseFloat(item.satir_toplami)
            };
          }) || [],
          Notes: salesInvoice.notlar ? [salesInvoice.notlar] : []
        }
        // CustomerAlias will be set below only for e-fatura mükellefi customers
      };

              // CustomerAlias is REQUIRED for e-fatura mükellefi customers
        // Only check for alias if customer is e-fatura mükellefi
        let customerAlias = null;
        
        if (salesInvoice.customers?.is_einvoice_mukellef) {
          customerAlias = salesInvoice.customers?.einvoice_alias_name;
          
          // Clean and validate alias from customer table
          if (customerAlias) {
            customerAlias = customerAlias.toString().trim();
            if (customerAlias === 'undefined' || customerAlias === 'null' || customerAlias === '') {
              customerAlias = null;
            }
          }
        }

      if (customerAlias && customerAlias !== 'undefined' && customerAlias.trim() !== '') {
        console.log('📝 Found customer alias:', customerAlias);
        // Verify alias is still valid in Nilvera system before using
        console.log('🔍 Verifying alias validity in Nilvera system...');
        const globalCompanyUrl = nilveraAuth.test_mode 
          ? 'https://apitest.nilvera.com/general/GlobalCompany/GetGlobalCustomerInfo'
          : 'https://api.nilvera.com/general/GlobalCompany/GetGlobalCustomerInfo';

        try {
          const globalCompanyResponse = await fetch(`${globalCompanyUrl}/${salesInvoice.customers?.tax_number}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${nilveraAuth.api_key}`,
              'Content-Type': 'application/json'
            }
          });

          if (globalCompanyResponse.ok) {
            const globalCompanyData = await globalCompanyResponse.json();
            console.log('🔍 GlobalCompany API response:', JSON.stringify(globalCompanyData, null, 2));
            console.log('🔍 GlobalCompany AliasName:', globalCompanyData.AliasName);
            console.log('🔍 GlobalCompany Aliases:', globalCompanyData.Aliases);
            
            // Remove urn:mail: prefix from DB alias for comparison
            const dbAliasWithoutPrefix = customerAlias?.replace('urn:mail:', '') || '';
            console.log('🔍 DB alias without prefix:', dbAliasWithoutPrefix);
            
            // Check if GlobalCompany API has Aliases array (like GetGlobalCustomerInfo)
            let nilveraAlias = null;
            if (globalCompanyData.Aliases && globalCompanyData.Aliases.length > 0) {
              // Use Aliases array (GetGlobalCustomerInfo format)
              const einvoiceAlias = globalCompanyData.Aliases.find((alias: any) => 
                alias.Name && 
                alias.Name.startsWith('urn:mail:') && 
                alias.DeletionTime === null
              );
              nilveraAlias = einvoiceAlias?.Name || null;
              console.log('🔍 Using Aliases array, found alias:', nilveraAlias);
            } else if (globalCompanyData.AliasName) {
              // Use AliasName field (GlobalCompany format)
              nilveraAlias = `urn:mail:${globalCompanyData.AliasName}`;
              console.log('🔍 Using AliasName field, created alias:', nilveraAlias);
            }

            if (nilveraAlias) {
              // Remove urn:mail: prefix for comparison
              const nilveraAliasWithoutPrefix = nilveraAlias.replace('urn:mail:', '');
              
              if (nilveraAliasWithoutPrefix === dbAliasWithoutPrefix) {
                console.log('✅ DB alias is still valid in Nilvera system');
                nilveraInvoiceData.CustomerAlias = nilveraAlias;
                nilveraInvoiceData.EInvoice.InvoiceInfo.InvoiceProfile = 'TICARIFATURA';
                console.log('✅ Set InvoiceProfile to TICARIFATURA for e-fatura mükellefi');
              } else {
                console.log('⚠️ DB alias is outdated, using Nilvera system alias:', nilveraAlias);
                nilveraInvoiceData.CustomerAlias = nilveraAlias;
                nilveraInvoiceData.EInvoice.InvoiceInfo.InvoiceProfile = 'TICARIFATURA';
                console.log('✅ Set InvoiceProfile to TICARIFATURA for e-fatura mükellefi');
                
                // Update customer table with current alias (without urn:mail: prefix)
                const aliasWithoutPrefix = nilveraAlias.replace('urn:mail:', '');
                await supabase
                  .from('customers')
                  .update({
                    einvoice_alias_name: aliasWithoutPrefix,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', salesInvoice.customers?.id);
              }
            } else {
              console.log('❌ No valid alias found in Nilvera response');
              throw new Error(`Müşteri ${salesInvoice.customers?.name} (VKN: ${salesInvoice.customers?.tax_number}) e-fatura mükellefi ancak Nilvera sisteminden geçerli bir alias bilgisi alınamadı. Lütfen müşteri bilgilerini kontrol edin.`);
            }
          } else {
            console.log('ℹ️ Customer is not e-fatura mükellefi, CustomerAlias will not be included');
          }
        } catch (globalCompanyError: any) {
          console.error('❌ Alias verification failed:', globalCompanyError.message);
          // If verification fails, don't use the alias - but don't delete it either
          console.log('ℹ️ Alias verification failed, CustomerAlias will not be included');
        }
      } else {
        // Customer is not e-fatura mükellefi, no need to check alias
        console.log('ℹ️ Customer is not e-fatura mükellefi, CustomerAlias will not be included');
      }

      // For e-fatura mükellefi customers, CustomerAlias is REQUIRED
      if (salesInvoice.customers?.is_einvoice_mukellef && !nilveraInvoiceData.CustomerAlias) {
        console.log('⚠️ E-fatura mükellefi customer but no CustomerAlias found, this will cause API error');
        throw new Error(`Müşteri ${salesInvoice.customers?.name} (VKN: ${salesInvoice.customers?.tax_number}) e-fatura mükellefi ancak CustomerAlias bilgisi bulunamadı. Lütfen müşteri bilgilerini kontrol edin.`);
      }

      // Final check: only set CustomerAlias if it's valid
      if (nilveraInvoiceData.CustomerAlias && nilveraInvoiceData.CustomerAlias.includes('undefined')) {
        console.log('⚠️ Invalid CustomerAlias detected, removing it');
        delete nilveraInvoiceData.CustomerAlias;
      }

      console.log('📋 Nilvera invoice model created:', {
        invoiceNumber: nilveraInvoiceData.EInvoice.InvoiceInfo.InvoiceSerieOrNumber,
        customer: nilveraInvoiceData.EInvoice.CustomerInfo.Name,
        customerAlias: nilveraInvoiceData.CustomerAlias || 'N/A',
        invoiceProfile: nilveraInvoiceData.EInvoice.InvoiceInfo.InvoiceProfile,
        isEInvoice: nilveraInvoiceData.EInvoice.InvoiceInfo.InvoiceProfile === 'TICARIFATURA',
        total: salesInvoice.toplam_tutar,
        hasCustomerAlias: !!nilveraInvoiceData.CustomerAlias
      });

      // Log the full invoice data for debugging
      console.log('📄 Full invoice data being sent:', JSON.stringify(nilveraInvoiceData, null, 2));

      // Send to Nilvera API - using Model endpoint for standard format
      const nilveraApiUrl = nilveraAuth.test_mode 
        ? 'https://apitest.nilvera.com/einvoice/Send/Model'
        : 'https://api.nilvera.com/einvoice/Send/Model';

      console.log('🌐 Sending to Nilvera API:', nilveraApiUrl);

      const nilveraResponse = await fetch(nilveraApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nilveraAuth.api_key}`,
          'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(nilveraInvoiceData)
      });

      console.log('📡 Nilvera API response status:', nilveraResponse.status);

      if (!nilveraResponse.ok) {
        const errorText = await nilveraResponse.text();
        console.error('❌ Nilvera API error:', errorText);
        console.error('❌ Request data that caused error:', JSON.stringify(nilveraInvoiceData, null, 2));
        throw new Error(`Nilvera API error: ${nilveraResponse.status} - ${errorText}`);
      }

      const nilveraResult = await nilveraResponse.json();
      console.log('✅ Nilvera draft created:', nilveraResult);

      // 3. SUCCESS FLOW - Update sales_invoices table with 'sent' status
      console.log('📝 Updating invoice status to sent...');
      const { error: trackingError } = await supabase
        .from('sales_invoices')
        .update({
          nilvera_invoice_id: nilveraResult.id || nilveraResult.uuid,
          nilvera_transfer_id: nilveraResult.transferId,
          einvoice_status: 'sent',
          einvoice_transfer_state: nilveraResult.transferState || 0,
          einvoice_invoice_state: nilveraResult.invoiceState || 0,
          einvoice_sent_at: new Date().toISOString(),
          einvoice_nilvera_response: nilveraResult,
          einvoice_error_message: null,
          einvoice_error_code: null
        })
        .eq('id', salesInvoiceId)
        .eq('company_id', profile.company_id);

      if (trackingError) {
        console.error('❌ Error updating invoice data:', trackingError);
        // Don't throw error here, continue with invoice update
      } else {
        console.log('✅ Invoice status updated to sent');
      }

      // Update sales invoice status and fatura_no if provided by Nilvera
      const updateData: any = { 
        durum: 'gonderildi',
        xml_data: nilveraResult
      };

      // If Nilvera returned an invoice number, update it
      if (nilveraResult.invoiceNumber || nilveraResult.invoice_number) {
        const assignedInvoiceNumber = nilveraResult.invoiceNumber || nilveraResult.invoice_number;
        updateData.fatura_no = assignedInvoiceNumber;
        console.log('📝 Updating fatura_no with Nilvera assigned number:', assignedInvoiceNumber);
      }

      const { error: updateError } = await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', salesInvoiceId);

      if (updateError) {
        console.error('❌ Error updating sales invoice:', updateError);
      }

      const successResponse = { 
        success: true,
        message: 'E-fatura başarıyla Nilvera\'ya gönderildi',
        status: 'sent',
        nilvera_invoice_id: nilveraResult.id || nilveraResult.uuid,
        sent_at: new Date().toISOString(),
        data: nilveraResult
      };
      
      console.log('✅ SUCCESS RESPONSE:', JSON.stringify(successResponse, null, 2));
      
      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('❌ Send invoice error:', error);
      
      // 4. ERROR FLOW - Update sales_invoices table with 'error' status
      console.log('📝 Updating invoice status to error...');
      const { error: errorTrackingError } = await supabase
        .from('sales_invoices')
        .update({
          einvoice_status: 'error',
          einvoice_error_message: (error as any).message,
          einvoice_error_code: 'SEND_ERROR',
          einvoice_nilvera_response: null
        })
        .eq('id', salesInvoiceId)
        .eq('company_id', profile.company_id);

      if (errorTrackingError) {
        console.error('❌ Error updating invoice status to error:', errorTrackingError);
      } else {
        console.log('✅ Invoice status updated to error');
      }

      // Determine appropriate HTTP status code
      let httpStatus = 400;
      if ((error as any).message?.includes('duplicate') || (error as any).message?.includes('already exists')) {
        httpStatus = 409; // Conflict
      } else if ((error as any).message?.includes('unauthorized') || (error as any).message?.includes('forbidden')) {
        httpStatus = 401; // Unauthorized
      } else if ((error as any).message?.includes('not found')) {
        httpStatus = 404; // Not Found
      }

      const errorResponse = { 
        success: false,
        message: 'E-fatura gönderimi başarısız oldu',
        status: 'error',
        error: (error as any).message,
        error_code: 'SEND_ERROR',
        timestamp: new Date().toISOString()
      };
      
      console.log('❌ ERROR RESPONSE:', JSON.stringify(errorResponse, null, 2));
      
      return new Response(JSON.stringify(errorResponse), {
        status: httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Error in nilvera-send-invoice function:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    return new Response(JSON.stringify({ 
      success: false,
      message: 'E-fatura gönderimi başarısız oldu',
      status: 'error',
      error: error.message || 'An unknown error occurred',
      error_code: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});