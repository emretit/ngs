import SalesInvoicesTable from "./SalesInvoicesTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface SalesInvoicesContentProps {
  invoices: any[];
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
  onSendInvoice?: (salesInvoiceId: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  searchQuery?: string;
  documentTypeFilter?: string;
}

const SalesInvoicesContent = ({
  invoices,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  error,
  onSelectInvoice,
  onInvoiceSelectToggle,
  selectedInvoices = [],
  setSelectedInvoices,
  onSendInvoice,
  onDeleteInvoice,
  searchQuery,
  documentTypeFilter
}: SalesInvoicesContentProps) => {

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
        <SalesInvoicesTable
          invoices={invoices}
          isLoading={isLoading}
          onSelectInvoice={onSelectInvoice}
          onInvoiceSelectToggle={onInvoiceSelectToggle}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
          onSendInvoice={onSendInvoice}
          onDeleteInvoice={onDeleteInvoice}
          searchQuery={searchQuery}
          documentTypeFilter={documentTypeFilter}
        />

        {/* Infinite scroll trigger - SalesInvoicesTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
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
        {!hasNextPage && invoices.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm faturalar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesInvoicesContent;
