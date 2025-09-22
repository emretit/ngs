import React from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, FileText, Mail } from "lucide-react";
import { Customer } from "@/types/customer";

interface CustomersBulkActionsProps {
  selectedCustomers: Customer[];
  onClearSelection: () => void;
}

const CustomersBulkActions = ({ selectedCustomers, onClearSelection }: CustomersBulkActionsProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedCustomers.length} müşteri seçildi
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
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

export default CustomersBulkActions;
