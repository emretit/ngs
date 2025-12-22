/**
 * SalesReportsTabContent Component
 * Satış raporları tab içeriği - Tüm rapor bloklarını birleştirir
 */

import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, Save, MoreVertical } from "lucide-react";
import SalesReportsGlobalFilters from "./SalesReportsGlobalFilters";
import ReportBlock from "./ReportBlock";
import ReportFullscreenModal from "./modals/ReportFullscreenModal";
import ReportDrillDownModal from "./modals/ReportDrillDownModal";
import SaveViewModal from "./modals/SaveViewModal";
import { useSavedViews } from "@/hooks/useSavedViews";
import { useReportExport } from "@/hooks/useReportExport";
import type {
  GlobalFilters,
  ReportBlockConfig,
  ReportType,
  DrillDownData,
} from "@/types/salesReports";
import SalesPerformanceReport from "./reports/SalesPerformanceReport";
import SalesFunnelReport from "./reports/SalesFunnelReport";
import SalesRepPerformanceReport from "./reports/SalesRepPerformanceReport";
import ProposalAnalysisReport from "./reports/ProposalAnalysisReport";
import SalesForecastReport from "./reports/SalesForecastReport";
import LostSalesReport from "./reports/LostSalesReport";
import CustomerSalesReport from "./reports/CustomerSalesReport";

// Default report block configurations
const DEFAULT_REPORT_BLOCKS: ReportBlockConfig[] = [
  {
    id: "sales_performance",
    reportType: "sales_performance",
    title: "Satış Performansı Genel Bakış",
    description: "Toplam satış, işlem sayısı, kazanma oranı ve trendler",
    chartType: "mixed",
    order: 0,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "sales_funnel",
    reportType: "sales_funnel",
    title: "Satış Hunisi Analizi",
    description: "Fırsat aşamaları ve dönüşüm oranları",
    chartType: "chart",
    order: 1,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "sales_rep_performance",
    reportType: "sales_rep_performance",
    title: "Satış Temsilcisi Performansı",
    description: "Temsilci bazlı satış metrikleri ve liderlik tablosu",
    chartType: "mixed",
    order: 2,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "proposal_analysis",
    reportType: "proposal_analysis",
    title: "Teklif & Teklif Analizi",
    description: "Teklif durumları, kabul oranları ve hacim trendleri",
    chartType: "mixed",
    order: 3,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "sales_forecast",
    reportType: "sales_forecast",
    title: "Satış Tahmini & Pipeline",
    description: "Açık fırsatlar, tahminler ve beklenen gelir",
    chartType: "mixed",
    order: 4,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "lost_sales",
    reportType: "lost_sales",
    title: "Kayıp Satış Analizi",
    description: "Kayıp fırsatlar ve nedenleri",
    chartType: "chart",
    order: 5,
    isVisible: true,
    isExpanded: true,
  },
  {
    id: "customer_sales",
    reportType: "customer_sales",
    title: "Müşteri Bazlı Satış Analizi",
    description: "Müşteri bazlı gelir ve işlem analizleri",
    chartType: "mixed",
    order: 6,
    isVisible: true,
    isExpanded: true,
  },
];

const REPORT_COMPONENTS: Record<ReportType, React.ComponentType<any>> = {
  sales_performance: SalesPerformanceReport,
  sales_funnel: SalesFunnelReport,
  sales_rep_performance: SalesRepPerformanceReport,
  proposal_analysis: ProposalAnalysisReport,
  sales_forecast: SalesForecastReport,
  lost_sales: LostSalesReport,
  customer_sales: CustomerSalesReport,
};

interface SalesReportsTabContentProps {
  defaultReportType?: ReportType;
  filters?: GlobalFilters;
  onFiltersChange?: (filters: GlobalFilters) => void;
}

export default function SalesReportsTabContent({ 
  defaultReportType,
  filters: externalFilters,
  onFiltersChange: externalOnFiltersChange,
}: SalesReportsTabContentProps = {}) {
  const [internalFilters, setInternalFilters] = useState<GlobalFilters>({});
  
  // Use external filters if provided, otherwise use internal
  const filters = externalFilters !== undefined ? externalFilters : internalFilters;
  const setFilters = externalOnFiltersChange || setInternalFilters;
  const [reportBlocks, setReportBlocks] = useState<ReportBlockConfig[]>(() => {
    if (defaultReportType) {
      // Sadece belirtilen rapor tipini göster
      const block = DEFAULT_REPORT_BLOCKS.find(b => b.reportType === defaultReportType);
      return block ? [block] : [];
    }
    return DEFAULT_REPORT_BLOCKS;
  });
  const [fullscreenReport, setFullscreenReport] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [saveViewOpen, setSaveViewOpen] = useState(false);

  const { views, saveView, loadView, getDefaultView } = useSavedViews("sales");
  const { exportReport } = useReportExport();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load default view on mount
  React.useEffect(() => {
    const defaultView = getDefaultView();
    if (defaultView) {
      setReportBlocks(defaultView.layoutConfig.reportBlocks);
      setFilters(defaultView.filters);
    }
  }, [getDefaultView]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setReportBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  const handleExportAll = (format: "pdf" | "excel" | "csv") => {
    // Export all reports
    reportBlocks.forEach((block) => {
      if (block.isVisible) {
        exportReport(block.reportType, {}, format, `Satış_Raporu_${block.title}`);
      }
    });
  };

  const handleSaveView = async (viewName: string, isDefault: boolean) => {
    await saveView({
      viewName,
      layoutConfig: { reportBlocks },
      filters,
      reportOrder: reportBlocks.map((b) => b.id),
      isDefault,
    });
  };

  const handleLoadView = async (viewId: string) => {
    const view = await loadView(viewId);
    if (view) {
      setReportBlocks(view.layoutConfig.reportBlocks);
      setFilters(view.filters);
    }
  };

  const sortedBlocks = useMemo(() => {
    return [...reportBlocks]
      .filter((block) => block.isVisible)
      .sort((a, b) => a.order - b.order);
  }, [reportBlocks]);

  const renderReportContent = (reportType: ReportType, blockConfig: ReportBlockConfig) => {
    const ReportComponent = REPORT_COMPONENTS[reportType];
    if (!ReportComponent) return null;

    return (
      <ReportComponent
        filters={blockConfig.filters || filters}
        onDrillDown={(data) => setDrillDownData(data)}
      />
    );
  };

  const isSingleReportMode = !!defaultReportType;
  const showFilters = externalFilters === undefined; // Only show filters if not provided externally

  return (
    <div className="space-y-8">
      {/* Global Filters - Only show if not provided externally */}
      {showFilters && (
        <SalesReportsGlobalFilters filters={filters} onFiltersChange={setFilters} />
      )}

      {/* Actions Bar - Only show for multi-report mode */}
      {!isSingleReportMode && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select
              value=""
              onValueChange={(value) => {
                if (value === "new") {
                  setSaveViewOpen(true);
                } else if (value) {
                  handleLoadView(value);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Görünüm seçin veya kaydedin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Yeni Görünüm Kaydet</SelectItem>
                {views.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Kayıtlı Görünümler
                    </div>
                    {views.map((view) => (
                      <SelectItem key={view.id} value={view.id}>
                        {view.viewName}
                        {view.isDefault && " (Varsayılan)"}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Tümünü Dışa Aktar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportAll("pdf")}>
                  PDF Olarak İndir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll("excel")}>
                  Excel Olarak İndir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll("csv")}>
                  CSV Olarak İndir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Report Blocks Grid */}
      {isSingleReportMode ? (
        // Single report mode - no drag & drop
        <div className="space-y-8">
          {sortedBlocks.map((block) => {
            const ReportComponent = REPORT_COMPONENTS[block.reportType];
            if (!ReportComponent) return null;

            // Sales Funnel Report - render without ReportBlock wrapper
            if (block.reportType === 'sales_funnel') {
              return (
                <ReportComponent
                  key={block.id}
                  filters={block.filters || filters}
                  onDrillDown={(data) => setDrillDownData(data)}
                />
              );
            }

            // Other reports - use ReportBlock wrapper
            return (
              <ReportBlock
                key={block.id}
                reportType={block.reportType}
                config={block}
                filters={block.filters || filters}
                onExport={(format) => exportReport(block.reportType, {}, format, block.title)}
                onFullscreen={() => {
                  setFullscreenReport({
                    title: block.title,
                    content: (
                      <ReportComponent
                        filters={block.filters || filters}
                        onDrillDown={(data) => setDrillDownData(data)}
                      />
                    ),
                  });
                }}
                onDrillDown={(data) => setDrillDownData(data)}
                showDragHandle={false}
              >
                {renderReportContent(block.reportType, block)}
              </ReportBlock>
            );
          })}
        </div>
      ) : (
        // Multi-report mode - with drag & drop
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {sortedBlocks.map((block) => {
                const ReportComponent = REPORT_COMPONENTS[block.reportType];
                if (!ReportComponent) return null;

                return (
                  <ReportBlock
                    key={block.id}
                    reportType={block.reportType}
                    config={block}
                    filters={block.filters || filters}
                    onExport={(format) => exportReport(block.reportType, {}, format, block.title)}
                    onFullscreen={() => {
                      setFullscreenReport({
                        title: block.title,
                        content: (
                          <ReportComponent
                            filters={block.filters || filters}
                            onDrillDown={(data) => setDrillDownData(data)}
                          />
                        ),
                      });
                    }}
                    onDrillDown={(data) => setDrillDownData(data)}
                  >
                    {renderReportContent(block.reportType, block)}
                  </ReportBlock>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modals */}
      {fullscreenReport && (
        <ReportFullscreenModal
          open={!!fullscreenReport}
          onClose={() => setFullscreenReport(null)}
          title={fullscreenReport.title}
        >
          {fullscreenReport.content}
        </ReportFullscreenModal>
      )}

      <ReportDrillDownModal
        open={!!drillDownData}
        onClose={() => setDrillDownData(null)}
        data={drillDownData}
      />

      <SaveViewModal
        open={saveViewOpen}
        onClose={() => setSaveViewOpen(false)}
        onSave={handleSaveView}
      />
    </div>
  );
}

