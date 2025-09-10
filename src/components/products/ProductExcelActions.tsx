import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductExcelActionsProps {
  totalProducts: number;
  onDownloadTemplate?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onBulkAction?: (action: string) => void;
}

const ProductExcelActions = ({ 
  totalProducts,
  onDownloadTemplate,
  onExportExcel,
  onImportExcel,
  onBulkAction
}: ProductExcelActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-9"
        onClick={onDownloadTemplate}
      >
        <FileText className="w-4 h-4 mr-2" />
        Şablon İndir
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-9"
        onClick={onExportExcel}
      >
        <Download className="w-4 h-4 mr-2" />
        Excel İndir
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-9"
        onClick={onImportExcel}
      >
        <Upload className="w-4 h-4 mr-2" />
        Excel Yükle
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onBulkAction?.("activate")}>
            Seçilenleri Aktifleştir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction?.("deactivate")}>
            Seçilenleri Pasifleştir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction?.("delete")}>
            Seçilenleri Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProductExcelActions;
