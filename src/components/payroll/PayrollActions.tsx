import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Save, 
  FileDown, 
  FileSpreadsheet, 
  History 
} from "lucide-react";

interface PayrollActionsProps {
  onCalculate: () => void;
  onSave: () => void;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  onViewHistory: () => void;
  isCalculating?: boolean;
  isSaving?: boolean;
  hasCalculation?: boolean;
}

export const PayrollActions = ({
  onCalculate,
  onSave,
  onDownloadPdf,
  onDownloadExcel,
  onViewHistory,
  isCalculating = false,
  isSaving = false,
  hasCalculation = false,
}: PayrollActionsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onCalculate}
        disabled={isCalculating}
        className="gap-2"
        size="lg"
      >
        <Calculator className="w-4 h-4" />
        {isCalculating ? 'Hesaplanıyor...' : 'Bordroyu Hesapla'}
      </Button>

      {hasCalculation && (
        <>
          <Button
            onClick={onSave}
            disabled={isSaving}
            variant="secondary"
            className="gap-2"
            size="lg"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={onDownloadPdf}
              variant="outline"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              PDF İndir
            </Button>

            <Button
              onClick={onDownloadExcel}
              variant="outline"
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel İndir
            </Button>
          </div>
        </>
      )}

      <Button
        onClick={onViewHistory}
        variant="ghost"
        className="gap-2 ml-auto"
      >
        <History className="w-4 h-4" />
        Geçmiş Bordrolar
      </Button>
    </div>
  );
};
