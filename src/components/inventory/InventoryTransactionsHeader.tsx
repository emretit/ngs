import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList, Warehouse } from "lucide-react";
import { InventoryTransactionStats, InventoryTransaction } from "@/types/inventory";
import InventoryTransactionsViewToggle from "./InventoryTransactionsViewToggle";

interface InventoryTransactionsHeaderProps {
  stats?: InventoryTransactionStats;
  transactions?: InventoryTransaction[];
  activeView: "grid" | "table";
  setActiveView: (view: "grid" | "table") => void;
  onCreateTransaction?: (type: string) => void;
}

const InventoryTransactionsHeader = ({ 
  stats, 
  transactions = [], 
  activeView,
  setActiveView,
  onCreateTransaction 
}: InventoryTransactionsHeaderProps) => {
  // Toplam işlem sayısı
  const totalCount = transactions.length;

  // İstatistikler
  const statsData = stats || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    by_type: {
      giris: 0,
      cikis: 0,
      transfer: 0,
      sayim: 0,
    }
  };

  // Durum sayıları
  const pendingCount = statsData.pending;
  const approvedCount = statsData.approved;
  const completedCount = statsData.completed;
  const cancelledCount = statsData.cancelled;

  // İşlem tipi sayıları
  const girisCount = statsData.by_type.giris;
  const cikisCount = statsData.by_type.cikis;
  const transferCount = statsData.by_type.transfer;
  const sayimCount = statsData.by_type.sayim;

  const handleCreateTransaction = (type: string) => {
    if (onCreateTransaction) {
      onCreateTransaction(type);
    }
  };

  return (
    <>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Warehouse className="h-5 w-5" />
          </div>
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Depo İşlemleri
        </h1>
        <p className="text-xs text-muted-foreground/70">
          Stok giriş, çıkış, transfer ve sayım işlemlerini yönetin.
        </p>
          </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam işlem sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <Warehouse className="h-3 w-3" />
            <span className="font-bold">Toplam İşlem</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
          {/* Giriş */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
            <ArrowDownToLine className="h-3 w-3" />
            <span className="font-medium">Giriş</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {girisCount}
            </span>
          </div>

          {/* Çıkış */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <ArrowUpFromLine className="h-3 w-3" />
            <span className="font-medium">Çıkış</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {cikisCount}
            </span>
          </div>

          {/* Transfer */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
            <ArrowRightLeft className="h-3 w-3" />
            <span className="font-medium">Transfer</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {transferCount}
            </span>
          </div>

          {/* Sayım */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
            <ClipboardList className="h-3 w-3" />
            <span className="font-medium">Sayım</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {sayimCount}
            </span>
          </div>

          {/* Bekleyen */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300">
            <span className="font-medium">Bekleyen</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {pendingCount}
            </span>
          </div>
        
          {/* Tamamlandı */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
            <span className="font-medium">Tamamlandı</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {completedCount}
              </span>
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <InventoryTransactionsViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
        <Button
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={() => handleCreateTransaction('giris')}
        >
            <Plus className="h-4 w-4" />
            <span>Yeni İşlem</span>
        </Button>
      </div>
    </div>
    </>
  );
};

export default InventoryTransactionsHeader;

