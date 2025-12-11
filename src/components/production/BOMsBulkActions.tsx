import { Button } from "@/components/ui/button";
import { 
  X, 
  Trash2, 
  Download,
  Copy
} from "lucide-react";

interface BOMsBulkActionsProps {
  selectedBOMs: string[];
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

const BOMsBulkActions = ({ 
  selectedBOMs, 
  onClearSelection,
  onBulkAction
}: BOMsBulkActionsProps) => {
  const hasSelection = selectedBOMs.length > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedBOMs.length} reçete seçildi` : "Reçete seçilmedi"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
          disabled={!hasSelection}
          onClick={() => onBulkAction('export')}
        >
          <Download className="h-4 w-4 mr-1" />
          Excel İndir
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-purple-700 border-purple-300 hover:bg-purple-100"
          disabled={!hasSelection}
          onClick={() => onBulkAction('duplicate')}
        >
          <Copy className="h-4 w-4 mr-1" />
          Kopyala
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-100"
          disabled={!hasSelection}
          onClick={() => onBulkAction('delete')}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Sil
        </Button>
        
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4 mr-1" />
            Seçimi Temizle
          </Button>
        )}
      </div>
    </div>
  );
};

export default BOMsBulkActions;
