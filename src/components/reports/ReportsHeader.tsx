import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ReportsHeaderProps {
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export default function ReportsHeader({ 
  onRefresh,
  lastUpdated = new Date()
}: ReportsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-4 mb-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        {/* Title Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                Raporlar & Analitik
              </h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Her modül için Excel ve PDF raporlarını aşağıdan indirebilirsiniz
              </p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Canlı Veriler
            </Badge>
            <Badge variant="outline" className="text-muted-foreground text-xs">
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
            className="gap-2 h-8 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yenile
          </Button>
        </div>
      </div>
    </div>
  );
}
