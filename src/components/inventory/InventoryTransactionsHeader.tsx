import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";
import { InventoryTransactionStats } from "@/types/inventory";

interface InventoryTransactionsHeaderProps {
  stats?: InventoryTransactionStats;
  transactions?: any[];
  onCreateTransaction?: (type: string) => void;
}

const InventoryTransactionsHeader = ({ 
  stats, 
  transactions = [], 
  onCreateTransaction 
}: InventoryTransactionsHeaderProps) => {
  const navigate = useNavigate();

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

  // İşlem tipi kartları
  const typeCards = [
    { 
      type: 'giris', 
      label: 'Giriş', 
      icon: ArrowDownToLine,
      color: 'bg-green-100 text-green-800 border-green-200',
      count: statsData.by_type.giris
    },
    { 
      type: 'cikis', 
      label: 'Çıkış', 
      icon: ArrowUpFromLine,
      color: 'bg-red-100 text-red-800 border-red-200',
      count: statsData.by_type.cikis
    },
    { 
      type: 'transfer', 
      label: 'Transfer', 
      icon: ArrowRightLeft,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      count: statsData.by_type.transfer
    },
    { 
      type: 'sayim', 
      label: 'Sayım', 
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      count: statsData.by_type.sayim
    }
  ];

  // Durum kartları
  const statusCards = [
    { status: 'pending', label: 'Bekleyen', color: 'bg-orange-100 text-orange-800 border-orange-200', count: statsData.pending },
    { status: 'approved', label: 'Onaylı', color: 'bg-blue-100 text-blue-800 border-blue-200', count: statsData.approved },
    { status: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800 border-green-200', count: statsData.completed },
    { status: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-800 border-red-200', count: statsData.cancelled }
  ];

  const handleCreateTransaction = (type: string) => {
    if (onCreateTransaction) {
      onCreateTransaction(type);
    } else {
      navigate(`/inventory/transactions/${type}/new`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Depo İşlemleri
        </h1>
        <p className="text-xs text-muted-foreground/70">
          Stok giriş, çıkış, transfer ve sayım işlemlerini yönetin.
        </p>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam işlem sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
        {/* İşlem tipi kartları */}
        {typeCards.map(({ type, icon: Icon, label, color, count }) => (
          <div
            key={type}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
          >
            <Icon className="h-3 w-3" />
            <span className="font-medium">{label}</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {count}
            </span>
          </div>
        ))}
        
        {/* Durum kartları (küçük ekranlarda gizli) */}
        <div className="hidden lg:flex flex-wrap gap-1.5">
          {statusCards.map(({ status, label, color, count }) => (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
            >
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateTransaction('giris')}
          className="text-xs"
        >
          <ArrowDownToLine className="h-3 w-3 mr-1" />
          Giriş
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateTransaction('cikis')}
          className="text-xs"
        >
          <ArrowUpFromLine className="h-3 w-3 mr-1" />
          Çıkış
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateTransaction('transfer')}
          className="text-xs"
        >
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          Transfer
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateTransaction('sayim')}
          className="text-xs"
        >
          <ClipboardList className="h-3 w-3 mr-1" />
          Sayım
        </Button>
      </div>
    </div>
  );
};

export default InventoryTransactionsHeader;

