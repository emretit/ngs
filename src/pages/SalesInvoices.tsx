import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import SalesInvoicesHeader from "@/components/sales/SalesInvoicesHeader";
import SalesInvoiceFilterBar from "@/components/sales/SalesInvoiceFilterBar";
import SalesInvoicesContent from "@/components/sales/SalesInvoicesContent";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useEInvoice } from "@/hooks/useEInvoice";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";

interface SalesInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SalesInvoices = ({ isCollapsed, setIsCollapsed }: SalesInvoicesProps) => {
  const navigate = useNavigate();
  const { 
    invoices, 
    isLoading, 
    filters, 
    setFilters,
  } = useSalesInvoices();
  const { sendInvoice } = useEInvoice();
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();
  
  const [filterKeyword, setFilterKeyword] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Satış Faturaları"
      subtitle="Tüm satış faturalarınızı yönetin ve takip edin"
    >
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
        
        <SalesInvoicesContent
          invoices={filteredInvoices}
          isLoading={isLoading}
          error={null}
          onSelectInvoice={handleInvoiceClick}
          onSendInvoice={sendInvoice}
          searchQuery={filterKeyword}
          documentTypeFilter={documentTypeFilter}
        />
      </div>
    </DefaultLayout>
  );
};

export default SalesInvoices;