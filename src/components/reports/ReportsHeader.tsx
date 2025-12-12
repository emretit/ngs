import { FileDown, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ReportsHeaderProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export default function ReportsHeader({ 
  onExportPDF, 
  onExportExcel, 
  onRefresh,
  lastUpdated = new Date()
}: ReportsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Raporlar & Analitik
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Tüm iş süreçlerinizi tek bir yerden analiz edin
              </p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Canlı Veriler
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Son güncelleme: {format(lastUpdated, "HH:mm", { locale: tr })}
            </Badge>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExportExcel}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
          <Button 
            size="sm"
            onClick={onExportPDF}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            PDF Rapor
          </Button>
        </div>
      </div>
    </div>
  );
}
