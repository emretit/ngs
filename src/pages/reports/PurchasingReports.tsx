import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import ReportsKPIRow from "@/components/reports/ReportsKPIRow";
import ReportsPurchasingSection from "@/components/reports/ReportsPurchasingSection";
import AIReportChat from "@/components/reports/AIReportChat";
import ReportCard from "@/components/reports/ReportCard";
import { useModuleReport, ModuleType } from "@/hooks/useModuleReport";
import { ShoppingCart, Building2, FileText } from "lucide-react";

export default function PurchasingReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['purchasing']);
  const [lastUpdated, setLastUpdated] = useState(new Date());
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
    <div className="space-y-6">
      <ReportsHeader 
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      <ReportsKPIRow searchParams={searchParams} />

      <AIReportChat searchParams={searchParams} />

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Hızlı Raporlar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title={moduleConfig.purchase_invoices.displayName}
            description="Alış faturaları listesi"
            icon={FileText}
            iconColor="text-orange-600"
            recordCount={0}
            isLoading={false}
            onExportExcel={() => handleExport("purchase_invoices", "excel")}
            onExportPDF={() => handleExport("purchase_invoices", "pdf")}
          />
          <ReportCard
            title={moduleConfig.suppliers.displayName}
            description="Tedarikçi listesi"
            icon={Building2}
            iconColor="text-purple-600"
            recordCount={0}
            isLoading={false}
            onExportExcel={() => handleExport("suppliers", "excel")}
            onExportPDF={() => handleExport("suppliers", "pdf")}
          />
        </div>
      </div>

      {/* Detailed Analysis */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Detaylı Analizler & Grafikler
        </h2>
        <ReportsPurchasingSection
          isExpanded={isExpanded('purchasing')}
          onToggle={() => toggleSection('purchasing')}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}

