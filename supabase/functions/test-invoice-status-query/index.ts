import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

/**
 * Test Edge Function: Direkt E-Arşiv Fatura Durum Sorgulama
 * 
 * Bu function doğrudan Veriban SOAP API'sine bağlanarak
 * EAR2026000000002 numaralı faturanın durumunu sorgular
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🔍 Test E-Arşiv Fatura Durum Sorgulama Başlatılıyor...');
    
    // Hardcoded values for testing
    const sessionCode = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NDdhZmFiNS1jNjYwLTQ4YjMtOWFmYy1hMjE2MTcwMzQ2ODAiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIyMTcxOCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJOR1NATkdTIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZ2l2ZW5uYW1lIjoiTkdTIMSwTEVUxLDFnsSwTSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3N1cm5hbWUiOiJURUtOT0xPSsSwTEVSxLAiLCJHaG9zdFVzZXIiOiJGYWxzZSIsIkFjY291bnRVbmlxdWVJZCI6IkU2N0Y3M0EyLUMzMkEtNDlBQi1BMDcxLTVENURFMDRGNjA5OSIsIkFjY291bnRUaXRsZSI6Ik5HUyDEsExFVMSwxZ7EsE0gVEVLTk9MT0rEsExFUsSwIFZFIEfDnFZFTkzEsEsgU8SwU1RFTUxFUsSwIEzEsE3EsFRFRCDFnsSwUktFVMSwIiwiQWNjb3VudFJlZ2lzdGVyTnVtYmVyIjoiNjMxMTgzNTk0MiIsIkFjY291bnRCcmFuY2hDb2RlIjoiIiwiQ2xpZW50SVAiOiIxMC4xLjEuMjA3IiwiQ2xpZW50QWdlbnQiOiJFSW52b2ljZVdlYlNlcnZpY2VfSW50ZWdyYXRpb25TZXJ2aWNlX0xvZ2luIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjpbIntcIlZlcmliYW5TeXN0ZW1UeXBlXCI6MTEsXCJBY2NvdW50UHJvY2Vzc1R5cGVcIjoxfSIsIntcIlZlcmliYW5TeXN0ZW1UeXBlXCI6MTIsXCJBY2NvdW50UHJvY2Vzc1R5cGVcIjoxfSJdLCJuYmYiOjE3NjgyOTE3ODksImV4cCI6MTc2ODMzNDk4OSwiaXNzIjoidmVyaWJhbi5jb20udHIiLCJhdWQiOiJ2ZXJpYmFuLmNvbS50ciJ9.0XH4eSAbz0RvxpbWKhv94f71mDfEhZFxNBYa5SxuatA';
    const webserviceUrl = 'https://efaturatransfer.veriban.com.tr/IntegrationService.svc';
    const invoiceNumber = 'EAR2026000000002';
    const invoiceUUID = '0740f0c7-667a-4516-9b7e-5beba36b4dad';
    const transferId = 'A455298B-17C1-409D-870E-01F8017009E1';
    
    console.log('📋 Test Parametreleri:');
    console.log('  Fatura No:', invoiceNumber);
    console.log('  ETTN:', invoiceUUID);
    console.log('  Transfer ID:', transferId);
    console.log('  Session Code Length:', sessionCode.length);
    
    // 1. Transfer Durumunu Kontrol Et
    console.log('\n📦 1. Transfer Durumu Sorgulanıyor...');
    const transferResult = await VeribanSoapClient.getTransferStatus(
      sessionCode,
      transferId,
      webserviceUrl
    );
    
    console.log('Transfer Result:', JSON.stringify(transferResult, null, 2));
    
    // 2. Fatura Durum Sorgulama (Fatura Numarası ile)
    console.log('\n📄 2. Fatura Durumu Sorgulanıyor (Invoice Number ile)...');
    const statusResultByNumber = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
      sessionCode,
      invoiceNumber,
      webserviceUrl
    );
    
    console.log('Status Result (by Number):', JSON.stringify(statusResultByNumber, null, 2));
    
    // 3. Fatura Durum Sorgulama (UUID ile - alternatif)
    console.log('\n🆔 3. Fatura Durumu Sorgulanıyor (UUID ile)...');
    const statusResultByUUID = await VeribanSoapClient.getSalesInvoiceStatus(
      sessionCode,
      invoiceUUID,
      webserviceUrl
    );
    
    console.log('Status Result (by UUID):', JSON.stringify(statusResultByUUID, null, 2));
    
    // Sonuçları topla
    const results = {
      invoiceNumber,
      invoiceUUID,
      transferId,
      transferStatus: transferResult,
      invoiceStatusByNumber: statusResultByNumber,
      invoiceStatusByUUID: statusResultByUUID,
    };
    
    // Durum analizi
    let analysis = '\n📊 Durum Analizi:\n';
    
    if (transferResult.success) {
      const transferState = transferResult.data?.stateCode;
      analysis += `✅ Transfer Durumu: ${transferState}\n`;
      analysis += `   - ${transferState === 5 ? '✅ Başarılı' : transferState === 4 ? '❌ Hatalı' : '⏳ İşleniyor'}\n`;
    } else {
      analysis += `❌ Transfer Durumu Alınamadı: ${transferResult.error}\n`;
    }
    
    if (statusResultByNumber.success) {
      const state = statusResultByNumber.data?.stateCode;
      const stateName = statusResultByNumber.data?.stateName;
      const invoiceProfile = statusResultByNumber.data?.invoiceProfile;
      analysis += `\n✅ Fatura Durumu (Number): StateCode=${state}\n`;
      analysis += `   - State Name: ${stateName}\n`;
      analysis += `   - Invoice Profile: ${invoiceProfile || '(yok)'}\n`;
      analysis += `   - ${state === 5 ? '✅ GİB\'e iletildi' : state === 4 ? '❌ Hatalı' : state === 3 ? '⏳ Gönderim listesinde' : '⏳ İşleniyor'}\n`;
      
      if (statusResultByNumber.data?.errorMessage) {
        analysis += `   ⚠️ Hata: ${statusResultByNumber.data.errorMessage}\n`;
      }
      if (statusResultByNumber.data?.stateDescription) {
        analysis += `   📝 Açıklama: ${statusResultByNumber.data.stateDescription}\n`;
      }
    } else {
      analysis += `\n❌ Fatura Durumu (Number) Alınamadı: ${statusResultByNumber.error}\n`;
    }
    
    if (statusResultByUUID.success) {
      const state = statusResultByUUID.data?.stateCode;
      analysis += `\n✅ Fatura Durumu (UUID): StateCode=${state}\n`;
    } else {
      analysis += `\n❌ Fatura Durumu (UUID) Alınamadı: ${statusResultByUUID.error}\n`;
    }
    
    console.log(analysis);
    
    return new Response(JSON.stringify({
      success: true,
      results,
      analysis
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('❌ Test Hatası:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata',
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
