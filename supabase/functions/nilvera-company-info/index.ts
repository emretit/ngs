import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { action, taxNumber } = await req.json();

    if (action === 'get_company_info') {
      // Vergi numarası kontrolü
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
        console.log('🔍 Nilvera API üzerinden firma bilgileri getiriliyor:', taxNumber);

        // Nilvera API anahtarını environment'tan al
        const nilveraApiKey = Deno.env.get('NILVERA_API_KEY');
        if (!nilveraApiKey) {
          throw new Error('Nilvera API anahtarı bulunamadı');
        }

        // Nilvera API test URL'i - dokümantasyona göre
        const nilveraApiUrl = 'https://apitest.nilvera.com/general/Company';
        
        console.log('📡 Nilvera API çağrısı yapılıyor...');
        console.log('📡 API URL:', nilveraApiUrl);
        console.log('📡 Vergi No:', taxNumber);

        // Nilvera API'dan firma bilgilerini çek
        const companyResponse = await fetch(nilveraApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraApiKey}`,
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
            throw new Error('Belirtilen firma bulunamadı');
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

        const nilveraApiKey = Deno.env.get('NILVERA_API_KEY');
        if (!nilveraApiKey) {
          throw new Error('Nilvera API anahtarı bulunamadı');
        }

        // Mükellef sorgulama endpoint'i
        const mukellefApiUrl = `https://apitest.nilvera.com/general/TaxPayers/SearchByVKN?vkn=${taxNumber}`;
        
        console.log('📡 Mükellef sorgulama API çağrısı yapılıyor...');
        console.log('📡 API URL:', mukellefApiUrl);

        const mukellefResponse = await fetch(mukellefApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraApiKey}`,
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 Mükellef API yanıt kodu:', mukellefResponse.status);

        if (!mukellefResponse.ok) {
          const errorText = await mukellefResponse.text();
          console.error('❌ Mükellef API hatası:', errorText);
          
          if (mukellefResponse.status === 404) {
            return new Response(JSON.stringify({ 
              success: true,
              isEinvoiceMukellef: false,
              message: 'Bu vergi numarası e-fatura mükellefi değil'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          throw new Error(`Mükellef API hatası: ${mukellefResponse.status} - ${errorText}`);
        }

        const mukellefData = await mukellefResponse.json();
        console.log('✅ Mükellef API yanıtı alındı:', JSON.stringify(mukellefData, null, 2));

        // Mükellef bilgilerini formatla
        const isEinvoiceMukellef = mukellefData && mukellefData.length > 0;
        let formattedData = null;

        if (isEinvoiceMukellef && mukellefData[0]) {
          const taxpayer = mukellefData[0];
          formattedData = {
            aliasName: taxpayer.AliasName || '',
            companyName: taxpayer.Title || taxpayer.Name || '',
            taxNumber: taxpayer.VKN || '',
            taxOffice: taxpayer.TaxOffice || '',
            address: taxpayer.Address || '',
            city: taxpayer.City || '',
            district: taxpayer.District || '',
            mersisNo: taxpayer.MersisNo || '',
            sicilNo: taxpayer.SicilNo || ''
          };
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
