import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

interface InventoryCountsHeaderProps {
  onCreateCount?: () => void;
}

const InventoryCountsHeader = ({ onCreateCount }: InventoryCountsHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Stok Sayımları
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Stok sayımlarını görüntüleyin ve yönetin.
          </p>
        </div>
      </div>

      {/* Ana İşlem Butonu */}
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        onClick={onCreateCount}
      >
        <Plus className="h-4 w-4" />
        Yeni Stok Sayımı
      </Button>
    </div>
  );
};

export default InventoryCountsHeader;

