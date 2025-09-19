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

export default function Reports() {
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

  return (
    <div id="reports-root" className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raporlar</h1>
          <p className="text-muted-foreground">Kapsamlı işletme analitiği ve raporlama</p>
        </div>
      </div>

      {/* Global Filters */}
      <ReportsFilters searchParams={searchParams} setSearchParams={setSearchParams} />

      {/* KPI Row */}
      <ReportsKPIRow searchParams={searchParams} />

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
}