
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import CustomersHeader from "@/components/customers/CustomersHeader";
import CustomersFilterBar from "@/components/customers/CustomersFilterBar";
import CustomersContent from "@/components/customers/CustomersContent";
import CustomersBulkActions from "@/components/customers/CustomersBulkActions";
import { Customer } from "@/types/customer";
import { toast } from "sonner";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const pageSize = 20;

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      return data as Customer[];
    }
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
    <DefaultLayout>
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
        
        {selectedCustomers.length > 0 && (
          <CustomersBulkActions 
            selectedCustomers={selectedCustomers}
            onClearSelection={handleClearSelection}
          />
        )}

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
            customers={(customers as Customer[]) || []}
            isLoading={isLoading}
            totalCount={customers?.length || 0}
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
    </DefaultLayout>
  );
};

export default Contacts;
