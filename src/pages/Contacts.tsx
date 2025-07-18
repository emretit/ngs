
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import CustomerListHeader from "@/components/customers/CustomerListHeader";
import CustomerListFilters from "@/components/customers/CustomerListFilters";
import CustomerList from "@/components/customers/CustomerList";
import CustomerSummaryCharts from "@/components/customers/CustomerSummaryCharts";
import { Customer } from "@/types/customer";

interface ContactsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Contacts = ({ isCollapsed, setIsCollapsed }: ContactsProps) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<"name" | "balance" | "company">("balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: customers, isLoading } = useQuery({
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

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = !search || 
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.company?.toLowerCase().includes(search.toLowerCase());

    const matchesType = !typeFilter || customer.type === typeFilter;
    const matchesStatus = !statusFilter || customer.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedCustomers = filteredCustomers?.sort((a, b) => {
    let valueA, valueB;
    
    // Determine values to compare based on sort field
    if (sortField === "name") {
      valueA = a.name.toLowerCase();
      valueB = b.name.toLowerCase();
    } else if (sortField === "company") {
      // Handle null company values safely for sorting
      valueA = (a.company || '').toLowerCase();
      valueB = (b.company || '').toLowerCase();
    } else { // balance
      valueA = a.balance;
      valueB = b.balance;
    }
    
    // Compare values based on sort direction
    if (sortDirection === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });

  const handleSort = (field: "name" | "balance" | "company") => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set direction based on field
      setSortField(field);
      // Text fields default to asc, numeric to desc
      setSortDirection(field === "balance" ? "desc" : "asc");
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-8">
          <CustomerListHeader customers={customers} />
          
          {/* Add summary charts */}
          <CustomerSummaryCharts customers={customers} />
          
          <CustomerListFilters 
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <CustomerList 
            customers={sortedCustomers}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={handleSort}
          />
        </div>
      </main>
    </div>
  );
};

export default Contacts;
