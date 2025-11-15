import PurchaseInvoicesTable from "./PurchaseInvoicesTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface PurchaseInvoicesContentProps {
  invoices: any[];
  incomingInvoices: any[];
  earchiveInvoices: any[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onSelectInvoice: (invoice: any) => void;
  onInvoiceSelectToggle?: (invoice: any) => void;
  selectedInvoices?: any[];
  setSelectedInvoices?: (invoices: any[]) => void;
  onDownloadPdf?: (invoiceId: string, type: string) => void;
  isDownloading?: boolean;
  searchQuery?: string;
  documentTypeFilter?: string;
  statusFilter?: string;
  onDeleteInvoice?: (id: string) => void;
}

const PurchaseInvoicesContent = ({
  invoices,
  incomingInvoices,
  earchiveInvoices,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  error,
  onSelectInvoice,
  onInvoiceSelectToggle,
  selectedInvoices = [],
  setSelectedInvoices,
  onDownloadPdf,
  isDownloading = false,
  searchQuery,
  documentTypeFilter,
  statusFilter,
  onDeleteInvoice
}: PurchaseInvoicesContentProps) => {

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Faturalar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <PurchaseInvoicesTable
          invoices={invoices}
          incomingInvoices={incomingInvoices}
          earchiveInvoices={earchiveInvoices}
          isLoading={isLoading}
          onSelectInvoice={onSelectInvoice}
          onInvoiceSelectToggle={onInvoiceSelectToggle}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
          onDownloadPdf={onDownloadPdf}
          isDownloading={isDownloading}
          searchQuery={searchQuery}
          documentTypeFilter={documentTypeFilter}
          statusFilter={statusFilter}
          onDeleteInvoice={onDeleteInvoice}
        />

        {/* Infinite scroll trigger - PurchaseInvoicesTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
        {!isLoading && hasNextPage && (
          <div className="px-4">
            <InfiniteScroll
              hasNextPage={hasNextPage}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore || (() => {})}
              className="mt-4"
            >
              <div />
            </InfiniteScroll>
          </div>
        )}

        {/* Tüm faturalar yüklendi mesajı */}
        {!hasNextPage && (invoices.length > 0 || incomingInvoices.length > 0 || earchiveInvoices.length > 0) && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm faturalar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoicesContent;
