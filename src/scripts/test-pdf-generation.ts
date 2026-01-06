// Test script for PDF generation with PAFTA template
import { PdfExportService } from '@/services/pdf/pdfExportService';

// Mock proposal data to test PDF generation
const mockProposalData = {
  id: 'test-proposal-123',
  number: 'TEK-2024-001',
  title: 'Güvenlik Sistemi Kurulum Teklifi',
  description: '19 Mayıs Konakları için modern güvenlik sistemi kurulum projesi. Kamera sistemleri, giriş kontrolü ve alarm sistemleri dahil.',
  customer_name: 'Ayşe ÖZKAN',
  customer_company: '19 MAYIS KONAKLARI APARTMAN YÖNETİCİLİĞİ',
  customer_email: 'info@19mayiskonaklari.com',
  mobile_phone: '+90 532 123 45 67',
  office_phone: '+90 216 456 78 90',
  address: 'KADIKÖY',
  tax_number: '10638845',
  tax_office: 'ERENKÖY',
  currency: 'TRY',
  valid_until: '2024-12-31',
  payment_terms: 'Ödeme %40 peşin, %60 teslimat sonrası 30 gün vadeli',
  delivery_terms: 'Teslimat 6-8 hafta içinde tamamlanacaktır',
  warranty_terms: 'Tüm ekipmanlar 2 yıl garanti kapsamındadır',
  notes: 'Proje 6-8 hafta sürecektir. Teknik destek 2 yıl ücretsiz.',
  created_at: '2025-08-11T21:41:59.059091+00:00',
  items: [
    {
      id: '1',
      product_id: 'ecc1ccdb-6a27-42d0-b2cb-d3ea764481d3',
      description: '1G SFP MODUL',
      quantity: 8,
      unit: 'Ad',
      unit_price: 100.5,
      total: 804,
      tax_rate: 18,
      discount_rate: 0
    },
    {
      id: '2',
      product_id: 'c2891fe2-e09e-4fdc-bd2c-39b618ca22b5',
      description: '1 Yıllık Alarm İzleme Hizmet Bedeli',
      quantity: 1,
      unit: 'Ad',
      unit_price: 250,
      total: 250,
      tax_rate: 18,
      discount_rate: 0
    },
    {
      id: '3',
      product_id: '9e8ed44a-4a4f-4fce-95d7-06f49313cc2e',
      description: 'İşçilik, Montaj ve Devreye Alma',
      quantity: 1,
      unit: 'piece',
      unit_price: 100,
      total: 100,
      tax_rate: 18,
      discount_rate: 0
    },
    {
      id: '4',
      product_id: '1d37565c-3324-4b14-bbb2-b5e2efd7e5f3',
      description: 'Fatura Kalemi',
      quantity: 1,
      unit: 'Adet',
      unit_price: 100,
      total: 100,
      tax_rate: 18,
      discount_rate: 0
    }
  ]
};

export async function testPdfGeneration() {
  try {
    console.log('🧪 PDF oluşturma testi başlatılıyor...');
    
    // 1. Transform proposal data for PDF
    console.log('📄 Teklif verisi PDF formatına dönüştürülüyor...');
    const quoteData = await PdfExportService.transformProposalForPdf(mockProposalData);
    console.log('✅ Teklif verisi başarıyla dönüştürüldü');
    console.log('📊 Dönüştürülen veri:', {
      number: quoteData.number,
      customerName: quoteData.customer?.name,
      customerCompany: quoteData.customer?.company,
      itemsCount: quoteData.items.length,
      totalAmount: quoteData.total_amount,
      currency: quoteData.currency
    });
    
    // 2. Get PAFTA template
    console.log('🎨 PAFTA şablonu getiriliyor...');
    const templates = await PdfExportService.getTemplates(undefined, 'quote');
    
    const paftaTemplate = templates.find(t => t.name === 'pafta');
    
    if (!paftaTemplate) {
      throw new Error('PAFTA şablonu bulunamadı');
    }
    
    console.log('✅ PAFTA şablonu bulundu:', {
      id: paftaTemplate.id,
      name: paftaTemplate.name,
      isDefault: paftaTemplate.is_default
    });
    
    // 3. Generate PDF
    console.log('🔄 PDF oluşturuluyor...');
    const pdfBlob = await PdfExportService.generatePdf(quoteData, { 
      templateId: paftaTemplate.id 
    });
    
    console.log('✅ PDF başarıyla oluşturuldu!');
    console.log('📁 PDF boyutu:', `${(pdfBlob.size / 1024).toFixed(2)} KB`);
    
    // 4. Test download functionality (just test generation, not actual download)
    console.log('💾 İndirme fonksiyonu test ediliyor...');
    
    return {
      success: true,
      message: 'PDF test başarıyla tamamlandı',
      pdfSize: pdfBlob.size,
      templateUsed: paftaTemplate.name
    };
    
  } catch (error) {
    console.error('❌ PDF test hatası:', error);
    return {
      success: false,
      message: 'PDF test başarısız: ' + (error as Error).message,
      error: error
    };
  }
}

// Browser test function
export async function testPdfInBrowser() {
  if (typeof window === 'undefined') {
    console.log('❌ Bu test sadece browser ortamında çalışır');
    return;
  }
  
  console.log('🌐 Browser PDF testi başlatılıyor...');
  const result = await testPdfGeneration();
  
  if (result.success) {
    console.log('🎉 Browser PDF test başarılı!');
    console.log('📋 Test sonucu:', result);
  } else {
    console.error('💥 Browser PDF test başarısız:', result.message);
  }
  
  return result;
}

// Exports for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testPdfGeneration = testPdfGeneration;
  (window as any).testPdfInBrowser = testPdfInBrowser;
  console.log('🔧 PDF test fonksiyonları window objesine eklendi');
  console.log('💡 Kullanım: window.testPdfInBrowser()');
}
