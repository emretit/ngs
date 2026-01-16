import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import ReportsKPIRow from "@/components/reports/ReportsKPIRow";
import ReportsInventorySection from "@/components/reports/ReportsInventorySection";
import AIReportChat from "@/components/reports/AIReportChat";
import ReportCard from "@/components/reports/ReportCard";
import SavedViewsManager from "@/components/reports/SavedViewsManager";
import DrillDownModal, { DrillDownData } from "@/components/reports/DrillDownModal";
import { useModuleReport, ModuleType } from "@/hooks/useModuleReport";
import { Package } from "lucide-react";

export default function InventoryReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['inventory']);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const queryClient = useQueryClient();
  const { exportToExcel, exportToPDF, moduleConfig } = useModuleReport();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

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
    } else {
      exportToPDF(options);
    }
  };

  return (
    <div className="space-y-4">
      <ReportsHeader 
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      <div className="flex items-center justify-end">
        <SavedViewsManager
          reportCategory="inventory"
          currentFilters={Object.fromEntries(searchParams)}
          onLoadView={(filters) => {
            const newParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
              if (value) newParams.set(key, String(value));
            });
            setSearchParams(newParams);
          }}
          onSaveView={() => ({
            filters: Object.fromEntries(searchParams),
          })}
        />
      </div>

      <ReportsKPIRow searchParams={searchParams} />

      <AIReportChat searchParams={searchParams} />

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Hızlı Raporlar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title={moduleConfig.products.displayName}
            description="Ürün listesi ve stok durumu"
            icon={Package}
            iconColor="text-amber-600"
            recordCount={0}
            isLoading={false}
            onExportExcel={() => handleExport("products", "excel")}
            onExportPDF={() => handleExport("products", "pdf")}
          />
        </div>
      </div>

      {/* Detailed Analysis */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Detaylı Analizler & Grafikler
        </h2>
        <ReportsInventorySection
          isExpanded={isExpanded('inventory')}
          onToggle={() => toggleSection('inventory')}
          searchParams={searchParams}
        />
      </div>

      <DrillDownModal
        open={!!drillDownData}
        onClose={() => setDrillDownData(null)}
        data={drillDownData}
      />
    </div>
  );
}

