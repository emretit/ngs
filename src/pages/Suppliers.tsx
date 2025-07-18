
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import SupplierListHeader from "@/components/suppliers/SupplierListHeader";
import SupplierListFilters from "@/components/suppliers/SupplierListFilters";
import SupplierList from "@/components/suppliers/SupplierList";
import { Supplier } from "@/types/supplier";

interface SuppliersProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Suppliers = ({ isCollapsed, setIsCollapsed }: SuppliersProps) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }
      
      return data as Supplier[];
    }
  });

  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = !search || 
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.company?.toLowerCase().includes(search.toLowerCase());

    const matchesType = !typeFilter || supplier.type === typeFilter;
    const matchesStatus = !statusFilter || supplier.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedSuppliers = filteredSuppliers?.sort((a, b) => {
    if (sortDirection === "asc") {
      return a.balance - b.balance;
    } else {
      return b.balance - a.balance;
    }
  });

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
          <div className="flex justify-between items-center mb-8">
            <SupplierListHeader />
            <Link to="/suppliers/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Yeni Tedarikçi
              </Button>
            </Link>
          </div>
          <SupplierListFilters 
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <SupplierList 
            suppliers={sortedSuppliers}
            isLoading={isLoading}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
          />
        </div>
      </main>
    </div>
  );
};

export default Suppliers;
