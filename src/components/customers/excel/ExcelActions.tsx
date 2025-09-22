import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown } from "lucide-react";
import { exportToExcel } from "@/utils/customerExcelUtils";
import { Customer } from "@/types/customer";

interface ExcelActionsProps {
  customers: Customer[];
  onImportClick: () => void;
}

const ExcelActions = ({ customers, onImportClick }: ExcelActionsProps) => {
  const handleExportExcel = () => {
    exportToExcel(customers);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Excel İşlemleri
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-2" />
          Excel'e Aktar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportClick}>
          <Upload className="h-4 w-4 mr-2" />
          Excel'den İçe Aktar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExcelActions;