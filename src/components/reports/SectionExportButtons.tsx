import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SectionExportButtonsProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  isLoading?: boolean;
}

export default function SectionExportButtons({
  onExportExcel,
  onExportPDF,
  isLoading = false
}: SectionExportButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExportExcel}
              disabled={isLoading}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Excel olarak indir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExportPDF}
              disabled={isLoading}
            >
              <FileText className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">PDF olarak indir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

