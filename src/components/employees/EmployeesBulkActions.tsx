import React from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, Mail, UserX, Calculator, CreditCard } from "lucide-react";
import { Employee } from "@/types/employee";

interface EmployeesBulkActionsProps {
  selectedEmployees: Employee[];
  onClearSelection: () => void;
  onBulkPayroll?: () => void;
  onBulkPayment?: () => void;
}

const EmployeesBulkActions = ({ selectedEmployees, onClearSelection, onBulkPayroll, onBulkPayment }: EmployeesBulkActionsProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedEmployees.length} çalışan seçildi
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkPayroll}
          className="text-purple-700 border-purple-300 hover:bg-purple-100"
        >
          <Calculator className="h-4 w-4 mr-1" />
          Toplu Tahakkuk
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkPayment}
          className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
        >
          <CreditCard className="h-4 w-4 mr-1" />
          Toplu Ödeme
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          <Download className="h-4 w-4 mr-1" />
          Excel İndir
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          <Mail className="h-4 w-4 mr-1" />
          Toplu E-posta
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-orange-700 border-orange-300 hover:bg-orange-100"
        >
          <UserX className="h-4 w-4 mr-1" />
          Pasif Yap
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Sil
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4 mr-1" />
          Seçimi Temizle
        </Button>
      </div>
    </div>
  );
};

export default EmployeesBulkActions;
