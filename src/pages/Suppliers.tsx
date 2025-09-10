
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { Plus, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import SupplierListHeader from "@/components/suppliers/SupplierListHeader";
import SupplierListFilters from "@/components/suppliers/SupplierListFilters";
import SupplierList from "@/components/suppliers/SupplierList";
import { Supplier } from "@/types/supplier";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface SuppliersProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Suppliers = ({ isCollapsed, setIsCollapsed }: SuppliersProps) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const pageSize = 20;

  // Infinite scroll için query function
  const fetchSuppliers = useCallback(async (page: number, pageSize: number) => {
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    // Filtreleme uygula
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Range ile sayfa bazlı veri çek
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('balance', { ascending: sortDirection === "asc" })
      .range(from, to);

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return {
      data: data as Supplier[],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [search, typeFilter, statusFilter, sortDirection]);

  // Infinite scroll hook'u kullan
  const {
    data: suppliers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["suppliers", search, typeFilter, statusFilter, sortDirection],
    fetchSuppliers,
    {
      pageSize,
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika
    }
  );

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
          {/* Infinite Scroll Content */}
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={refresh}
            isEmpty={suppliers.length === 0 && !isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Tedarikçi bulunamadı
                </h3>
                <p className="text-muted-foreground text-center">
                  Arama kriterlerinize uygun tedarikçi bulunamadı.
                </p>
              </div>
            }
          >
            <SupplierList
              suppliers={suppliers}
              isLoading={isLoading}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
            />
          </InfiniteScroll>

          {/* Info Banner */}
          {totalCount && totalCount > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{totalCount}</span> tedarikçi,
              <span className="font-medium text-foreground"> {suppliers.length}</span> adet yüklendi
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Suppliers;
