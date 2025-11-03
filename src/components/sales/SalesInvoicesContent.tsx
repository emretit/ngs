import { useEffect, useRef } from "react";
import SalesInvoicesTable from "./SalesInvoicesTable";
import { Loader2 } from "lucide-react";

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
  searchQuery,
  documentTypeFilter
}: SalesInvoicesContentProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);

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
          searchQuery={searchQuery}
          documentTypeFilter={documentTypeFilter}
        />

        {/* Infinite scroll trigger: sadece otomatik yükleme ve spinner */}
        {!isLoading && hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Daha fazla fatura yükleniyor...</span>
              </div>
            )}
          </div>
        )}

        {/* Tüm faturalar yüklendi mesajı */}
        {!hasNextPage && invoices.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm faturalar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesInvoicesContent;
