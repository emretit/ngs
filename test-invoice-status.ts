/**
 * Test Script: E-Arşiv Fatura Durum Sorgulama
 * 
 * Fatura: EAR2026000000002
 * ETTN: 0740f0c7-667a-4516-9b7e-5beba36b4dad
 * Transfer ID: A455298B-17C1-409D-870E-01F8017009E1
 */

// Supabase bilgileri .env'den alınacak
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Kullanıcı token - bu kısmı güncel token ile değiştirmeniz gerekiyor
// Browser console'dan: localStorage.getItem('supabase.auth.token')
const USER_TOKEN = Deno.env.get('USER_TOKEN') || 'YOUR_TOKEN_HERE';

const invoiceData = {
  id: 'f45a0371-96b0-4e5b-8124-d727f5cfd6c9',
  fatura_no: 'EAR2026000000002',
  ettn: '0740f0c7-667a-4516-9b7e-5beba36b4dad',
  nilvera_transfer_id: 'A455298B-17C1-409D-870E-01F8017009E1'
};

console.log('🔍 E-Arşiv Fatura Durum Sorgulama Başlıyor...');
console.log('=' .repeat(60));
console.log('📄 Fatura Numarası:', invoiceData.fatura_no);
console.log('🆔 ETTN:', invoiceData.ettn);
console.log('📦 Transfer ID:', invoiceData.nilvera_transfer_id);
console.log('=' .repeat(60));

try {
  // Edge function URL
  const functionUrl = `${SUPABASE_URL}/functions/v1/veriban-invoice-status`;
  
  console.log('\n🌐 Edge Function URL:', functionUrl);
  console.log('🔑 Authorization Token:', USER_TOKEN ? 'Mevcut' : '❌ YOK');
  
  if (!USER_TOKEN || USER_TOKEN === 'YOUR_TOKEN_HERE') {
    console.error('\n❌ HATA: USER_TOKEN bulunamadı!');
    console.error('Lütfen aşağıdaki adımları takip edin:');
    console.error('1. Tarayıcınızda uygulamayı açın');
    console.error('2. Developer Console\'u açın (F12)');
    console.error('3. Console\'a şunu yazın:');
    console.error('   localStorage.getItem(\'sb-[PROJECT_REF]-auth-token\')');
    console.error('4. Dönen token\'ı kopyalayın');
    console.error('5. Bu scripti şöyle çalıştırın:');
    console.error('   USER_TOKEN="your_token" deno run --allow-net --allow-env test-invoice-status.ts');
    Deno.exit(1);
  }
  
  // Request body
  const requestBody = {
    invoiceId: invoiceData.id,
    invoiceNumber: invoiceData.fatura_no,
    invoiceUUID: invoiceData.ettn
  };
  
  console.log('\n📤 Request Body:', JSON.stringify(requestBody, null, 2));
  
  // API çağrısı
  console.log('\n⏳ Veriban API\'sine bağlanılıyor...');
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${USER_TOKEN}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify(requestBody)
  });
  
  console.log('📥 Response Status:', response.status, response.statusText);
  
  const responseData = await response.json();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SONUÇ:');
  console.log('='.repeat(60));
  console.log(JSON.stringify(responseData, null, 2));
  console.log('='.repeat(60));
  
  if (responseData.success) {
    console.log('\n✅ Durum sorgulaması başarılı!');
    console.log('\n📋 Fatura Durumu:');
    console.log('  State Code:', responseData.status?.stateCode);
    console.log('  State Name:', responseData.status?.stateName || '(yok)');
    console.log('  Kullanıcı Dostu:', responseData.status?.userFriendlyStatus);
    console.log('  Açıklama:', responseData.status?.stateDescription || '(yok)');
    
    if (responseData.status?.answerStatus) {
      console.log('\n📬 Müşteri Cevabı:');
      console.log('  Answer Code:', responseData.status?.answerTypeCode);
      console.log('  Answer Status:', responseData.status?.answerStatus);
    }
    
    if (responseData.status?.errorMessage) {
      console.log('\n❌ Hata Mesajı:', responseData.status.errorMessage);
    }
    
    // Durum kodlarını açıkla
    console.log('\n📖 Durum Kodları Açıklaması:');
    console.log('  0: Beklemede / Bilinmiyor');
    console.log('  1: Taslak');
    console.log('  2: İmza Bekliyor / Gönderilmeyi Bekliyor');
    console.log('  3: Gönderildi / Gönderim Listesinde');
    console.log('  4: Hatalı');
    console.log('  5: Başarılı - Alıcıya Ulaştı ✅');
    
  } else {
    console.log('\n❌ Durum sorgulaması başarısız!');
    console.log('Hata:', responseData.error);
    
    if (responseData.transferStatus) {
      console.log('\n📦 Transfer Durumu:');
      console.log(JSON.stringify(responseData.transferStatus, null, 2));
    }
  }
  
  // Veritabanını kontrol et
  console.log('\n' + '='.repeat(60));
  console.log('💾 Veritabanı durumu kontrol ediliyor...');
  console.log('='.repeat(60));
  
  const dbCheckUrl = `${SUPABASE_URL}/rest/v1/sales_invoices?id=eq.${invoiceData.id}&select=id,fatura_no,einvoice_status,elogo_status,durum,einvoice_invoice_state,einvoice_transfer_state,einvoice_error_message,xml_data`;
  
  const dbResponse = await fetch(dbCheckUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${USER_TOKEN}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  const dbData = await dbResponse.json();
  console.log('\n📊 Veritabanı Güncel Durum:');
  console.log(JSON.stringify(dbData, null, 2));
  
} catch (error) {
  console.error('\n❌ HATA:', error);
  console.error('Stack:', error.stack);
}
