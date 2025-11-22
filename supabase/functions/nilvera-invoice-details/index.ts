import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Nilvera invoice details function started');
    console.log('📋 Request method:', req.method);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL) {
      console.error('❌ SUPABASE_URL is not set');
      throw new Error('SUPABASE_URL environment variable is required');
    }

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

    const { invoiceId, envelopeUUID } = requestBody;
    console.log('📨 Invoice ID:', invoiceId);
    console.log('📨 Envelope UUID:', envelopeUUID);
    console.log('👤 User ID:', user.id);

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
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

    // Fetch invoice details from Nilvera API
    try {
      console.log('🔄 Starting Nilvera API call for invoice details...');
      console.log('🔑 Using API key:', nilveraAuth.api_key ? `${nilveraAuth.api_key.substring(0, 8)}...` : 'MISSING');
      console.log('📄 Invoice ID:', invoiceId);

      // Get invoice details using the correct endpoint
      const apiUrl = `https://apitest.nilvera.com/einvoice/Purchase/${invoiceId}/Details`;
      console.log('🌐 Detail Endpoint:', apiUrl);

      const nilveraResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${nilveraAuth.api_key}`,
          'Accept': 'application/json'
        }
      });

      console.log('📡 API Response Status:', nilveraResponse.status);
      console.log('📡 API Response Headers:', Object.fromEntries(nilveraResponse.headers.entries()));

      if (!nilveraResponse.ok) {
        const errorText = await nilveraResponse.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Nilvera API error: ${nilveraResponse.status} - ${errorText}`);
      }

      const nilveraData = await nilveraResponse.json();
      console.log('✅ Nilvera API Response received');
      console.log('📊 Response keys:', Object.keys(nilveraData));

      // Also try to get the XML content which should contain line items
      let xmlContent = null;
      try {
        const xmlUrl = `https://apitest.nilvera.com/einvoice/Purchase/${invoiceId}/xml`;
        console.log('🌐 XML Endpoint:', xmlUrl);

        const xmlResponse = await fetch(xmlUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraAuth.api_key}`,
            'Accept': 'application/xml'
          }
        });

        if (xmlResponse.ok) {
          xmlContent = await xmlResponse.text() as string;
          console.log('✅ XML content retrieved');
        } else {
          console.log('⚠️ Could not retrieve XML content:', xmlResponse.status);
        }
      } catch (xmlError: any) {
        console.log('⚠️ XML fetch error:', xmlError.message);
      }

      // UBL-TR birim kodlarını dropdown değerlerine çevir
      const mapUBLTRToUnit = (ubltrCode: string): string => {
        if (!ubltrCode) return 'adet';
        
        const codeUpper = ubltrCode.toUpperCase();
        const codeLower = ubltrCode.toLowerCase();
        
        // UBL-TR kodlarını dropdown değerlerine çevir
        const ubltrToUnitMap: Record<string, string> = {
          'C62': 'adet', 'MTR': 'm', 'MTK': 'm2', 'MTQ': 'm3',
          'KGM': 'kg', 'GRM': 'g', 'LTR': 'lt', 'MLT': 'ml',
          'HUR': 'saat', 'DAY': 'gün', 'MON': 'ay', 'WEE': 'hafta',
          'PA': 'paket', 'CT': 'kutu'
        };
        
        // Önce direkt kod kontrolü
        if (ubltrToUnitMap[codeUpper]) return ubltrToUnitMap[codeUpper];
        
        // Eğer zaten dropdown değeri formatındaysa direkt döndür
        const dropdownValues = ['adet', 'kg', 'g', 'm', 'm2', 'm3', 'lt', 'ml', 'paket', 'kutu', 'saat', 'gün', 'hafta', 'ay'];
        if (dropdownValues.includes(codeLower)) return codeLower;
        
        // Okunabilir formatları da destekle
        const readableMap: Record<string, string> = {
          'adet': 'adet', 'kilogram': 'kg', 'gram': 'g',
          'metre': 'm', 'metrekare': 'm2', 'metreküp': 'm3',
          'litre': 'lt', 'mililitre': 'ml', 'paket': 'paket', 'kutu': 'kutu',
          'saat': 'saat', 'gün': 'gün', 'hafta': 'hafta', 'ay': 'ay',
          'Adet': 'adet', 'Kg': 'kg', 'Lt': 'lt', 'M': 'm',
          'M2': 'm2', 'M3': 'm3', 'Paket': 'paket', 'Kutu': 'kutu'
        };
        
        return readableMap[codeLower] || readableMap[ubltrCode] || 'adet';
      };

      // Parse invoice line items from the response
      let invoiceItems: any[] = [];

      // First try to extract from the detail response
      if (nilveraData.Lines && Array.isArray(nilveraData.Lines)) {
        invoiceItems = nilveraData.Lines.map((line: any, index: number) => {
          // Birim bilgisini al ve UBL-TR kodundan dropdown değerine çevir
          const rawUnit = line.Unit || line.UnitCode || line.UnitType || 'C62';
          const unit = mapUBLTRToUnit(rawUnit);
          
          return {
          id: `line-${index}`,
          description: line.Description || line.Name || '',
          productCode: line.ProductCode || line.ItemCode || '',
          quantity: parseFloat(line.Quantity || 0),
            unit: unit, // UBL-TR kodundan çevrilmiş dropdown değeri
          unitPrice: parseFloat(line.UnitPrice || line.Price || 0),
          vatRate: parseFloat(line.VATRate || line.TaxRate || 18),
          vatAmount: parseFloat(line.VATAmount || line.TaxAmount || 0),
          totalAmount: parseFloat(line.TotalAmount || line.LineTotal || 0),
          discountRate: parseFloat(line.DiscountRate || 0),
          discountAmount: parseFloat(line.DiscountAmount || 0),
          // Additional fields that might be useful
          lineNumber: line.LineNumber || index + 1,
          category: line.Category || null,
          brand: line.Brand || null,
          specifications: line.Specifications || null
          };
        });
      }

      // If no lines found in detail response, try to parse from XML
      if (invoiceItems.length === 0 && xmlContent) {
        console.log('🔍 Trying to parse line items from XML using fast-xml-parser...');

        try {
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
            textNodeName: '#text'
          });

          const xmlObj = parser.parse(xmlContent);
          console.log('✅ XML parsed successfully');

          // Navigate through the XML structure to find invoice lines
          const invoice = xmlObj?.Invoice || xmlObj?.['cac:Invoice'] || xmlObj;
          const invoiceLines = invoice?.['cac:InvoiceLine'] || [];

          // Ensure invoiceLines is an array
          const linesArray = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

          if (linesArray.length > 0) {
            console.log(`📊 Found ${linesArray.length} invoice lines in XML`);

            invoiceItems = linesArray.map((line: any, index: number) => {
              // Extract item information
              const item = line?.['cac:Item'] || {};
              const price = line?.['cac:Price'] || {};
              const taxTotal = line?.['cac:TaxTotal']?.['cac:TaxSubtotal'] || {};
              const quantity = line?.['cbc:InvoicedQuantity'] || {};
              
              // XML'den gelen birim kodunu UBL-TR kodundan dropdown değerine çevir
              const rawUnit = quantity?.['@unitCode'] || 'C62';
              const unit = mapUBLTRToUnit(rawUnit);

              return {
                id: `xml-line-${index}`,
                description: item?.['cbc:Name'] || item?.['cbc:Description'] || `Ürün ${index + 1}`,
                productCode: line?.['cbc:ID'] || item?.['cac:SellersItemIdentification']?.['cbc:ID'] || '',
                quantity: parseFloat(quantity?.['#text'] || quantity || '1'),
                unit: unit, // UBL-TR kodundan çevrilmiş dropdown değeri
                unitPrice: parseFloat(price?.['cbc:PriceAmount']?.['#text'] || price?.['cbc:PriceAmount'] || '0'),
                vatRate: parseFloat(taxTotal?.['cac:TaxCategory']?.['cbc:Percent'] || '18'),
                vatAmount: parseFloat(taxTotal?.['cbc:TaxAmount']?.['#text'] || taxTotal?.['cbc:TaxAmount'] || '0'),
                totalAmount: parseFloat(line?.['cbc:LineExtensionAmount']?.['#text'] || line?.['cbc:LineExtensionAmount'] || '0'),
                discountRate: 0,
                discountAmount: 0,
                lineNumber: line?.['cbc:ID'] || index + 1
              };
            });

            console.log(`✅ Successfully parsed ${invoiceItems.length} items from XML`);
          } else {
            console.log('⚠️ No invoice lines found in XML structure');
          }
        } catch (xmlParseError: any) {
          console.log('⚠️ XML parsing error:', xmlParseError.message);
          console.log('📋 XML structure sample:', xmlContent?.substring(0, 500));
        }
      }

      // If still no items found, create a mock item based on invoice totals
      if (invoiceItems.length === 0) {
        console.log('⚠️ No line items found, creating mock item from invoice totals');
        invoiceItems = [{
          id: 'mock-item-1',
          description: 'Fatura Kalemi (Detay bulunamadı)',
          productCode: '',
          quantity: 1,
          unit: 'Adet',
          unitPrice: nilveraData.TaxExclusiveAmount || nilveraData.PayableAmount || 0,
          vatRate: 18,
          vatAmount: nilveraData.TaxTotalAmount || 0,
          totalAmount: nilveraData.PayableAmount || 0,
          discountRate: 0,
          discountAmount: 0,
          lineNumber: 1
        }];
      }

      console.log('📊 Parsed invoice items:', invoiceItems.length);
      console.log('📄 First item sample:', invoiceItems[0]);

      // Parse supplier information from XML or API response
      let supplierInfo: any = {};
      let accountingSupplierParty: any = null;

      // Try to extract supplier info from XML
      if (xmlContent) {
        try {
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
            textNodeName: '#text'
          });

          const xmlObj = parser.parse(xmlContent);
          const invoice = xmlObj?.Invoice || xmlObj?.['cac:Invoice'] || xmlObj;
          
          // Extract AccountingSupplierParty from XML
          accountingSupplierParty = invoice?.['cac:AccountingSupplierParty'] || invoice?.['AccountingSupplierParty'];
          
          if (accountingSupplierParty) {
            const party = accountingSupplierParty?.['cac:Party'] || accountingSupplierParty?.['Party'] || accountingSupplierParty;
            const partyName = party?.['cac:PartyName'] || party?.['PartyName'] || {};
            const partyIdentification = party?.['cac:PartyIdentification'] || party?.['PartyIdentification'] || {};
            const postalAddress = party?.['cac:PostalAddress'] || party?.['PostalAddress'] || {};
            const contact = party?.['cac:Contact'] || party?.['Contact'] || {};
            const partyTaxScheme = party?.['cac:PartyTaxScheme'] || party?.['PartyTaxScheme'] || {};
            
            // Debug: Log the structure
            console.log('🔍 AccountingSupplierParty structure:', JSON.stringify(accountingSupplierParty, null, 2).substring(0, 2000));
            console.log('🔍 Party structure:', JSON.stringify(party, null, 2).substring(0, 2000));
            console.log('🔍 PartyTaxScheme:', JSON.stringify(partyTaxScheme, null, 2).substring(0, 1000));
            console.log('🔍 PartyIdentification:', JSON.stringify(partyIdentification, null, 2).substring(0, 1000));
            console.log('🔍 Nilvera API SenderTaxNumber:', nilveraData.SenderTaxNumber);
            console.log('🔍 Nilvera API all keys:', Object.keys(nilveraData));
            
            // Extract VKN from PartyTaxScheme - this is where VKN is usually stored in UBL-TR
            let taxNumber = nilveraData.SenderTaxNumber || nilveraData.SupplierTaxNumber || nilveraData.TaxNumber || '';
            
            // Try to get VKN from PartyTaxScheme/CompanyID
            if (partyTaxScheme && Object.keys(partyTaxScheme).length > 0) {
              // PartyTaxScheme can be an array or single object
              const taxSchemeArray = Array.isArray(partyTaxScheme) ? partyTaxScheme : [partyTaxScheme];
              
              for (const taxSchemeItem of taxSchemeArray) {
                const taxScheme = taxSchemeItem?.['cac:TaxScheme'] || taxSchemeItem?.['TaxScheme'] || {};
                const companyId = taxSchemeItem?.['cac:CompanyID'] || taxSchemeItem?.['CompanyID'] || taxSchemeItem?.['cbc:CompanyID'] || {};
                
                console.log('🔍 TaxScheme item:', JSON.stringify(taxSchemeItem, null, 2).substring(0, 500));
                console.log('🔍 CompanyID:', JSON.stringify(companyId, null, 2).substring(0, 500));
                
                // VKN can be in CompanyID field (can be object with #text or direct value)
                let companyIdValue = '';
                if (typeof companyId === 'string') {
                  companyIdValue = companyId;
                } else if (companyId?.['#text']) {
                  companyIdValue = companyId['#text'];
                } else if (companyId?.['cbc:CompanyID']?.['#text']) {
                  companyIdValue = companyId['cbc:CompanyID']['#text'];
                } else if (companyId) {
                  companyIdValue = String(companyId);
                }
                
                if (companyIdValue && typeof companyIdValue === 'string' && companyIdValue.length >= 10 && /^\d+$/.test(companyIdValue)) {
                  taxNumber = companyIdValue;
                  console.log('✅ VKN found in CompanyID:', taxNumber);
                  break;
                }
                
                // Or in TaxScheme ID
                let taxSchemeId = '';
                if (typeof taxScheme === 'string') {
                  taxSchemeId = taxScheme;
                } else {
                  taxSchemeId = taxScheme?.['cbc:ID']?.['#text'] || taxScheme?.['cbc:ID'] || taxScheme?.['ID']?.['#text'] || taxScheme?.['ID'] || '';
                }
                
                if (taxSchemeId && typeof taxSchemeId === 'string' && taxSchemeId.length >= 10 && /^\d+$/.test(taxSchemeId)) {
                  taxNumber = taxSchemeId;
                  console.log('✅ VKN found in TaxScheme ID:', taxNumber);
                  break;
                }
              }
            }
            
            // Fallback to PartyIdentification if VKN not found
            if (!taxNumber || taxNumber.length < 10) {
              const partyIdArray = Array.isArray(partyIdentification) ? partyIdentification : (partyIdentification ? [partyIdentification] : []);
              
              console.log('🔍 Checking PartyIdentification array, length:', partyIdArray.length);
              
              for (const id of partyIdArray) {
                if (!id) continue;
                
                console.log('🔍 PartyIdentification item:', JSON.stringify(id, null, 2).substring(0, 500));
                
                let idValue = '';
                if (typeof id === 'string') {
                  idValue = id;
                } else {
                  idValue = id?.['cbc:ID']?.['#text'] || id?.['cbc:ID'] || id?.['ID']?.['#text'] || id?.['ID'] || '';
                }
                
                // Check schemeID attribute (can be @schemeID or schemeID)
                const schemeId = id?.['@schemeID'] || id?.['schemeID'] || id?.['@schemeID'] || '';
                
                console.log('🔍 ID value:', idValue, 'schemeID:', schemeId);
                
                // VKN usually has schemeID="VKN" or is a 10-11 digit number
                if (schemeId === 'VKN' || schemeId === 'vkn' || (typeof idValue === 'string' && idValue.length >= 10 && /^\d+$/.test(idValue))) {
                  taxNumber = String(idValue);
                  console.log('✅ VKN found in PartyIdentification:', taxNumber);
                  break;
                }
              }
            }
            
            // Final fallback: Check if taxNumber is still empty, try to find any 10+ digit number in the party structure
            if (!taxNumber || taxNumber.length < 10) {
              const partyString = JSON.stringify(party);
              const vknMatch = partyString.match(/\b\d{10,11}\b/);
              if (vknMatch) {
                taxNumber = vknMatch[0];
                console.log('✅ VKN found via regex in party structure:', taxNumber);
              }
            }
            
            supplierInfo = {
              companyName: partyName?.['cbc:Name']?.['#text'] || partyName?.['cbc:Name'] || partyName?.['Name'] || nilveraData.SenderName,
              taxNumber: taxNumber || nilveraData.SenderTaxNumber || '',
              tradeRegistryNumber: null, // Will be extracted separately if needed
              email: contact?.['cbc:ElectronicMail']?.['#text'] || contact?.['cbc:ElectronicMail'] || contact?.['ElectronicMail'] || null,
              phone: contact?.['cbc:Telephone']?.['#text'] || contact?.['cbc:Telephone'] || contact?.['Telephone'] || null,
              fax: contact?.['cbc:Telefax']?.['#text'] || contact?.['cbc:Telefax'] || contact?.['Telefax'] || null,
              website: contact?.['cbc:WebsiteURI']?.['#text'] || contact?.['cbc:WebsiteURI'] || contact?.['WebsiteURI'] || null,
              address: {
                street: postalAddress?.['cbc:StreetName']?.['#text'] || postalAddress?.['cbc:StreetName'] || postalAddress?.['StreetName'] || null,
                district: postalAddress?.['cbc:CitySubdivisionName']?.['#text'] || postalAddress?.['cbc:CitySubdivisionName'] || postalAddress?.['CitySubdivisionName'] || null,
                city: postalAddress?.['cbc:CityName']?.['#text'] || postalAddress?.['cbc:CityName'] || postalAddress?.['CityName'] || null,
                postalCode: postalAddress?.['cbc:PostalZone']?.['#text'] || postalAddress?.['cbc:PostalZone'] || postalAddress?.['PostalZone'] || null,
                country: postalAddress?.['cac:Country']?.['cbc:Name']?.['#text'] || postalAddress?.['cac:Country']?.['cbc:Name'] || postalAddress?.['Country']?.['Name'] || 'Türkiye'
              },
              taxScheme: {
                taxSchemeId: partyTaxScheme?.['cac:TaxScheme']?.['cbc:ID']?.['#text'] || partyTaxScheme?.['cac:TaxScheme']?.['cbc:ID'] || null,
                taxSchemeName: partyTaxScheme?.['cac:TaxScheme']?.['cbc:Name']?.['#text'] || partyTaxScheme?.['cac:TaxScheme']?.['cbc:Name'] || null
              }
            };
            
            console.log('✅ Supplier info extracted from XML:', supplierInfo);
            console.log('🔍 VKN extraction details:', {
              fromPartyTaxScheme: partyTaxScheme ? 'found' : 'not found',
              fromPartyIdentification: partyIdentification ? 'found' : 'not found',
              finalTaxNumber: taxNumber
            });
          }
        } catch (xmlParseError: any) {
          console.log('⚠️ Error parsing supplier info from XML:', xmlParseError.message);
        }
      }

      // Fallback to API response if XML parsing failed
      if (!supplierInfo.companyName) {
        supplierInfo = {
          companyName: nilveraData.SenderName || nilveraData.SupplierName || nilveraData.CompanyName || null,
          taxNumber: nilveraData.SenderTaxNumber || nilveraData.SupplierTaxNumber || nilveraData.TaxNumber || nilveraData.SenderIdentifier || null,
          email: nilveraData.SupplierEmail || nilveraData.Email || null,
          phone: nilveraData.SupplierPhone || nilveraData.Phone || null,
          address: {
            city: nilveraData.SupplierCity || nilveraData.City || null,
            country: 'Türkiye'
          }
        };
        console.log('📋 Supplier info from API fallback:', supplierInfo);
      }
      
      // Ensure we have at least basic supplier info from API response
      if (!supplierInfo.companyName && nilveraData.SenderName) {
        supplierInfo.companyName = nilveraData.SenderName;
      }
      if (!supplierInfo.taxNumber && nilveraData.SenderTaxNumber) {
        supplierInfo.taxNumber = nilveraData.SenderTaxNumber;
      }

      // Extract financial amounts - check multiple possible field names
      // Nilvera API can return: InvoiceAmount (total with tax), TaxAmount (tax only), TaxExclusiveAmount, TaxTotalAmount, PayableAmount
      const invoiceAmount = parseFloat(nilveraData.InvoiceAmount || nilveraData.invoiceAmount || '0');
      const taxAmount = parseFloat(nilveraData.TaxAmount || nilveraData.taxAmount || '0');
      const taxExclusiveAmount = parseFloat(nilveraData.TaxExclusiveAmount || nilveraData.taxExclusiveAmount || '0');
      const taxTotalAmount = parseFloat(nilveraData.TaxTotalAmount || nilveraData.taxTotalAmount || '0');
      const payableAmount = parseFloat(nilveraData.PayableAmount || nilveraData.payableAmount || nilveraData.TotalAmount || nilveraData.totalAmount || '0');
      
      // Calculate subtotal if not provided
      // If InvoiceAmount and TaxAmount are provided, calculate: InvoiceAmount - TaxAmount
      let apiSubtotal = taxExclusiveAmount;
      if (apiSubtotal === 0 && invoiceAmount > 0 && taxAmount > 0) {
        apiSubtotal = invoiceAmount - taxAmount;
      }
      
      // Use TaxAmount if TaxTotalAmount is not provided
      const apiTaxTotal = taxTotalAmount > 0 ? taxTotalAmount : taxAmount;
      
      // Use InvoiceAmount if PayableAmount is not provided
      const apiTotal = payableAmount > 0 ? payableAmount : invoiceAmount;
      
      // Calculate totals from line items if available
      let calculatedSubtotal = 0;
      let calculatedTaxTotal = 0;
      let calculatedTotal = 0;
      
      if (invoiceItems.length > 0) {
        calculatedSubtotal = invoiceItems.reduce((sum, item) => {
          const lineTotal = parseFloat(item.totalAmount || 0);
          const lineTax = parseFloat(item.vatAmount || 0);
          return sum + (lineTotal - lineTax);
        }, 0);
        
        calculatedTaxTotal = invoiceItems.reduce((sum, item) => {
          return sum + parseFloat(item.vatAmount || 0);
        }, 0);
        
        calculatedTotal = invoiceItems.reduce((sum, item) => {
          return sum + parseFloat(item.totalAmount || 0);
        }, 0);
      }

      // Use calculated values if API values are 0 or missing, otherwise use API values
      const finalSubtotal = apiSubtotal > 0 ? apiSubtotal : calculatedSubtotal;
      const finalTaxTotal = apiTaxTotal > 0 ? apiTaxTotal : calculatedTaxTotal;
      const finalTotal = apiTotal > 0 ? apiTotal : calculatedTotal;

      console.log('💰 Financial amounts:', {
        invoiceAmount,
        taxAmount,
        taxExclusiveAmount,
        taxTotalAmount,
        payableAmount,
        apiSubtotal,
        apiTaxTotal,
        apiTotal,
        calculatedSubtotal,
        calculatedTaxTotal,
        calculatedTotal,
        finalSubtotal,
        finalTaxTotal,
        finalTotal
      });

      // Build invoice details object with correct field names
      const invoiceDetailsResponse = {
        id: invoiceId,
        InvoiceNumber: nilveraData.InvoiceNumber || nilveraData.invoiceNumber || nilveraData.ID,
        IssueDate: nilveraData.IssueDate || nilveraData.issueDate || nilveraData.InvoiceDate,
        CurrencyCode: nilveraData.CurrencyCode || nilveraData.currency || 'TRY',
        // Financial amounts - use calculated/parsed values
        TaxExclusiveAmount: finalSubtotal,
        TaxTotalAmount: finalTaxTotal,
        PayableAmount: finalTotal,
        // Additional fields from original response
        ...nilveraData,
        // Override with parsed/calculated values (these come after spread to ensure they take precedence)
        TaxExclusiveAmount: finalSubtotal,
        TaxTotalAmount: finalTaxTotal,
        PayableAmount: finalTotal,
        SenderName: supplierInfo.companyName || nilveraData.SenderName,
        SenderTaxNumber: supplierInfo.taxNumber || nilveraData.SenderTaxNumber,
        // Supplier info object
        supplierInfo: supplierInfo,
        AccountingSupplierParty: accountingSupplierParty,
        items: invoiceItems,
        xmlContent: xmlContent
      };

      return new Response(JSON.stringify({
        success: true,
        invoiceDetails: invoiceDetailsResponse
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError: any) {
      console.error('❌ Nilvera API call failed:', apiError);
      console.error('❌ Error details:', {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name
      });

      // Return error response
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message,
        invoiceDetails: null
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Error in nilvera-invoice-details function:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unknown error occurred',
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});