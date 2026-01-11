import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Image, FileImage } from "lucide-react";
import { handleExport, ExportFormat } from "./utils/chartExport";
import { toast } from "sonner";

interface ChartExportMenuProps {
  data: any[];
  elementId: string;
  filename: string;
  formats?: ExportFormat[];
}

export const ChartExportMenu = memo(({ 
  data, 
  elementId, 
  filename,
  formats = ['csv', 'excel', 'png', 'svg']
}: ChartExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const onExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      await handleExport(format, data, elementId, filename);
      toast.success(`${format.toUpperCase()} olarak dışa aktarıldı!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Dışa aktarma başarısız oldu');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Dışa Aktarılıyor...' : 'Dışa Aktar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Dışa Aktarma Formatı</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {formats.includes('csv') && (
          <DropdownMenuItem onClick={() => onExport('csv')} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Dosyası
          </DropdownMenuItem>
        )}
        
        {formats.includes('excel') && (
          <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel Dosyası
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {formats.includes('png') && (
          <DropdownMenuItem onClick={() => onExport('png')} className="gap-2">
            <Image className="h-4 w-4 text-blue-600" />
            PNG Görüntü
          </DropdownMenuItem>
        )}
        
        {formats.includes('svg') && (
          <DropdownMenuItem onClick={() => onExport('svg')} className="gap-2">
            <FileImage className="h-4 w-4 text-purple-600" />
            SVG Görüntü
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ChartExportMenu.displayName = "ChartExportMenu";

