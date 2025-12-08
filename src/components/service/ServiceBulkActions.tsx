import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, Download, FileSpreadsheet, Trash2, Clock } from "lucide-react";
import type { ServiceRequest } from "@/hooks/service/types";

interface ServiceBulkActionsProps {
  selectedServices: ServiceRequest[];
  onClearSelection: () => void;
  onBulkAction: (action: string, serviceIds: string[]) => void;
}

const ServiceBulkActions = ({ 
  selectedServices, 
  onClearSelection,
  onBulkAction
}: ServiceBulkActionsProps) => {
  const hasSelection = selectedServices.length > 0;

  const handleBulkAction = (action: string) => {
    const serviceIds = selectedServices.map(s => s.id);
    onBulkAction(action, serviceIds);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedServices.length} servis seçildi` : "Servis seçilmedi"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
          disabled={!hasSelection}
          onClick={() => handleBulkAction('export')}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Excel İndir
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-green-700 border-green-300 hover:bg-green-100"
          disabled={!hasSelection}
          onClick={() => handleBulkAction('complete')}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Tamamlandı İşaretle
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
          disabled={!hasSelection}
          onClick={() => handleBulkAction('in_progress')}
        >
          <Clock className="h-4 w-4 mr-1" />
          Devam Ediyor İşaretle
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-100"
          disabled={!hasSelection}
          onClick={() => handleBulkAction('cancel')}
        >
          <XCircle className="h-4 w-4 mr-1" />
          İptal Et
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-100"
          disabled={!hasSelection}
          onClick={() => handleBulkAction('delete')}
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

export default ServiceBulkActions;


















