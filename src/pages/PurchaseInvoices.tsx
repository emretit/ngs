
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import PurchaseInvoicesHeader from "@/components/purchase/PurchaseInvoicesHeader";
import PurchaseInvoiceFilterBar from "@/components/purchase/PurchaseInvoiceFilterBar";
import PurchaseInvoicesContent from "@/components/purchase/PurchaseInvoicesContent";
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useEarchiveInvoices } from '@/hooks/useEarchiveInvoices';
import { useNilveraPdf } from '@/hooks/useNilveraPdf';

interface PurchaseInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
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
  } = usePurchaseInvoices();

  // Ana faturaları öncelikli olarak göster
  console.log('🔍 PurchaseInvoices - ana faturalar yüklendi:', invoices?.length || 0);

  // Sadece gerekli olan veri kaynaklarını yükle
  const { incomingInvoices, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingInvoices(undefined, false); // Başlangıçta kapalı
  const { earchiveInvoices, isLoading: isLoadingEarchive, refetch: refetchEarchive } = useEarchiveInvoices(false); // Başlangıçta kapalı
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();

  const [filterKeyword, setFilterKeyword] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleInvoiceClick = (invoice: any) => {
    // Fatura detay sayfasına yönlendir
    navigate(`/purchase-invoices/${invoice.id}`);
  };


  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Alış Faturaları"
      subtitle="Tüm alış faturalarınızı yönetin ve takip edin"
    >
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
        
        <PurchaseInvoicesContent
          invoices={invoices || []}
          incomingInvoices={incomingInvoices || []}
          earchiveInvoices={earchiveInvoices || []}
          isLoading={isLoading || isLoadingIncoming || isLoadingEarchive}
          error={null}
          onSelectInvoice={handleInvoiceClick}
          onDownloadPdf={downloadAndOpenPdf}
          searchQuery={filterKeyword}
          documentTypeFilter={documentTypeFilter}
          statusFilter={statusFilter}
                      />
                    </div>
    </DefaultLayout>
  );
};

export default PurchaseInvoices;
