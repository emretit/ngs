import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3, Download, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface SalesReportsHeaderProps {
  onRefresh?: () => void;
  lastUpdated?: Date;
  onExportAll?: () => void;
}

const SalesReportsHeader = ({ 
  onRefresh, 
  lastUpdated = new Date(),
  onExportAll 
}: SalesReportsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-lg border border-primary/10 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white shadow-md ring-2 ring-primary/20 flex-shrink-0">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Satış Raporları
          </h1>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Satış performansını, eğilimleri ve fırsatları detaylı analiz edin
          </p>
        </div>
      </div>
      
      {/* Orta - Bilgi Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 text-muted-foreground border-0 shadow-none"
        >
          <Clock className="h-3 w-3" />
          <span className="text-xs font-normal">
            {format(lastUpdated, "HH:mm", { locale: tr })}
          </span>
        </Badge>
      </div>
      
      {/* Sağ taraf - Action Butonları (Gruplanmış) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        )}
        {onExportAll && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onExportAll}
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SalesReportsHeader;

