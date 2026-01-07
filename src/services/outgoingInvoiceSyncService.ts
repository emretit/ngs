import { supabase } from '@/integrations/supabase/client';
import { OutgoingInvoice } from '@/hooks/useOutgoingInvoices';
import { SalesInvoice } from '@/hooks/useSalesInvoices';

/**
 * Veriban giden e-fatura verilerini sales_invoices tablosuna senkronize eden servis
 * 
 * Özellikler:
 * - Veriban outgoing_invoices.id ile sales_invoices.nilvera_invoice_id üzerinden eşleştirme
 *   (nilvera_invoice_id alanı hem Nilvera hem Veriban için kullanılır)
 * - Müşteri bulunamazsa otomatik oluşturma
 * - Veriban verilerini üzerine yazma stratejisi
 * - Hata yönetimi ve loglama
 */

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export class OutgoingInvoiceSyncService {
  /**
   * Giden e-faturaları sales_invoices tablosuna senkronize eder
   */
  async syncToSalesInvoices(outgoingInvoices: OutgoingInvoice[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    console.log(`🔄 [OutgoingInvoiceSync] ${outgoingInvoices.length} fatura senkronize ediliyor...`);

    for (const outgoingInvoice of outgoingInvoices) {
      try {
        await this.syncSingleInvoice(outgoingInvoice, result);
      } catch (error: any) {
        const errorMsg = `Fatura ${outgoingInvoice.invoiceNumber}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`❌ [OutgoingInvoiceSync] ${errorMsg}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`✅ [OutgoingInvoiceSync] Tamamlandı:`, {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Tek bir faturayı senkronize eder
   */
  private async syncSingleInvoice(outgoingInvoice: OutgoingInvoice, result: SyncResult): Promise<void> {
    // Geçersiz verileri atla
    if (!outgoingInvoice.invoiceNumber) {
      result.skipped++;
      console.warn(`⚠️ [OutgoingInvoiceSync] Fatura numarası yok, atlanıyor: ${outgoingInvoice.id}`);
      return;
    }

    // Müşteri bilgisi yoksa veya VKN yoksa, müşteri olmadan devam et
    let customerId: string | null = null;
    if (outgoingInvoice.customerTaxNumber && outgoingInvoice.customerName) {
      customerId = await this.findOrCreateCustomer(
        outgoingInvoice.customerTaxNumber,
        outgoingInvoice.customerName
      );

      if (!customerId) {
        console.warn(`⚠️ [OutgoingInvoiceSync] Müşteri bulunamadı/oluşturulamadı: ${outgoingInvoice.customerName}, müşteri olmadan devam ediliyor`);
      }
    } else {
      console.warn(`⚠️ [OutgoingInvoiceSync] Müşteri bilgisi eksik (VKN: ${outgoingInvoice.customerTaxNumber || 'yok'}, İsim: ${outgoingInvoice.customerName || 'yok'}), müşteri olmadan devam ediliyor`);
    }

    // 2. Mevcut sales_invoice kaydını ara (Veriban outgoing_invoice.id ile eşleştirme)
    // Not: nilvera_invoice_id alanı hem Nilvera hem Veriban için kullanılır
    const { data: existingSalesInvoice, error: findError } = await supabase
      .from('sales_invoices')
      .select('id, fatura_no, nilvera_invoice_id')
      .eq('nilvera_invoice_id', outgoingInvoice.id)
      .maybeSingle();

    if (findError) {
      throw new Error(`Mevcut fatura arama hatası: ${findError.message}`);
    }

    // 3. Fatura verisini hazırla
    const salesInvoiceData = this.mapOutgoingToSalesInvoice(outgoingInvoice, customerId || undefined);

    // 4. Mevcut kayıt varsa güncelle, yoksa oluştur
    let salesInvoiceId: string;
    if (existingSalesInvoice) {
      // Güncelleme
      const { error: updateError } = await supabase
        .from('sales_invoices')
        .update(salesInvoiceData)
        .eq('id', existingSalesInvoice.id);

      if (updateError) {
        throw new Error(`Güncelleme hatası: ${updateError.message}`);
      }

      salesInvoiceId = existingSalesInvoice.id;
      result.updated++;
      console.log(`🔄 [OutgoingInvoiceSync] Güncellendi: ${outgoingInvoice.invoiceNumber} -> ${salesInvoiceId}`);
    } else {
      // Yeni kayıt oluştur
      const { data: newInvoice, error: insertError } = await supabase
        .from('sales_invoices')
        .insert(salesInvoiceData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Oluşturma hatası: ${insertError.message}`);
      }

      salesInvoiceId = newInvoice.id;
      result.created++;
      console.log(`✨ [OutgoingInvoiceSync] Oluşturuldu: ${outgoingInvoice.invoiceNumber} -> ${salesInvoiceId}`);
    }

    // 5. Fatura kalemlerini senkronize et
    await this.syncInvoiceItems(outgoingInvoice.id, salesInvoiceId);
  }

  /**
   * Müşteriyi VKN ile bulur, bulamazsa oluşturur
   */
  private async findOrCreateCustomer(taxNumber: string, name: string): Promise<string | null> {
    try {
      // 1. VKN ile ara
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('id')
        .eq('tax_number', taxNumber)
        .maybeSingle();

      if (findError) {
        console.error(`❌ [OutgoingInvoiceSync] Müşteri arama hatası: ${findError.message}`);
        return null;
      }

      // 2. Varsa ID'sini döndür
      if (existingCustomer) {
        return existingCustomer.id;
      }

      // 3. Yoksa oluştur
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: name,
          tax_number: taxNumber,
          company: name,
          is_einvoice_mukellef: true, // Veriban'dan geldiyse e-fatura mükellef
          phone: null,
          email: null,
          address: null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`❌ [OutgoingInvoiceSync] Müşteri oluşturma hatası: ${insertError.message}`);
        return null;
      }

      console.log(`✨ [OutgoingInvoiceSync] Yeni müşteri oluşturuldu: ${name} (${taxNumber})`);
      return newCustomer.id;
    } catch (error: any) {
      console.error(`❌ [OutgoingInvoiceSync] Müşteri işleme hatası: ${error.message}`);
      return null;
    }
  }

  /**
   * outgoing_invoices verisini sales_invoices formatına dönüştürür
   */
  private mapOutgoingToSalesInvoice(
    outgoing: OutgoingInvoice,
    customerId?: string
  ): Partial<SalesInvoice> {
    return {
      // Temel fatura bilgileri
      fatura_no: outgoing.invoiceNumber,
      fatura_tarihi: outgoing.invoiceDate,
      vade_tarihi: outgoing.dueDate || null,
      
      // Müşteri bilgisi (müşteri bulunamazsa null olabilir)
      customer_id: customerId || null,
      
      // Tutarlar
      toplam_tutar: outgoing.totalAmount,
      kdv_tutari: outgoing.taxAmount,
      ara_toplam: outgoing.taxExclusiveAmount,
      para_birimi: outgoing.currency,
      
      // İndirim tutarı yok, varsayılan 0
      indirim_tutari: 0,
      
      // Ödeme durumu - yeni faturalar için ödenmedi
      odenen_tutar: 0,
      odeme_durumu: 'odenmedi',
      
      // Fatura durumu
      durum: 'gonderildi', // Veriban'da varsa gönderilmiş demektir
      
      // E-fatura bilgileri
      // Not: nilvera_invoice_id alanı hem Nilvera hem Veriban için kullanılır
      nilvera_invoice_id: outgoing.id, // Veriban outgoing_invoice.id - Eşleştirme anahtarı
      einvoice_status: this.mapStatusToEinvoiceStatus(outgoing.status),
      // Veriban durum bilgileri (elogo_status, elogo_code, elogo_description)
      // Bu alanlar outgoing_invoices'tan gelecek, şimdilik null
      einvoice_transfer_state: null,
      einvoice_answer_type: null,
      einvoice_error_message: null,
      einvoice_sent_at: outgoing.sentAt || null,
      einvoice_delivered_at: outgoing.deliveredAt || null,
      einvoice_xml_content: outgoing.xmlContent || null,
      
      // Fatura tipleri
      invoice_type: outgoing.invoiceType || null,
      invoice_profile: outgoing.invoiceProfile || null,
      
      // Doküman tipi - e-fatura olarak işaretle
      document_type: 'e_fatura',
      
      // Timestamps - Supabase otomatik yönetir
      updated_at: new Date().toISOString()
    };
  }

  /**
   * outgoing_invoices status değerini sales_invoices einvoice_status değerine dönüştürür
   */
  private mapStatusToEinvoiceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'approved': 'accepted',
      'rejected': 'rejected',
      'pending': 'sending',
      'cancelled': 'cancelled',
      'error': 'error'
    };
    
    return statusMap[status?.toLowerCase()] || 'sent';
  }

  /**
   * Fatura kalemlerini senkronize eder
   */
  private async syncInvoiceItems(outgoingInvoiceId: string, salesInvoiceId: string): Promise<void> {
    try {
      // 1. Outgoing invoice items'ları getir
      const { data: outgoingItems, error: fetchError } = await supabase
        .from('outgoing_invoice_items')
        .select('*')
        .eq('outgoing_invoice_id', outgoingInvoiceId)
        .order('line_number', { ascending: true });

      if (fetchError) {
        console.error(`❌ [OutgoingInvoiceSync] Items fetch hatası: ${fetchError.message}`);
        return;
      }

      if (!outgoingItems || outgoingItems.length === 0) {
        console.log(`ℹ️ [OutgoingInvoiceSync] Fatura kalemleri yok, atlanıyor`);
        return;
      }

      // 2. Company ID'yi al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      // 3. Mevcut sales invoice items'ları sil (yeniden oluşturmak için)
      const { error: deleteError } = await supabase
        .from('sales_invoice_items')
        .delete()
        .eq('sales_invoice_id', salesInvoiceId);

      if (deleteError) {
        console.error(`❌ [OutgoingInvoiceSync] Eski items silme hatası: ${deleteError.message}`);
        // Devam et, yeni items eklemeyi dene
      }

      // 4. Items'ları map et ve ekle
      const salesInvoiceItems = outgoingItems.map((item, index) => ({
        sales_invoice_id: salesInvoiceId,
        company_id: profile?.company_id || null,
        urun_adi: item.product_name || item.description || `Ürün ${index + 1}`,
        aciklama: item.description || null,
        miktar: parseFloat(item.quantity as any) || 1,
        birim: item.unit || 'Adet',
        birim_fiyat: parseFloat(item.unit_price as any) || 0,
        kdv_orani: parseFloat(item.tax_rate as any) || 18,
        indirim_orani: parseFloat(item.discount_rate as any) || 0,
        satir_toplami: parseFloat(item.line_total as any) || 0,
        kdv_tutari: parseFloat(item.tax_amount as any) || 0,
        para_birimi: item.unit_price ? 'TRY' : null,
        sira_no: item.line_number || (index + 1),
      }));

      const { error: insertError } = await supabase
        .from('sales_invoice_items')
        .insert(salesInvoiceItems);

      if (insertError) {
        console.error(`❌ [OutgoingInvoiceSync] Items ekleme hatası: ${insertError.message}`);
        throw new Error(`Items ekleme hatası: ${insertError.message}`);
      }

      console.log(`✅ [OutgoingInvoiceSync] ${salesInvoiceItems.length} kalem eklendi`);
    } catch (error: any) {
      console.error(`❌ [OutgoingInvoiceSync] Items sync hatası: ${error.message}`);
      // Items hatası fatura sync'ini durdurmasın
    }
  }
}

// Singleton instance
export const outgoingInvoiceSyncService = new OutgoingInvoiceSyncService();

