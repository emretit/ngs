import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Banknote, 
  Users, 
  Car,
  Wrench,
  Download,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportType = 
  | "sales" 
  | "purchasing" 
  | "inventory" 
  | "finance" 
  | "hr" 
  | "vehicles" 
  | "service";

export interface ReportOption {
  id: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const reportOptions: ReportOption[] = [
  {
    id: "sales",
    label: "Satış Raporu",
    description: "Fırsatlar, teklifler ve satış performansı",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-emerald-500 bg-emerald-500/10"
  },
  {
    id: "purchasing",
    label: "Satın Alma Raporu",
    description: "Alış faturaları ve tedarikçi verileri",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-blue-500 bg-blue-500/10"
  },
  {
    id: "inventory",
    label: "Envanter Raporu",
    description: "Stok durumu ve ürün listesi",
    icon: <Package className="h-5 w-5" />,
    color: "text-amber-500 bg-amber-500/10"
  },
  {
    id: "finance",
    label: "Finans Raporu",
    description: "Banka hesapları ve nakit akışı",
    icon: <Banknote className="h-5 w-5" />,
    color: "text-violet-500 bg-violet-500/10"
  },
  {
    id: "hr",
    label: "İnsan Kaynakları Raporu",
    description: "Çalışan listesi ve departman bilgileri",
    icon: <Users className="h-5 w-5" />,
    color: "text-pink-500 bg-pink-500/10"
  },
  {
    id: "vehicles",
    label: "Araç Filosu Raporu",
    description: "Araç listesi ve bakım durumu",
    icon: <Car className="h-5 w-5" />,
    color: "text-cyan-500 bg-cyan-500/10"
  },
  {
    id: "service",
    label: "Servis Raporu",
    description: "Servis kayıtları ve iş emirleri",
    icon: <Wrench className="h-5 w-5" />,
    color: "text-orange-500 bg-orange-500/10"
  }
];

interface ReportExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: "excel" | "pdf";
  onExport: (selectedReports: ReportType[]) => void;
}

export default function ReportExportModal({
  open,
  onOpenChange,
  exportType,
  onExport
}: ReportExportModalProps) {
  const [selectedReports, setSelectedReports] = useState<ReportType[]>(["sales"]);

  const toggleReport = (reportId: ReportType) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const selectAll = () => {
    setSelectedReports(reportOptions.map(r => r.id));
  };

  const clearAll = () => {
    setSelectedReports([]);
  };

  const handleExport = () => {
    if (selectedReports.length > 0) {
      onExport(selectedReports);
      onOpenChange(false);
    }
  };

  const isExcel = exportType === "excel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isExcel ? (
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            ) : (
              <FileText className="h-5 w-5 text-red-600" />
            )}
            {isExcel ? "Excel Raporu İndir" : "PDF Raporu İndir"}
          </DialogTitle>
          <DialogDescription>
            İndirmek istediğiniz rapor türlerini seçin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedReports.length} rapor seçili
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={selectAll}
                className="text-xs h-7"
              >
                Tümünü Seç
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="text-xs h-7 text-muted-foreground"
              >
                Temizle
              </Button>
            </div>
          </div>

          {/* Report Options */}
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-2">
              {reportOptions.map((report) => {
                const isSelected = selectedReports.includes(report.id);
                return (
                  <div
                    key={report.id}
                    onClick={() => toggleReport(report.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      report.color
                    )}>
                      {report.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{report.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {report.description}
                      </div>
                    </div>
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected 
                        ? "border-primary bg-primary" 
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Export Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedReports.length === 0}
              className={cn(
                "gap-2",
                isExcel 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              <Download className="h-4 w-4" />
              {isExcel ? "Excel İndir" : "PDF İndir"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

