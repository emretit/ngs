/**
 * ReportBlock Component
 * Yeniden kullanılabilir rapor bloğu komponenti
 */

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  GripVertical, 
  Download, 
  Maximize2, 
  MoreVertical,
  FileText,
  FileSpreadsheet,
  File,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportBlockProps, ExportFormat } from "@/types/salesReports";

interface ReportBlockComponentProps extends ReportBlockProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  showDragHandle?: boolean;
}

export default function ReportBlock({
  reportType,
  config,
  filters,
  onExport,
  onFullscreen,
  onDrillDown,
  onFilterChange,
  children,
  isLoading = false,
  error = null,
  showDragHandle = true,
}: ReportBlockComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
    }
  };

  const hasFilterOverrides = config.filters && Object.keys(config.filters).length > 0;

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-50")}>
      <Card className="h-full flex flex-col hover:shadow-xl hover:border-primary/20 transition-all duration-200">
        <CardHeader className="pb-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {/* Drag Handle */}
              {showDragHandle && (
                <button
                  {...attributes}
                  {...listeners}
                  className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Sıralamayı değiştir"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold leading-tight">
                  {config.title}
                </CardTitle>
                {config.description && (
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {config.description}
                  </CardDescription>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onFullscreen?.()}
                  className="cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Tam Ekran
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleExport('pdf')}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Olarak İndir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('excel')}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Olarak İndir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('csv')}
                  className="cursor-pointer"
                >
                  <File className="h-4 w-4 mr-2" />
                  CSV Olarak İndir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter Override Indicator */}
          {hasFilterOverrides && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Özel filtreler uygulanıyor
              </span>
              {onFilterChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto"
                  onClick={() => onFilterChange({})}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 pt-0 pb-6">
          {error ? (
            <div className="flex items-center justify-center h-32 text-sm text-destructive">
              <div className="text-center">
                <p className="font-medium">Hata oluştu</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message || "Veri yüklenirken bir hata oluştu"}
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  {config.title} verileri yükleniyor...
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full"
              onClick={(e) => {
                // Allow drill-down on chart elements
                if (onDrillDown && (e.target as HTMLElement).closest('[data-drilldown]')) {
                  const data = (e.target as HTMLElement).getAttribute('data-drilldown-data');
                  if (data) {
                    try {
                      onDrillDown(JSON.parse(data));
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
              }}
            >
              {children}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

