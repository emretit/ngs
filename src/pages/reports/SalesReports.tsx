/**
 * SalesReports Page
 * Satış Raporları sayfası - Tab yapısı ile farklı rapor tipleri
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SalesReportsHeader from "@/components/reports/sales/SalesReportsHeader";
import SalesReportsGlobalFilters from "@/components/reports/sales/SalesReportsGlobalFilters";
import SalesReportsTabContent from "@/components/reports/sales/SalesReportsTabContent";
import AIReportChat from "@/components/reports/AIReportChat";
import ReportCard from "@/components/reports/ReportCard";
import { useModuleReport, ModuleType } from "@/hooks/useModuleReport";
import { Target, FileText, TrendingUp, BarChart3, Funnel, Users, FileText as FileTextIcon, AlertCircle, Building2, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchSalesFunnelData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

// Sales Funnel Header with Stats
function SalesFunnelHeaderWithStats({ filters }: { filters: GlobalFilters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-funnel', filters],
    queryFn: () => fetchSalesFunnelData(filters),
  });

  // Dönüşüm oranı: Kazanılan / (Kazanılan + Kaybedilen)
  const overallConversionRate = data
    ? (() => {
        const wonStage = data.stages.find(s => s.stage === 'won');
        const wonCount = wonStage?.count || 0;
        const lostCount = data.lostDealsCount || 0;
        const totalClosed = wonCount + lostCount;
        if (totalClosed === 0) return 0;
        return (wonCount / totalClosed) * 100;
      })()
    : 0;

  const avgDealValue = data && data.totalDeals > 0
    ? data.totalPipelineValue / data.totalDeals
    : 0;

  // Metrik kartları - Teklifler sayfasındaki gibi
  const metricCards = [
    {
      label: 'Toplam Pipeline',
      value: data ? `₺${data.totalPipelineValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}` : '₺0',
      icon: TrendingUp,
      colorClass: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Fırsat Sayısı',
      value: data ? data.totalDeals.toString() : '0',
      icon: Target,
      colorClass: 'bg-green-100 text-green-800',
    },
    {
      label: 'Dönüşüm Oranı',
      value: `${overallConversionRate.toFixed(1)}%`,
      icon: overallConversionRate > 20 ? TrendingUp : TrendingDown,
      colorClass: overallConversionRate > 20 ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800',
    },
    {
      label: 'Ortalama Değer',
      value: `₺${avgDealValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`,
      icon: FileText,
      colorClass: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
            <Funnel className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Satış Hunisi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Satış hunisi ve dönüşüm oranları analizi
            </p>
          </div>
        </div>
        
        {/* Orta - Metrik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {!isLoading && data && metricCards.map(({ label, value, icon: Icon, colorClass }, index) => (
            <div
              key={index}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${colorClass} border-gray-200`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {value}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-7 w-24 bg-gray-200 rounded-md animate-pulse"
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalesReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const queryClient = useQueryClient();
  const { exportToExcel, exportToPDF, moduleConfig } = useModuleReport();

  // Sync tab with URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    if (value !== "overview") {
      newParams.set("tab", value);
    } else {
      newParams.delete("tab");
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    setLastUpdated(new Date());
    toast.success("Veriler yenilendi");
  };

  const handleExport = (moduleId: ModuleType, type: "excel" | "pdf") => {
    const options = {
      module: moduleId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    if (type === "excel") {
      exportToExcel(options);
      toast.success("Excel dosyası hazırlanıyor...");
    } else {
      exportToPDF(options);
      toast.success("PDF dosyası hazırlanıyor...");
    }
  };

  // Convert searchParams to filters object for SalesReportsGlobalFilters
  const filters = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    salesRepId: searchParams.get("salesRepId") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    projectId: searchParams.get("projectId") || undefined,
    salesStage: searchParams.get("salesStage") || undefined,
    currency: (searchParams.get("currency") || "TRY") as "TRY" | "USD" | "EUR",
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
    
    // Subtle feedback for filter changes
    const newFilterCount = Object.values(newFilters).filter(
      (v) => v !== undefined && v !== null && v !== 'TRY'
    ).length;
    if (newFilterCount > 0) {
      toast.success(`${newFilterCount} filtre uygulandı`, { duration: 2000 });
    }
  };

  const handleExportAll = () => {
    // Tüm raporları dışa aktar
    toast.info("Tüm raporlar dışa aktarılıyor...");
  };

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== 'TRY'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <SalesReportsHeader 
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        onExportAll={handleExportAll}
      />

      {/* Global Filters */}
      <SalesReportsGlobalFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Sticky Info Row - Shows when filters are active */}
      {activeFilterCount > 0 && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 py-2 px-4 rounded-md shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{activeFilterCount}</strong> filtre aktif
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Son güncelleme: {format(lastUpdated, "HH:mm", { locale: tr })}
              </span>
            </div>
            <button
              onClick={() => {
                handleFiltersChange({
                  startDate: undefined,
                  endDate: undefined,
                  salesRepId: undefined,
                  customerId: undefined,
                  projectId: undefined,
                  salesStage: undefined,
                  currency: 'TRY',
                });
                toast.success("Filtreler sıfırlandı");
              }}
              className="text-xs text-primary hover:text-primary/80 underline"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Genel Bakış</span>
                  <span className="sm:hidden">Genel</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Satış raporlarına genel bakış ve hızlı erişim</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Performans</span>
                  <span className="sm:hidden">Perf.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Satış performansı metrikleri ve trend analizi</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="funnel" className="flex items-center gap-2">
                  <Funnel className="h-4 w-4" />
                  <span className="hidden sm:inline">Huni</span>
                  <span className="sm:hidden">Huni</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Satış hunisi ve dönüşüm oranları analizi</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="reps" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Temsilciler</span>
                  <span className="sm:hidden">Tems.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Satış temsilcileri performans karşılaştırması</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="proposals" className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Teklifler</span>
                  <span className="sm:hidden">Tek.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Teklif durumları ve kabul oranları</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="forecast" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Tahmin</span>
                  <span className="sm:hidden">Tah.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Satış tahminleri ve pipeline analizi</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="lost" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Kayıplar</span>
                  <span className="sm:hidden">Kay.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kayıp satışlar ve neden analizi</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Müşteriler</span>
                  <span className="sm:hidden">Müş.</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Müşteri bazlı satış analizleri</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>
        <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Tab Intro Section */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Genel Bakış</h2>
                  <p className="text-sm text-muted-foreground">
                    Satış raporlarına genel bakış ve hızlı erişim araçları
                  </p>
                </div>
              </div>

              {/* Quick Export Cards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Hızlı Raporlar
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ReportCard
                    title={moduleConfig.opportunities.displayName}
                    description="Satış fırsatları listesi"
                    icon={Target}
                    iconColor="text-red-600"
                    recordCount={0}
                    isLoading={false}
                    onExportExcel={() => handleExport("opportunities", "excel")}
                    onExportPDF={() => handleExport("opportunities", "pdf")}
                  />
                  <ReportCard
                    title={moduleConfig.sales_invoices.displayName}
                    description="Satış faturaları listesi"
                    icon={FileText}
                    iconColor="text-emerald-600"
                    recordCount={0}
                    isLoading={false}
                    onExportExcel={() => handleExport("sales_invoices", "excel")}
                    onExportPDF={() => handleExport("sales_invoices", "pdf")}
                  />
                </div>
              </div>

              {/* AI Report Chat */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">AI Rapor Asistanı</h2>
                  <p className="text-sm text-muted-foreground">
                    Raporlarınız hakkında sorular sorun, otomatik analizler ve içgörüler alın
                  </p>
                </div>
                <AIReportChat searchParams={searchParams} />
              </div>
            </TabsContent>

        <TabsContent value="performance" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Satış Performansı</h2>
              <p className="text-sm text-muted-foreground">
                Satış performansı metrikleri ve trend analizi
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="sales_performance"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="funnel" className="mt-0">
          <SalesFunnelHeaderWithStats filters={filters} />
          <SalesReportsTabContent 
            defaultReportType="sales_funnel"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="reps" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Satış Temsilcileri</h2>
              <p className="text-sm text-muted-foreground">
                Satış temsilcileri performans karşılaştırması
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="sales_rep_performance"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="proposals" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileTextIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Teklifler</h2>
              <p className="text-sm text-muted-foreground">
                Teklif durumları ve kabul oranları
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="proposal_analysis"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="forecast" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Satış Tahmini</h2>
              <p className="text-sm text-muted-foreground">
                Satış tahminleri ve pipeline analizi
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="sales_forecast"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="lost" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Kayıp Satışlar</h2>
              <p className="text-sm text-muted-foreground">
                Kayıp satışlar ve neden analizi
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="lost_sales"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>

        <TabsContent value="customers" className="mt-0">
          {/* Tab Intro Section */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Müşteri Satışları</h2>
              <p className="text-sm text-muted-foreground">
                Müşteri bazlı satış analizleri
              </p>
            </div>
          </div>
          <SalesReportsTabContent 
            defaultReportType="customer_sales"
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
