import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Copy, 
  Save, 
  Send, 
  Edit,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import BudgetGrid from "@/components/budget/entry/BudgetGrid";
import BudgetFilters from "@/components/budget/BudgetFilters";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { useBudget } from "@/hooks/useBudget";
import { useBudgetApproval } from "@/hooks/useBudgetApproval";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  const [budgetStatus, setBudgetStatus] = useState<"draft" | "approved" | "locked">("draft");

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
        logger.debug("Import file:", file.name);
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
        ;

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
      logger.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kopyalama sırasında hata oluştu",
      });
    }
  };

  const { updateBudgetStatus, lockYearBudgets } = useBudget({ 
    year: filters.year, 
    currency: filters.currency 
  });
  const { createRevision } = useBudgetApproval(filters.year);

  // Fetch budget status
  useEffect(() => {
    const fetchBudgetStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (!profile?.company_id) return;

        const { data: budgets } = await supabase
          .from("budgets")
          .select("status")
          .eq("year", filters.year)
          
          .limit(1)
          .single();

        if (budgets) {
          setBudgetStatus(budgets.status || "draft");
        }
      } catch (error) {
        logger.error("Error fetching budget status:", error);
      }
    };

    fetchBudgetStatus();
  }, [filters.year]);

  const handleSave = async () => {
    try {
      // Save all changes - BudgetGrid handles individual cell saves
      setHasUnsavedChanges(false);
      toast({
        title: "Başarılı",
        description: "Bütçe planlaması kaydedildi",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kaydetme sırasında hata oluştu",
      });
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // Update all budgets to approved status
      const { error } = await supabase
        .from("budgets")
        .update({ status: "approved" })
        .eq("year", filters.year)
        
        .eq("status", "draft");

      if (error) throw error;

      setBudgetStatus("approved");
      setHasUnsavedChanges(false);

      toast({
        title: "Başarılı",
        description: "Bütçe planlaması onaya gönderildi",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Onaya gönderilirken hata oluştu",
      });
    }
  };

  const handleRequestRevision = async () => {
    // Navigate to approval page with revision form
    navigate("/budget/approvals");
  };

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: "Taslak", color: "bg-gray-100 text-gray-800 border-gray-200" },
      approved: { label: "Onaylandı", color: "bg-green-100 text-green-800 border-green-200" },
      locked: { label: "Kilitli", color: "bg-red-100 text-red-800 border-red-200" },
    };

    const config = statusConfig[budgetStatus] || statusConfig.draft;

    return (
      <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </Badge>
    );
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
              Bütçe Planlama
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Belirlenen dönem için gelir ve gider hedeflerinin; proje, departman ve kategori bazında tanımlandığı, revize edildiği ve onaya hazırlandığı alan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* İşlemler Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                <span>İşlemler</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handleCopyFromPreviousYear}
                className="gap-2 cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Önceki Yıldan Kopyala</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleImport}
                className="gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Excel İçe Aktar</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExport}
                className="gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Excel Dışa Aktar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {budgetStatus === "draft" && (
                <>
                  <DropdownMenuItem
                    onClick={handleRequestRevision}
                    className="gap-2 cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Revizyon Talebi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSubmitForApproval}
                    disabled={hasUnsavedChanges}
                    className="gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>Onaya Gönder</span>
                  </DropdownMenuItem>
                </>
              )}
              {budgetStatus === "approved" && (
                <DropdownMenuItem
                  onClick={handleRequestRevision}
                  className="gap-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Revizyon Talebi</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Kaydet Butonu - Ayrı */}
          {budgetStatus === "draft" && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </Button>
          )}
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

