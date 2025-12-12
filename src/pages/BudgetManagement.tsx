/**
 * @deprecated Bu dosya artık kullanılmıyor. 
 * BudgetManagement component'i BudgetDashboard'a taşındı.
 * Bu dosya sadece BudgetFiltersState interface'ini export etmek için tutuluyor.
 * 
 * Yeni kullanım: BudgetFiltersState'i BudgetDashboard'dan import edin:
 * import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
 */

export interface BudgetFiltersState {
  year: number;
  periodView: "yearly" | "quarterly" | "monthly";
  company: string;
  department: string;
  project: string;
  currency: "TRY" | "USD" | "EUR";
}
