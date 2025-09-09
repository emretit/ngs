
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const allSortedCustomers = filteredCustomers?.sort((a, b) => {
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

  // Pagination logic
  const totalPages = Math.ceil((allSortedCustomers?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedCustomers = allSortedCustomers?.slice(startIndex, endIndex);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">
                Toplam <span className="font-medium text-foreground">{allSortedCustomers?.length || 0}</span> müşteri, 
                <span className="font-medium text-foreground"> {startIndex + 1}-{Math.min(endIndex, allSortedCustomers?.length || 0)}</span> arası gösteriliyor
              </div>
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}
                    />
                  </PaginationItem>
                  
                  {/* Smart pagination with ellipsis */}
                  {(() => {
                    const pages = [];
                    const showPages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                    const endPage = Math.min(totalPages, startPage + showPages - 1);
                    
                    if (endPage - startPage < showPages - 1) {
                      startPage = Math.max(1, endPage - showPages + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(1);
                            }}
                            className="hover:bg-accent"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <PaginationItem key="start-ellipsis">
                            <span className="px-3 py-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i);
                            }}
                            isActive={currentPage === i}
                            className={currentPage === i ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <PaginationItem key="end-ellipsis">
                            <span className="px-3 py-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                      pages.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                            }}
                            className="hover:bg-accent"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Contacts;
