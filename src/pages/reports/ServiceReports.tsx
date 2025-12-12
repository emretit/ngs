import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import ReportsKPIRow from "@/components/reports/ReportsKPIRow";
import ReportsServiceSection from "@/components/reports/ReportsServiceSection";
import AIReportChat from "@/components/reports/AIReportChat";
import ReportCard from "@/components/reports/ReportCard";
import { useModuleReport, ModuleType } from "@/hooks/useModuleReport";
import { Wrench } from "lucide-react";

export default function ServiceReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['service']);
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
          <Wrench className="h-5 w-5 text-primary" />
          Hızlı Raporlar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title={moduleConfig.service_records.displayName}
            description="Servis kayıtları listesi"
            icon={Wrench}
            iconColor="text-indigo-600"
            recordCount={0}
            isLoading={false}
            onExportExcel={() => handleExport("service_records", "excel")}
            onExportPDF={() => handleExport("service_records", "pdf")}
          />
        </div>
      </div>

      {/* Detailed Analysis */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Detaylı Analizler & Grafikler
        </h2>
        <ReportsServiceSection
          isExpanded={isExpanded('service')}
          onToggle={() => toggleSection('service')}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}

