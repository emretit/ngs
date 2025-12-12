import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, FileText, Loader2, TrendingUp } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  recordCount?: number;
  lastUpdated?: string;
  isLoading?: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function ReportCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  recordCount,
  lastUpdated,
  isLoading = false,
  onExportExcel,
  onExportPDF,
  trend
}: ReportCardProps) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br from-background to-muted/50 border border-border/50 group-hover:scale-110 transition-transform duration-300",
              "shadow-sm"
            )}>
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          {recordCount !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  `${recordCount} kayıt`
                )}
              </Badge>
            </div>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              <TrendingUp className={cn(
                "h-3.5 w-3.5",
                !trend.isPositive && "rotate-180"
              )} />
              <span className="font-semibold">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            </div>
          )}

          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-auto">
              {lastUpdated}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={isLoading}
            className="flex-1 gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isLoading}
            className="flex-1 gap-2 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-all"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </Card>
  );
}

