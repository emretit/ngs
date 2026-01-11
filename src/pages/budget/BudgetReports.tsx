import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import BudgetFilters from "@/components/budget/BudgetFilters";
import BudgetKPIs from "@/components/budget/BudgetKPIs";
import VarianceChart from "@/components/budget/comparison/VarianceChart";
import CategoryDistributionChart from "@/components/budget/reports/CategoryDistributionChart";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";

const BudgetReports = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  const { exportToCSV } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

  const handleExportPDF = () => {
    // PDF export functionality - window.print() kullanılabilir
    window.print();
  };

  const handleExportExcel = () => {
    exportToCSV();
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/budget")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Bütçe Raporları
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Grafikler, analizler ve export işlemleri
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Excel Dışa Aktar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            PDF Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <BudgetFilters filters={filters} onFiltersChange={setFilters} />
      </Card>

      {/* KPI Cards */}
      <Card className="p-4">
        <BudgetKPIs filters={filters} />
      </Card>

      {/* Reports Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Aylık Bütçe Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <VarianceChart filters={filters} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Kategori Bazlı Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDistributionChart filters={filters} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetReports;

