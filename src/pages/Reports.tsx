import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportsFilters from "@/components/reports/ReportsFilters";
import ReportsKPIRow from "@/components/reports/ReportsKPIRow";
import ReportsSalesSection from "@/components/reports/ReportsSalesSection";
import ReportsPurchasingSection from "@/components/reports/ReportsPurchasingSection";
import ReportsInventorySection from "@/components/reports/ReportsInventorySection";
import ReportsServiceSection from "@/components/reports/ReportsServiceSection";
import ReportsFinanceSection from "@/components/reports/ReportsFinanceSection";
import ReportsHRSection from "@/components/reports/ReportsHRSection";
import ReportsVehicleSection from "@/components/reports/ReportsVehicleSection";
import AIReportChat from "@/components/reports/AIReportChat";
import { useReportExport } from "@/hooks/useReportExport";

interface ReportsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Reports({ isCollapsed, setIsCollapsed }: ReportsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['sales']);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const queryClient = useQueryClient();
  const { exportToExcel, exportToPDF } = useReportExport();

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

  const handleExportPDF = () => {
    const options = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      currency: searchParams.get("currency") || undefined
    };
    exportToPDF(options);
  };

  const handleExportExcel = () => {
    const options = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      currency: searchParams.get("currency") || undefined
    };
    exportToExcel(options);
  };

  try {
    return (
      <div className="space-y-6">
        {/* Modern Header */}
        <ReportsHeader 
          onRefresh={handleRefresh}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          lastUpdated={lastUpdated}
        />

        {/* Global Filters */}
        <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

        {/* KPI Summary Row */}
        <ReportsKPIRow searchParams={searchParams} />

        {/* AI Report Chat */}
        <AIReportChat searchParams={searchParams} />

        {/* Report Sections */}
        <div className="space-y-4">
          <ReportsSalesSection
            isExpanded={isExpanded('sales')}
            onToggle={() => toggleSection('sales')}
            searchParams={searchParams}
          />
          <ReportsPurchasingSection
            isExpanded={isExpanded('purchasing')}
            onToggle={() => toggleSection('purchasing')}
            searchParams={searchParams}
          />
          <ReportsInventorySection
            isExpanded={isExpanded('inventory')}
            onToggle={() => toggleSection('inventory')}
            searchParams={searchParams}
          />
          <ReportsServiceSection
            isExpanded={isExpanded('service')}
            onToggle={() => toggleSection('service')}
            searchParams={searchParams}
          />
          <ReportsFinanceSection
            isExpanded={isExpanded('finance')}
            onToggle={() => toggleSection('finance')}
            searchParams={searchParams}
          />
          <ReportsHRSection
            isExpanded={isExpanded('hr')}
            onToggle={() => toggleSection('hr')}
            searchParams={searchParams}
          />
          <ReportsVehicleSection
            isExpanded={isExpanded('vehicles')}
            onToggle={() => toggleSection('vehicles')}
            searchParams={searchParams}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Reports page error:', error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-semibold">Sayfa Yüklenirken Hata Oluştu</h3>
          <p className="text-destructive/80 mt-2">Lütfen sayfayı yenileyin veya geliştirici konsolunu kontrol edin.</p>
          <pre className="text-xs mt-2 text-destructive/60">{String(error)}</pre>
        </div>
      </div>
    );
  }
}
