import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Warehouse, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  ClipboardList
} from "lucide-react";

interface InventoryTransactionsHeaderProps {
  onCreateTransaction?: (type: 'giris' | 'cikis' | 'transfer' | 'sayim') => void;
}

const InventoryTransactionsHeader = ({ onCreateTransaction }: InventoryTransactionsHeaderProps) => {
  const handleCreateTransaction = (type: 'giris' | 'cikis' | 'transfer' | 'sayim') => {
    if (onCreateTransaction) {
      onCreateTransaction(type);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Warehouse className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Stok Hareketleri
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Stok hareketlerini görüntüleyin ve inceleyin.
          </p>
        </div>
      </div>

      {/* Ana İşlem Butonları */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
          onClick={() => handleCreateTransaction('giris')}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Stok Girişi
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => handleCreateTransaction('cikis')}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Stok Çıkışı
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={() => handleCreateTransaction('transfer')}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Depo Transferi
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={() => handleCreateTransaction('sayim')}
        >
          <ClipboardList className="h-4 w-4" />
          Stok Sayımı
        </Button>
      </div>
    </div>
  );
};

export default InventoryTransactionsHeader;

