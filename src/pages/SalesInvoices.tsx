import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SalesInvoicesHeader from "@/components/sales/SalesInvoicesHeader";
import SalesInvoiceFilterBar from "@/components/sales/SalesInvoiceFilterBar";
import SalesInvoicesContent from "@/components/sales/SalesInvoicesContent";
import SalesInvoicesBulkActions from "@/components/sales/SalesInvoicesBulkActions";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useEInvoice } from "@/hooks/useEInvoice";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";
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
  const { sendInvoice } = useEInvoice();
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();

  const [filterKeyword, setFilterKeyword] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);

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
      </div>
  );
};

export default SalesInvoices;