import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
interface ReportsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
export default function Reports({ isCollapsed, setIsCollapsed }: ReportsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<string[]>(['sales']);
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);
  try {
    return (
    <>
      {/* Modern Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Raporlar
            </h1>
            <p className="text-muted-foreground mt-1">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>

      <div id="reports-root" className="space-y-6">
          {/* Global Filters */}
          <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />
          {/* AI Report Chat */}
          <AIReportChat searchParams={searchParams} />
          {/* KPI Row - Removed per user request */}
          {/* <ReportsKPIRow searchParams={searchParams} /> */}
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
    </>
  );
  } catch (error) {
    console.error('Reports page error:', error);
    return (
    <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Sayfa Yüklenirken Hata Oluştu</h3>
            <p className="text-red-600 mt-2">Lütfen sayfayı yenileyin veya geliştirici konsolunu kontrol edin.</p>
            <pre className="text-xs mt-2 text-red-500">{String(error)}</pre>
          </div>
        </div>
  );
  }
}