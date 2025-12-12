import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Upload, Copy, Save } from "lucide-react";
import BudgetGrid from "@/components/budget/entry/BudgetGrid";
import BudgetFilters from "@/components/budget/BudgetFilters";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const BudgetEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { exportToCSV } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

  const handleExport = () => {
    exportToCSV();
  };

  const handleImport = () => {
    // Excel import functionality - file input trigger
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement Excel import logic
        console.log("Import file:", file.name);
      }
    };
    input.click();
  };

  const handleCopyFromPreviousYear = async () => {
    try {
      const { useBudget } = await import("@/hooks/useBudget");
      // Note: This should be called from a component that uses the hook
      // For now, we'll use QuickActions component's logic
      const sourceYear = filters.year - 1;
      const targetYear = filters.year;
      
      // Direct API call
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      // Fetch source year budgets
      const { data: sourceBudgets, error: fetchError } = await supabase
        .from("budgets")
        .select("*")
        .eq("year", sourceYear)
        .eq("company_id", companyId);

      if (fetchError) throw fetchError;

      if (!sourceBudgets || sourceBudgets.length === 0) {
        throw new Error(`${sourceYear} yılında kopyalanacak bütçe bulunamadı`);
      }

      // Create new budgets for target year
      const newBudgets = sourceBudgets.map((b) => ({
        company_id: companyId,
        year: targetYear,
        month: b.month,
        category: b.category,
        subcategory: b.subcategory,
        budget_amount: b.budget_amount,
        actual_amount: 0,
        forecast_amount: b.budget_amount,
        department_id: b.department_id,
        project_id: b.project_id,
        currency: b.currency,
        status: "draft" as const,
        notes: `${sourceYear} yılından kopyalandı`,
        created_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from("budgets")
        .upsert(newBudgets, {
          onConflict: "company_id,year,month,category,subcategory,department_id,currency",
        });

      if (insertError) throw insertError;

      setHasUnsavedChanges(true);
      
      toast({
        title: "Başarılı",
        description: `${sourceBudgets.length} bütçe kaydı ${targetYear} yılına kopyalandı.`,
      });
    } catch (error: any) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kopyalama sırasında hata oluştu",
      });
    }
  };

  const handleSave = () => {
    // Save all changes
    setHasUnsavedChanges(false);
    console.log("Save all changes");
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
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Save className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Bütçe Girişi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Spreadsheet benzeri grid görünümü ile bütçe girişi yapın
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromPreviousYear}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Önceki Yıldan Kopyala
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Excel İçe Aktar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Excel Dışa Aktar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <BudgetFilters filters={filters} onFiltersChange={setFilters} />
      </Card>

      {/* Budget Grid */}
      <Card className="p-0 overflow-hidden">
        <BudgetGrid
          filters={filters}
          onDataChange={() => setHasUnsavedChanges(true)}
        />
      </Card>
    </div>
  );
};

export default BudgetEntry;

