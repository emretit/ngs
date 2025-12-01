import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseInvoicesHeader from "@/components/purchase/PurchaseInvoicesHeader";
import PurchaseInvoiceFilterBar from "@/components/purchase/PurchaseInvoiceFilterBar";
import PurchaseInvoicesContent from "@/components/purchase/PurchaseInvoicesContent";
import PurchaseInvoicesBulkActions from "@/components/purchase/PurchaseInvoicesBulkActions";
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useEarchiveInvoices } from '@/hooks/useEarchiveInvoices';
import { useNilveraPdf } from '@/hooks/useNilveraPdf';

interface PurchaseInvoicesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const PurchaseInvoices = ({ isCollapsed, setIsCollapsed }: PurchaseInvoicesProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("purchase"); // purchase, incoming, earchive

  // Ana purchase faturalarını her zaman yükle
  const {
    invoices,
    isLoading,
    filters,
    setFilters,
    deleteInvoiceMutation,
  } = usePurchaseInvoices();

  // Sadece gerekli olan veri kaynaklarını yükle
  const { incomingInvoices, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingInvoices(undefined, false); // Başlangıçta kapalı
  const { earchiveInvoices, isLoading: isLoadingEarchive, refetch: refetchEarchive } = useEarchiveInvoices(false); // Başlangıçta kapalı
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();

  const [filterKeyword, setFilterKeyword] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);

  const handleInvoiceClick = (invoice: any) => {
    // Fatura detay sayfasına yönlendir
    navigate(`/purchase-invoices/${invoice.id}`);
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
        <PurchaseInvoicesHeader
          invoices={invoices}
          incomingInvoices={incomingInvoices}
          earchiveInvoices={earchiveInvoices}
        />
        <PurchaseInvoiceFilterBar
          filterKeyword={filterKeyword}
          setFilterKeyword={setFilterKeyword}
          documentTypeFilter={documentTypeFilter}
          setDocumentTypeFilter={setDocumentTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        <PurchaseInvoicesBulkActions
          selectedInvoices={selectedInvoices}
          onClearSelection={handleClearSelection}
        />
        <PurchaseInvoicesContent
          invoices={invoices || []}
          incomingInvoices={incomingInvoices || []}
          earchiveInvoices={earchiveInvoices || []}
          isLoading={isLoading || isLoadingIncoming || isLoadingEarchive}
          error={null}
          onSelectInvoice={handleInvoiceClick}
          onInvoiceSelectToggle={handleInvoiceSelect}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
          onDownloadPdf={async (invoiceId, type) => {
            await downloadAndOpenPdf(invoiceId, type);
          }}
          isDownloading={isDownloading}
          searchQuery={filterKeyword}
          documentTypeFilter={documentTypeFilter}
          statusFilter={statusFilter}
          onDeleteInvoice={(id) => deleteInvoiceMutation.mutate(id)}
        />
    </div>
  );
};

export default PurchaseInvoices;
