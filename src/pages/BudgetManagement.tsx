import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import BudgetFilters from "@/components/budget/BudgetFilters";
import BudgetKPIs from "@/components/budget/BudgetKPIs";
import OpexTab from "@/components/budget/OpexTab";
import CapexTab from "@/components/budget/CapexTab";
import RevenueTab from "@/components/budget/RevenueTab";
import CashflowTab from "@/components/budget/CashflowTab";
import RevisionRequestsTab from "@/components/budget/RevisionRequestsTab";
import VarianceAnalysis from "@/components/budget/VarianceAnalysis";
import BudgetAlerts from "@/components/budget/BudgetAlerts";
import BenchmarkAnalysis from "@/components/budget/BenchmarkAnalysis";
import QuickActions from "@/components/budget/QuickActions";
import BudgetLock from "@/components/budget/BudgetLock";
import ViewSelector, { BudgetViewType } from "@/components/budget/views/ViewSelector";
import BudgetMatrixView from "@/components/budget/views/BudgetMatrixView";
import BudgetTimelineView from "@/components/budget/views/BudgetTimelineView";
import BudgetEntryModal from "@/components/budget/modals/BudgetEntryModal";
import { Button } from "@/components/ui/button";
import { 
  TrendingDown, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  FileText,
  BarChart3,
  Bell,
  TrendingUpDown,
  Plus,
} from "lucide-react";

export interface BudgetFiltersState {
  year: number;
  periodView: "yearly" | "quarterly" | "monthly";
  company: string;
  department: string;
  project: string;
  currency: "TRY" | "USD" | "EUR";
}

const BudgetManagement = () => {
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  const [activeTab, setActiveTab] = useState("variance");
  const [viewType, setViewType] = useState<BudgetViewType>("tabs");
  const [budgetEntryOpen, setBudgetEntryOpen] = useState(false);
  const [budgetEntryCategory, setBudgetEntryCategory] = useState<string>("");
  const [budgetEntryMonth, setBudgetEntryMonth] = useState<number>(0);

  const handleAddBudget = (category?: string, month?: number) => {
    setBudgetEntryCategory(category || "");
    setBudgetEntryMonth(month || 0);
    setBudgetEntryOpen(true);
  };

  const handleBudgetSuccess = () => {
    // Refresh data after budget entry
    // This will trigger re-render of child components
  };

  const renderContent = () => {
    switch (viewType) {
      case "matrix":
        return (
          <BudgetMatrixView 
            filters={filters} 
            onAddBudget={handleAddBudget}
          />
        );
      case "timeline":
        return (
          <BudgetTimelineView filters={filters} />
        );
      case "tabs":
      default:
        return (
          <Card className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200 px-4 pt-4">
                <TabsList className="grid w-full grid-cols-8 h-auto bg-transparent p-0 gap-2">
                  <TabsTrigger 
                    value="variance" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Varyans
                  </TabsTrigger>
                  <TabsTrigger 
                    value="alerts" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white relative text-xs"
                  >
                    <Bell className="h-4 w-4" />
                    Uyarılar
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      2
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="benchmark" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <TrendingUpDown className="h-4 w-4" />
                    Benchmark
                  </TabsTrigger>
                  <TabsTrigger 
                    value="opex" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <TrendingDown className="h-4 w-4" />
                    OPEX
                  </TabsTrigger>
                  <TabsTrigger 
                    value="capex" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <Building2 className="h-4 w-4" />
                    CAPEX
                  </TabsTrigger>
                  <TabsTrigger 
                    value="revenue" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Gelir
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cashflow" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <DollarSign className="h-4 w-4" />
                    Nakit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="revisions" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                  >
                    <FileText className="h-4 w-4" />
                    Revizyon
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4">
                <TabsContent value="variance" className="mt-0">
                  <VarianceAnalysis filters={filters} />
                </TabsContent>

                <TabsContent value="alerts" className="mt-0">
                  <BudgetAlerts filters={filters} />
                </TabsContent>

                <TabsContent value="benchmark" className="mt-0">
                  <BenchmarkAnalysis filters={filters} />
                </TabsContent>

                <TabsContent value="opex" className="mt-0">
                  <OpexTab filters={filters} />
                </TabsContent>

                <TabsContent value="capex" className="mt-0">
                  <CapexTab filters={filters} />
                </TabsContent>

                <TabsContent value="revenue" className="mt-0">
                  <RevenueTab filters={filters} />
                </TabsContent>

                <TabsContent value="cashflow" className="mt-0">
                  <CashflowTab filters={filters} />
                </TabsContent>

                <TabsContent value="revisions" className="mt-0">
                  <RevisionRequestsTab filters={filters} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Bütçe Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Operasyonel ve sermaye giderlerinizi aylık bazda takip edin ve bütçenizi yönetin.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewSelector value={viewType} onChange={setViewType} />
          <Button 
            size="sm" 
            onClick={() => handleAddBudget()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Bütçe Ekle
          </Button>
          <QuickActions filters={filters} />
          <BudgetLock filters={filters} />
        </div>
      </div>

      {/* Filters & KPI Bar */}
      <Card className="p-4">
        <BudgetFilters filters={filters} onFiltersChange={setFilters} />
        <div className="mt-4 pt-4 border-t border-gray-200">
          <BudgetKPIs filters={filters} />
        </div>
      </Card>

      {/* Main Content based on View Type */}
      {renderContent()}

      {/* Budget Entry Modal */}
      <BudgetEntryModal
        open={budgetEntryOpen}
        onOpenChange={setBudgetEntryOpen}
        year={filters.year}
        currency={filters.currency}
        initialCategory={budgetEntryCategory}
        initialMonth={budgetEntryMonth}
        onSuccess={handleBudgetSuccess}
      />
    </div>
  );
};

export default BudgetManagement;
