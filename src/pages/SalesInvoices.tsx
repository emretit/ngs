import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SalesInvoicesHeader from "@/components/sales/SalesInvoicesHeader";
import SalesInvoiceFilterBar from "@/components/sales/SalesInvoiceFilterBar";
import SalesInvoicesContent from "@/components/sales/SalesInvoicesContent";
import SalesInvoicesBulkActions from "@/components/sales/SalesInvoicesBulkActions";
import { EInvoiceResendConfirmDialog } from "@/components/sales/EInvoiceResendConfirmDialog";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useEInvoice } from "@/hooks/useEInvoice";
import { useVeribanInvoice } from "@/hooks/useVeribanInvoice";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";
import { IntegratorService } from "@/services/integratorService";
import { toast } from "sonner";

interface SalesInvoicesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const SalesInvoices = ({ isCollapsed, setIsCollapsed }: SalesInvoicesProps) => {
  const navigate = useNavigate();
  const {
    invoices,
    isLoading,
    filters,
    setFilters,
    deleteInvoiceMutation,
  } = useSalesInvoices();
  const { sendInvoice: sendNilveraInvoice } = useEInvoice();
  const { 
    sendInvoice: sendVeribanInvoice, 
    checkStatus: checkVeribanStatus,
    confirmDialog,
    handleConfirmResend,
    handleCancelResend,
  } = useVeribanInvoice();
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();

  const [filterKeyword, setFilterKeyword] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return oneMonthAgo;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  
  // Tarih filtrelerini hook'a aktar
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        from: startDate || null,
        to: endDate || null
      }
    }));
  }, [startDate, endDate, setFilters]);
  
  // Entegratör durumu
  const [integratorStatus, setIntegratorStatus] = useState<{
    nilvera: boolean;
    elogo: boolean;
    veriban: boolean;
    selected: 'nilvera' | 'elogo' | 'veriban';
  } | null>(null);

  // Otomatik gönderilen faturaları takip et (tekrar gönderimi önlemek için)
  const sentInvoicesRef = useRef<Set<string>>(new Set());
  // Durum kontrolü yapılan faturaları takip et (tekrar kontrolü önlemek için)
  const checkedInvoicesRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const loadIntegratorStatus = async () => {
      try {
        const status = await IntegratorService.checkIntegratorStatus();
        setIntegratorStatus(status);
        console.log('📊 [SalesInvoices] Integrator status:', status);
      } catch (error) {
        console.error('Error loading integrator status:', error);
      }
    };
    loadIntegratorStatus();
  }, []);

  // Entegratöre göre fatura gönderme fonksiyonu
  const sendInvoice = useCallback((invoiceId: string) => {
    if (!integratorStatus) {
      console.warn('⚠️ [SalesInvoices] Integrator status not loaded yet');
      toast.warning('Entegratör durumu yükleniyor, lütfen bekleyin...');
      return;
    }

    console.log('📤 [SalesInvoices] Sending invoice to integrator:', integratorStatus.selected);

    // Tekrar gönderimi önlemek için ref'e ekle
    sentInvoicesRef.current.add(invoiceId);

    if (integratorStatus.selected === 'veriban' && integratorStatus.veriban) {
      console.log('📤 [SalesInvoices] Sending to Veriban...');
      sendVeribanInvoice({ salesInvoiceId: invoiceId, forceResend: false });
    } else if (integratorStatus.selected === 'nilvera' && integratorStatus.nilvera) {
      console.log('📤 [SalesInvoices] Sending to Nilvera...');
      sendNilveraInvoice(invoiceId);
    } else if (integratorStatus.selected === 'elogo' && integratorStatus.elogo) {
      console.log('⚠️ [SalesInvoices] e-Logo entegrasyonu henüz desteklenmiyor');
      toast.info('e-Logo entegrasyonu yakında eklenecek');
    } else {
      console.warn('⚠️ [SalesInvoices] Selected integrator is not active');
      toast.warning('Seçili entegratör aktif değil. Lütfen ayarlar sayfasından kontrol edin.');
    }
  }, [integratorStatus, sendVeribanInvoice, sendNilveraInvoice]);

  // DEVRE DIŞI: Otomatik gönderim kaldırıldı
  // Kullanıcı manuel olarak "E-Fatura Gönder" butonuna basmalı
  /*
  // "GİB'e Gönderilmeyi Bekliyor" durumundaki faturaları otomatik gönder
  useEffect(() => {
    if (!integratorStatus || !invoices || invoices.length === 0) return;

    // "GİB'e Gönderilmeyi Bekliyor" durumundaki faturaları bul (einvoice_status === 'sent')
    // Sadece henüz Veriban'a gönderilmemiş olanları filtrele
    const pendingInvoices = invoices.filter(
      invoice =>
        invoice.einvoice_status === 'sent' &&
        !invoice.nilvera_invoice_id && // Henüz Veriban'a/Nilvera'ya gönderilmemiş
        !sentInvoicesRef.current.has(invoice.id)
    );

    if (pendingInvoices.length > 0) {
      console.log(`📤 [SalesInvoices] ${pendingInvoices.length} adet "GİB'e Gönderilmeyi Bekliyor" durumundaki fatura bulundu, otomatik gönderiliyor...`);

      // Her faturayı sırayla gönder (paralel gönderim yapmamak için)
      pendingInvoices.forEach((invoice, index) => {
        // Faturayı gönderilenler listesine ekle (tekrar gönderimi önlemek için)
        sentInvoicesRef.current.add(invoice.id);

        setTimeout(() => {
          console.log(`📤 [SalesInvoices] Otomatik gönderiliyor: ${invoice.fatura_no || invoice.id}`);
          sendInvoice(invoice.id);
        }, index * 1000); // Her faturayı 1 saniye arayla gönder
      });
    }
  }, [integratorStatus, invoices, sendInvoice]);
  */

  // "GİB'e Gönderilmeyi Bekliyor" durumundaki faturalar için periyodik durum kontrolü (sadece Veriban için)
  // Kontrol sıklığı: 5 dakika (300 saniye)
  useEffect(() => {
    if (!integratorStatus || integratorStatus.selected !== 'veriban' || !integratorStatus.veriban) return;
    if (!invoices || invoices.length === 0) return;

    // Her 5 dakikada bir durum kontrolü yap (30 saniye -> 300 saniye)
    const statusCheckInterval = setInterval(() => {
      // Her seferinde güncel faturaları kontrol et
      // Sadece Veriban'a gönderilmiş faturaları kontrol et
      const sentInvoices = invoices.filter(
        invoice =>
          invoice.einvoice_status === 'sent' &&
          invoice.nilvera_invoice_id // Sadece Veriban'a gönderilmiş faturaları kontrol et
      );

      if (sentInvoices.length === 0) return;

      sentInvoices.forEach((invoice) => {
        // Son kontrol edilmişse tekrar kontrol etme
        const lastChecked = checkedInvoicesRef.current.has(invoice.id);
        if (!lastChecked) {
          // Geçersiz fatura numarası değerlerini kontrol et
          const invalidValues = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'];
          const isValidFaturaNo = invoice.fatura_no && 
                                  !invalidValues.includes(invoice.fatura_no.toUpperCase()) &&
                                  invoice.fatura_no.length > 0 &&
                                  invoice.fatura_no.length <= 50;
          
          const statusCheckId = isValidFaturaNo ? invoice.fatura_no : invoice.id;
          console.log(`🔄 [SalesInvoices] Durum kontrolü yapılıyor: ${statusCheckId} (fatura_no: ${invoice.fatura_no || 'yok'})`);
          checkedInvoicesRef.current.add(invoice.id);
          
          checkVeribanStatus(invoice.id, {
            silent: true, // Periyodik kontrollerde toast gösterme
            onSuccess: () => {
              // Başarılı kontrol sonrası 10 dakika sonra tekrar kontrol edilebilir
              setTimeout(() => {
                checkedInvoicesRef.current.delete(invoice.id);
              }, 10 * 60 * 1000); // 10 dakika
            },
            onError: () => {
              // Hata durumunda 2 dakika sonra tekrar kontrol edilebilir
              setTimeout(() => {
                checkedInvoicesRef.current.delete(invoice.id);
              }, 2 * 60 * 1000); // 2 dakika
            }
          });
        }
      });
    }, 300000); // 300 saniye = 5 dakika (önceden 30 saniye idi)

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [integratorStatus, invoices, checkVeribanStatus]);

  // Tekli silme işlemi
  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    deleteInvoiceMutation.mutate(invoiceId, {
      onSuccess: () => {
        // Seçili faturalardan da kaldır
        setSelectedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      }
    });
  }, [deleteInvoiceMutation]);

  // Toplu silme işlemi
  const handleBulkDelete = useCallback(async (invoiceIds: string[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const id of invoiceIds) {
      try {
        await deleteInvoiceMutation.mutateAsync(id);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Fatura silme hatası (${id}):`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} fatura başarıyla silindi`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} fatura silinemedi`);
    }

    // Seçimi temizle
    setSelectedInvoices([]);
  }, [deleteInvoiceMutation]);

  // Filtrelenmiş faturalar
  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = !filterKeyword ||
      invoice.fatura_no?.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      invoice.aciklama?.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchesDocumentType = documentTypeFilter === "all" || invoice.document_type === documentTypeFilter;
    return matchesSearch && matchesDocumentType;
  });

  const handleInvoiceClick = (invoice: any) => {
    // Fatura detay sayfasına yönlendir
    navigate(`/sales-invoices/${invoice.id}`);
  };

  const handleInvoiceSelect = useCallback((invoice: any) => {
    setSelectedInvoices(prev => {
      const isSelected = prev.some(inv => inv.id === invoice.id);
      return isSelected
        ? prev.filter(inv => inv.id !== invoice.id)
        : [...prev, invoice];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedInvoices([]);
  }, []);

  return (
    <div className="space-y-2">
        <SalesInvoicesHeader
          invoices={invoices}
        />
        <SalesInvoiceFilterBar
          filterKeyword={filterKeyword}
          setFilterKeyword={setFilterKeyword}
          documentTypeFilter={documentTypeFilter}
          setDocumentTypeFilter={setDocumentTypeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        <SalesInvoicesBulkActions
          selectedInvoices={selectedInvoices}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkSendEInvoice={(ids) => ids.forEach(id => sendInvoice(id))}
        />
        <SalesInvoicesContent
          invoices={filteredInvoices}
          isLoading={isLoading}
          error={null}
          onSelectInvoice={handleInvoiceClick}
          onInvoiceSelectToggle={handleInvoiceSelect}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
          onSendInvoice={sendInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          searchQuery={filterKeyword}
          documentTypeFilter={documentTypeFilter}
        />
        
        {/* E-Fatura Tekrar Gönderme Onay Dialog'u */}
        <EInvoiceResendConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) handleCancelResend();
          }}
          currentStatus={confirmDialog.currentStatus}
          onConfirm={handleConfirmResend}
          onCancel={handleCancelResend}
        />
      </div>
  );
};

export default SalesInvoices;