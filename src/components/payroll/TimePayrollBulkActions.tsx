import React from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Lock, Unlock, Calculator, FileText, Mail } from "lucide-react";

interface TimePayrollBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkCalculate?: () => void;
  onBulkLock?: () => void;
  onBulkUnlock?: () => void;
  onBulkDownload?: () => void;
  onBulkEmail?: () => void;
}

const TimePayrollBulkActions = ({ 
  selectedCount, 
  onClearSelection,
  onBulkCalculate,
  onBulkLock,
  onBulkUnlock,
  onBulkDownload,
  onBulkEmail
}: TimePayrollBulkActionsProps) => {
  const hasSelection = selectedCount > 0;
  
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {hasSelection ? `${selectedCount} kayıt seçildi` : "Kayıt seçilmedi"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {onBulkCalculate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkCalculate}
            className="text-purple-700 border-purple-300 hover:bg-purple-100"
            disabled={!hasSelection}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Toplu Hesapla
          </Button>
        )}

        {onBulkLock && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkLock}
            className="text-red-700 border-red-300 hover:bg-red-100"
            disabled={!hasSelection}
          >
            <Lock className="h-4 w-4 mr-1" />
            Kilitle
          </Button>
        )}

        {onBulkUnlock && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUnlock}
            className="text-green-700 border-green-300 hover:bg-green-100"
            disabled={!hasSelection}
          >
            <Unlock className="h-4 w-4 mr-1" />
            Kilidi Aç
          </Button>
        )}

        {onBulkDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDownload}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
            disabled={!hasSelection}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel İndir
          </Button>
        )}

        {onBulkEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkEmail}
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
            disabled={!hasSelection}
          >
            <Mail className="h-4 w-4 mr-1" />
            E-posta Gönder
          </Button>
        )}
        
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

export default TimePayrollBulkActions;
