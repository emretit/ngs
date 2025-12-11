import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SoapClient } from '../_shared/soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

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

    // Get e-Logo auth settings
    const { data: elogoAuth, error: authError } = await supabase
      .from('elogo_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !elogoAuth) {
      console.error('❌ e-Logo auth bulunamadı:', {
        authError,
        companyId: profile.company_id,
        hasElogoAuth: !!elogoAuth
      });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından e-Logo bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate webservice URL
    if (!elogoAuth.webservice_url) {
      console.error('❌ e-Logo webservice URL bulunamadı');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo webservice URL yapılandırılmamış. Lütfen ayarlar sayfasından e-Logo bilgilerinizi kontrol edin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body safely
    let filters = {};
    try {
      const requestBody = await req.json();
      filters = requestBody?.filters || {};
      console.log('📨 Request body parsed:', { filters });
    } catch (parseError: any) {
      console.warn('⚠️ Request body parse hatası, varsayılan filtreler kullanılıyor:', parseError.message);
      // Continue with empty filters if parsing fails
    }

    console.log('🔍 e-Logo gelen faturalar alınıyor...');
    console.log('📡 Webservice URL:', elogoAuth.webservice_url);
    console.log('👤 User ID:', user.id);
    console.log('🏢 Company ID:', profile.company_id);

    // Login to e-Logo
    const loginResult = await SoapClient.login(
      {
        username: elogoAuth.username,
        password: elogoAuth.password,
      },
      elogoAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionID) {
      return new Response(JSON.stringify({ 
        success: false,
        error: loginResult.error || 'e-Logo giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionID = loginResult.sessionID;
    const invoices: any[] = [];
    let logoutAttempted = false;

    try {
      // Get invoices using GetDocument method
      // Note: e-Logo returns documents one by one, we need to loop
      let hasMoreDocuments = true;
      let fetchedCount = 0;
      const maxFetch = 100; // Safety limit

      while (hasMoreDocuments && fetchedCount < maxFetch) {
        const docResult = await SoapClient.getDocument(
          sessionID,
          'EINVOICE', // Get e-invoices
          elogoAuth.webservice_url
        );

        if (!docResult.success || !docResult.data?.binaryData) {
          hasMoreDocuments = false;
          break;
        }

        console.log(`📄 Fatura ${fetchedCount + 1} işleniyor...`);
        
        // Decode ZIP and extract XML
        let parsedInvoice = null;
        let xmlContent: string | null = null;
        
        try {
          xmlContent = await decodeZIPAndExtractXML(docResult.data.binaryData);
          
          if (xmlContent) {
            console.log('✅ XML içeriği başarıyla çıkarıldı');
            parsedInvoice = parseUBLTRXML(xmlContent);
            
            if (parsedInvoice) {
              console.log('✅ UBL-TR XML başarıyla parse edildi');
              console.log(`📋 Fatura No: ${parsedInvoice.invoiceNumber}`);
              console.log(`🏢 Tedarikçi: ${parsedInvoice.supplierInfo.name}`);
              console.log(`📦 Kalem Sayısı: ${parsedInvoice.items.length}`);
            } else {
              console.warn('⚠️ XML parse edilemedi');
            }
          } else {
            console.warn('⚠️ ZIP içinden XML çıkarılamadı');
          }
        } catch (parseError: any) {
          console.error('❌ Parse hatası:', parseError.message);
          // Continue with basic info if parsing fails
        }

        // Use parsed data if available, otherwise use basic info
        const invoice = parsedInvoice ? {
          id: docResult.data.envelopeId || parsedInvoice.ettn || `elogo-${Date.now()}-${fetchedCount}`,
          invoiceNumber: parsedInvoice.invoiceNumber || docResult.data.fileName || `INV-${fetchedCount}`,
          supplierName: parsedInvoice.supplierInfo.name || 'e-Logo Fatura',
          supplierTaxNumber: parsedInvoice.supplierInfo.taxNumber || '',
          invoiceDate: parsedInvoice.invoiceDate || docResult.data.currentDate || new Date().toISOString(),
          dueDate: parsedInvoice.dueDate,
          totalAmount: parsedInvoice.payableAmount || 0,
          currency: parsedInvoice.currency || 'TRY',
          taxAmount: parsedInvoice.taxTotalAmount || 0,
          status: 'pending',
          isAnswered: false,
          invoiceType: parsedInvoice.invoiceType || 'SATIS',
          invoiceProfile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
          xmlData: {
            ...docResult.data,
            parsedInvoice,
            xmlContent,
          },
          items: parsedInvoice?.items || [],
          ettn: parsedInvoice?.ettn || docResult.data.envelopeId,
        } : {
          id: docResult.data.envelopeId || `elogo-${Date.now()}-${fetchedCount}`,
          invoiceNumber: docResult.data.fileName || `INV-${fetchedCount}`,
          supplierName: 'e-Logo Fatura',
          supplierTaxNumber: '',
          invoiceDate: docResult.data.currentDate || new Date().toISOString(),
          totalAmount: 0,
          currency: 'TRY',
          taxAmount: 0,
          status: 'pending',
          isAnswered: false,
          invoiceType: 'SATIS',
          invoiceProfile: 'TEMELFATURA',
          xmlData: docResult.data,
          items: [],
        };

        // Save to database (einvoices table)
        try {
          // Only include columns that exist in the einvoices table
          // Note: invoice_type and invoice_profile columns don't exist yet
          const invoiceData = {
            id: invoice.id,
            invoice_number: invoice.invoiceNumber,
            supplier_name: invoice.supplierName,
            supplier_tax_number: invoice.supplierTaxNumber,
            invoice_date: invoice.invoiceDate.split('T')[0], // Extract date part
            due_date: invoice.dueDate ? invoice.dueDate.split('T')[0] : null,
            status: 'pending',
            total_amount: invoice.totalAmount,
            paid_amount: 0,
            remaining_amount: invoice.totalAmount,
            currency: invoice.currency,
            tax_amount: invoice.taxAmount,
            xml_data: {
              ...invoice.xmlData,
              // Store invoice_type and invoice_profile in xml_data for now
              invoiceType: invoice.invoiceType,
              invoiceProfile: invoice.invoiceProfile,
            },
            company_id: profile.company_id,
          };

          const { error: dbError } = await supabase
            .from('einvoices')
            .upsert(invoiceData, {
              onConflict: 'id'
            });

          if (dbError) {
            console.error('❌ Veritabanı kayıt hatası:', dbError);
          } else {
            console.log(`✅ Fatura veritabanına kaydedildi: ${invoice.invoiceNumber}`);
            
            // Save invoice items if available
            if (parsedInvoice && parsedInvoice.items.length > 0) {
              const invoiceItems = parsedInvoice.items.map((item, index) => ({
                received_invoice_id: invoice.id, // Use received_invoice_id for incoming invoices
                line_number: typeof item.lineNumber === 'number' ? item.lineNumber : index + 1,
                product_name: item.description,
                product_code: item.productCode,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unitPrice,
                tax_rate: item.vatRate,
                line_total: item.totalAmount,
                discount_rate: item.discountRate || 0,
                company_id: profile.company_id,
              }));

              const { error: itemsError } = await supabase
                .from('einvoice_items')
                .upsert(invoiceItems, {
                  onConflict: 'received_invoice_id,line_number'
                });

              if (itemsError) {
                console.error('❌ Fatura kalemleri kayıt hatası:', itemsError);
              } else {
                console.log(`✅ ${invoiceItems.length} adet fatura kalemi kaydedildi`);
              }
            }
          }
        } catch (dbError: any) {
          console.error('❌ Veritabanı işlemi hatası:', dbError);
          // Continue even if DB save fails
        }

        invoices.push(invoice);

        // Mark as done
        if (docResult.data.envelopeId) {
          await SoapClient.getDocumentDone(
            sessionID,
            docResult.data.envelopeId,
            'EINVOICE',
            elogoAuth.webservice_url
          );
        }

        fetchedCount++;
      }

      console.log(`✅ ${fetchedCount} adet e-Logo fatura alındı ve işlendi`);

    } finally {
      // Always logout if we have a session ID
      if (sessionID && !logoutAttempted) {
        try {
          logoutAttempted = true;
          await SoapClient.logout(sessionID, elogoAuth.webservice_url);
          console.log('✅ e-Logo oturumu kapatıldı');
        } catch (logoutError: any) {
          console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      invoices,
      message: `${invoices.length} adet fatura alındı`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ e-Logo incoming invoices function hatası:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Return more detailed error information
    const errorMessage = error.message || 'Bilinmeyen hata oluştu';
    const statusCode = error.status || error.statusCode || 500;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
