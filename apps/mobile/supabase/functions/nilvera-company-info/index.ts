import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Get Nilvera auth settings
    const { data: nilveraAuth, error: authError } = await supabase
      .from('nilvera_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !nilveraAuth) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Nilvera kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Nilvera bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const { action, taxNumber } = await req.json();

    if (action === 'get_company_info') {
      try {
        console.log('🔍 Nilvera API üzerinden kendi firma bilgileri getiriliyor...');

        console.log('🔑 Nilvera API key kontrolü:', nilveraAuth.api_key ? 'Mevcut' : 'Bulunamadı');

        // Nilvera API Company endpoint'i - kendi firma bilgileri
        const nilveraApiUrl = nilveraAuth.test_mode 
          ? 'https://apitest.nilvera.com/general/Company'
          : 'https://api.nilvera.com/general/Company';
        
        console.log('📡 Nilvera API çağrısı yapılıyor...');
        console.log('📡 API URL:', nilveraApiUrl);

        // Nilvera API'dan kendi firma bilgilerini çek
        const companyResponse = await fetch(nilveraApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraAuth.api_key}`,
            'Accept': '*/*',
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 Nilvera API yanıt kodu:', companyResponse.status);

        if (!companyResponse.ok) {
          const errorText = await companyResponse.text();
          console.error('❌ Nilvera API hatası:', errorText);
          
          if (companyResponse.status === 401) {
            throw new Error('Nilvera API anahtarı geçersiz');
          } else if (companyResponse.status === 403) {
            throw new Error('Nilvera API erişim yetkisi yok');
          } else if (companyResponse.status === 404) {
            throw new Error('Firma bilgileri bulunamadı');
          } else {
            throw new Error(`Nilvera API hatası: ${companyResponse.status} - ${errorText}`);
          }
        }

        const companyData = await companyResponse.json();
        console.log('✅ Nilvera API yanıtı alındı:', JSON.stringify(companyData, null, 2));

        // Firma bilgilerini düzenle
        const formattedCompanyInfo = {
          name: companyData.Name || '',
          taxNumber: companyData.TaxNumber || '',
          taxOffice: companyData.TaxOffice || '',
          address: companyData.Address || '',
          district: companyData.District || '',
          city: companyData.City || '',
          country: companyData.Country || '',
          postalCode: companyData.PostalCode || '',
          phoneNumber: companyData.PhoneNumber || '',
          fax: companyData.Fax || '',
          email: companyData.Email || '',
          website: companyData.WebSite || '',
          isActive: companyData.IsActive || false,
          aliases: companyData.Aliases || [],
          // Ödeme bilgileri
          payeeFinancialAccountID: companyData.PayeeFinancialAccountID || '',
          paymentMeansChannelCode: companyData.PaymentMeansChannelCode || '',
          paymentMeansCode: companyData.PaymentMeansCode || ''
        };

        return new Response(JSON.stringify({ 
          success: true,
          data: formattedCompanyInfo,
          message: 'Firma bilgileri başarıyla getirildi'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('❌ Firma bilgileri alma hatası:', error);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message || 'Firma bilgileri alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Mükellef sorgulama işlemi için de bir endpoint ekleyelim
    if (action === 'search_mukellef') {
      if (!taxNumber || taxNumber.length < 10) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Geçerli bir vergi numarası giriniz (10-11 haneli)'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        console.log('🔍 Nilvera API üzerinden mükellef sorgulama:', taxNumber);

        console.log('🔑 Nilvera API key kontrolü:', nilveraAuth.api_key ? 'Mevcut' : 'Bulunamadı');

        // Mükellef sorgulama endpoint'i - VKN ile doğrudan sorgulama
        const globalCompanyUrl = nilveraAuth.test_mode 
          ? 'https://apitest.nilvera.com/general/GlobalCompany/GetGlobalCustomerInfo'
          : 'https://api.nilvera.com/general/GlobalCompany/GetGlobalCustomerInfo';
        const mukellefApiUrl = `${globalCompanyUrl}/${taxNumber}`;
        
        console.log('📡 Mükellef sorgulama API çağrısı yapılıyor...');
        console.log('📡 API URL:', mukellefApiUrl);

        console.log('📡 API çağrısı yapılıyor...');
        console.log('📡 Headers:', {
          'Authorization': `Bearer ${nilveraAuth.api_key.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        });

        const mukellefResponse = await fetch(mukellefApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraAuth.api_key}`,
            'Accept': '*/*',
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 Mükellef API yanıt kodu:', mukellefResponse.status);

        if (!mukellefResponse.ok) {
          const errorText = await mukellefResponse.text();
          console.error('❌ Mükellef API hatası:', {
            status: mukellefResponse.status,
            statusText: mukellefResponse.statusText,
            errorText: errorText,
            url: mukellefApiUrl,
            taxNumber: taxNumber
          });
          
          if (mukellefResponse.status === 404) {
            console.log('ℹ️ Mükellef bulunamadı (404) - e-fatura mükellefi değil');
            return new Response(JSON.stringify({ 
              success: true,
              isEinvoiceMukellef: false,
              message: 'Bu vergi numarası e-fatura mükellefi değil'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (mukellefResponse.status === 401) {
            throw new Error('Nilvera API anahtarı geçersiz veya süresi dolmuş');
          } else if (mukellefResponse.status === 403) {
            throw new Error('Nilvera API erişim yetkisi yok');
          } else if (mukellefResponse.status === 429) {
            throw new Error('Nilvera API rate limit aşıldı, lütfen daha sonra tekrar deneyin');
          } else {
            throw new Error(`Mükellef API hatası: ${mukellefResponse.status} - ${errorText}`);
          }
        }

        const mukellefData = await mukellefResponse.json();
        console.log('✅ GlobalCompany API yanıtı alındı:', JSON.stringify(mukellefData, null, 2));

        // GetGlobalCustomerInfo yanıtını işle - tek mükellef döndürür
        let isEinvoiceMukellef = false;
        let formattedData = null;

        console.log('🔍 API yanıt formatı:', typeof mukellefData);
        console.log('🔍 API yanıt içeriği:', JSON.stringify(mukellefData, null, 2));

        if (mukellefData && mukellefData.TaxNumber) {
          console.log('🎯 Mükellef bulundu:', mukellefData.TaxNumber);
          console.log('🎯 Mükellef detayları:', JSON.stringify(mukellefData, null, 2));
          console.log('🎯 Aliases var mı?', mukellefData.Aliases ? 'EVET' : 'HAYIR');
          console.log('🎯 Aliases uzunluğu:', mukellefData.Aliases ? mukellefData.Aliases.length : 0);
          
          if (mukellefData.Aliases) {
            mukellefData.Aliases.forEach((alias, index) => {
              console.log(`🎯 Alias ${index}:`, {
                Name: alias.Name,
                DeletionTime: alias.DeletionTime,
                startsWithUrnMail: alias.Name ? alias.Name.startsWith('urn:mail:') : false,
                isActive: alias.DeletionTime === null
              });
            });
          }
          
          // Aliases array'inde e-fatura alias'ı var mı kontrol et
          const hasEinvoiceAlias = mukellefData.Aliases && 
            mukellefData.Aliases.some(alias => 
              alias.Name && 
              alias.Name.startsWith('urn:mail:') && 
              alias.DeletionTime === null
            );
          
          console.log('🎯 E-fatura alias var mı?', hasEinvoiceAlias ? 'EVET' : 'HAYIR');
          
          if (hasEinvoiceAlias) {
            isEinvoiceMukellef = true;
            const einvoiceAlias = mukellefData.Aliases.find(alias => 
              alias.Name && 
              alias.Name.startsWith('urn:mail:') && 
              alias.DeletionTime === null
            );
            
            console.log('🎯 E-fatura alias detayı:', einvoiceAlias);
            
            formattedData = {
              aliasName: einvoiceAlias?.Name || '',
              companyName: mukellefData.Title || mukellefData.Name || '',
              taxNumber: mukellefData.TaxNumber || '',
              taxOffice: mukellefData.TaxOffice || '',
              address: mukellefData.Address || '',
              city: mukellefData.City || '',
              district: mukellefData.District || '',
              mersisNo: mukellefData.MersisNo || '',
              sicilNo: mukellefData.SicilNo || '',
              accountType: mukellefData.AccountType || '',
              type: mukellefData.Type || ''
            };
          }
        } else {
          console.log('❌ Mükellef bulunamadı veya geçersiz yanıt formatı');
        }

        return new Response(JSON.stringify({ 
          success: true,
          isEinvoiceMukellef,
          data: formattedData,
          message: isEinvoiceMukellef ? 
            'Bu vergi numarası e-fatura mükellefidir' : 
            'Bu vergi numarası e-fatura mükellefi değil'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('❌ Mükellef sorgulama hatası:', error);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message || 'Mükellef sorgulaması yapılamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Geçersiz işlem');

  } catch (error) {
    console.error('❌ Nilvera company info function hatası:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
