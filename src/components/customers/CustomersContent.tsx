import React from "react";
import { Customer } from "@/types/customer";
import CustomersTable from "./CustomersTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface CustomersContentProps {
  customers: Customer[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerSelectToggle?: (customer: Customer) => void;
  selectedCustomers?: Customer[];
  setSelectedCustomers?: (customers: Customer[]) => void;
}

const CustomersContent = ({
  customers,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onCustomerSelect,
  onCustomerSelectToggle,
  selectedCustomers = [],
  setSelectedCustomers
}: CustomersContentProps) => {

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Müşteriler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <CustomersTable
            customers={customers}
            isLoading={isLoading}
            totalCount={totalCount || 0}
            error={error}
            onCustomerSelect={onCustomerSelect}
            onCustomerSelectToggle={onCustomerSelectToggle}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
          />
          
          {/* Infinite scroll trigger - CustomersTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
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
          
          {/* Tüm müşteriler yüklendi mesajı */}
          {!hasNextPage && customers.length > 0 && !isLoading && (
            <div className="text-center py-4 text-sm text-gray-500">
              Tüm müşteriler yüklendi
            </div>
          )}
      </div>
    </div>
  );
};

export default CustomersContent;
