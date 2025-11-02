import { useState } from "react";
import CustomersHeader from "@/components/customers/CustomersHeader";
import CustomersFilterBar from "@/components/customers/CustomersFilterBar";
import CustomersContent from "@/components/customers/CustomersContent";
import CustomersBulkActions from "@/components/customers/CustomersBulkActions";
import { Customer } from "@/types/customer";
import { toast } from "sonner";
import { useCustomersInfiniteScroll } from "@/hooks/useCustomersInfiniteScroll";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  const {
    data: customers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error
  } = useCustomersInfiniteScroll({
    search: searchQuery,
    status: selectedStatus,
    type: selectedType
  });
  if (error) {
    toast.error("Müşteriler yüklenirken bir hata oluştu");
    console.error("Error loading customers:", error);
  }
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.id === customer.id);
      return isSelected 
        ? prev.filter(c => c.id !== customer.id) 
        : [...prev, customer];
    });
  };
  const handleClearSelection = () => {
    setSelectedCustomers([]);
  };
  return (
    <div className="space-y-2">
        {/* Header */}
        <CustomersHeader 
          customers={customers || []}
        />
        {/* Filters */}
        <CustomersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <CustomersBulkActions 
          selectedCustomers={selectedCustomers}
          onClearSelection={handleClearSelection}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Müşteriler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Müşteriler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <CustomersContent
            customers={customers || []}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onCustomerSelect={() => {}}
            onCustomerSelectToggle={handleCustomerSelect}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
            searchQuery={searchQuery}
            statusFilter={selectedStatus}
            typeFilter={selectedType}
          />
        )}
      </div>
  );
};
export default Contacts;
