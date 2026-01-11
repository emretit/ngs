import { useState, useCallback, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BudgetsHeader from "@/components/budget/BudgetsHeader";
import BudgetsFilterBar from "@/components/budget/BudgetsFilterBar";
import BudgetsContent from "@/components/budget/BudgetsContent";
import { toast } from "sonner";
import { useBudgetsList } from "@/hooks/useBudgetsList";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const BudgetList = memo(() => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchYear, setSearchYear] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  
  // Sıralama state'leri
  const [sortField, setSortField] = useState<string>("year");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  // Filtreleri hazırla
  const filters = {
    year: searchYear ? parseInt(searchYear) : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    currency: selectedCurrency !== 'all' ? selectedCurrency : undefined,
    sortField,
    sortDirection
  };

  const {
    data: budgets,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error,
    refresh: refreshBudgets
  } = useBudgetsList(filters);

  // Tüm bütçeler için istatistikleri çek (filtre olmadan)
  const { data: budgetStatistics } = useQuery({
    queryKey: ["budget_statistics"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        return {
          totalYears: 0,
          totalBudget: 0,
          totalActual: 0,
          totalRemaining: 0
        };
      }

      // Tüm bütçeleri çek
      const { data: allBudgets, error: budgetsError } = await supabase
        .from("budgets")
        .select("year, budget_amount, actual_amount, currency")
        .eq("company_id", companyId);

      if (budgetsError) throw budgetsError;

      if (!allBudgets || allBudgets.length === 0) {
        return {
          totalYears: 0,
          totalBudget: 0,
          totalActual: 0,
          totalRemaining: 0
        };
      }

      // Yıl bazlı gruplama
      const yearSet = new Set(allBudgets.map((b: any) => b.year));
      const totalYears = yearSet.size;
      
      const totalBudget = allBudgets.reduce((sum: number, b: any) => sum + Number(b.budget_amount || 0), 0);
      const totalActual = allBudgets.reduce((sum: number, b: any) => sum + Number(b.actual_amount || 0), 0);
      const totalRemaining = totalBudget - totalActual;

      return {
        totalYears,
        totalBudget,
        totalActual,
        totalRemaining
      };
    }
  });

  if (error) {
    toast.error("Bütçeler yüklenirken bir hata oluştu");
    console.error("Error loading budgets:", error);
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <BudgetsHeader 
        budgets={budgets || []}
        totalCount={totalCount}
        statistics={budgetStatistics}
      />
      
      {/* Filters */}
      <BudgetsFilterBar
        searchYear={searchYear}
        setSearchYear={setSearchYear}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
      />
      
      {/* Content */}
      {isLoading && (!budgets || budgets.length === 0) ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Bütçeler yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">Bütçeler yüklenirken bir hata oluştu</div>
        </div>
      ) : (
        <BudgetsContent
          budgets={budgets || []}
          isLoading={isLoading && (!budgets || budgets.length === 0)}
          isLoadingMore={isLoadingMore}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          totalCount={totalCount}
          error={error}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
});

BudgetList.displayName = 'BudgetList';

export default BudgetList;

