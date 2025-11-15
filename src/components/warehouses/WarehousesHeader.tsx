import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Warehouse } from "lucide-react";
import { Warehouse as WarehouseType, WarehouseStats } from "@/types/warehouse";
import WarehousesViewToggle from "./WarehousesViewToggle";

interface WarehousesHeaderProps {
  warehouses?: WarehouseType[];
  stats?: WarehouseStats;
  activeView: "grid" | "table";
  setActiveView: (view: "grid" | "table") => void;
  onCreateWarehouse?: () => void;
}

const WarehousesHeader = ({ 
  warehouses = [], 
  stats,
  activeView,
  setActiveView,
  onCreateWarehouse
}: WarehousesHeaderProps) => {
  // İstatistikler - stats varsa onu kullan, yoksa warehouses'tan hesapla (fallback)
  const statsData = stats || {
    total: warehouses.length,
    active: warehouses.filter(w => w.is_active).length,
    inactive: warehouses.filter(w => !w.is_active).length,
    by_type: {
      main: warehouses.filter(w => w.warehouse_type === 'main').length,
      sub: warehouses.filter(w => w.warehouse_type === 'sub').length,
      virtual: warehouses.filter(w => w.warehouse_type === 'virtual').length,
      transit: warehouses.filter(w => w.warehouse_type === 'transit').length,
    }
  };

  // Toplam depo sayısı - stats'ten al
  const totalCount = statsData.total;

  // Aktif/Pasif sayıları
  const activeCount = statsData.active;
  const inactiveCount = statsData.inactive;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Depolar
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Depo bilgilerini yönetin ve stok işlemlerini takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam depo sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
            <Warehouse className="h-3 w-3" />
            <span className="font-bold">Toplam Depo</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>

          {/* Aktif */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
            <span className="font-medium">Aktif</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {activeCount}
            </span>
          </div>

          {/* Pasif */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
            <span className="font-medium">Pasif</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {inactiveCount}
            </span>
          </div>

          {/* Ana Depo */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
            <span className="font-medium">Ana</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {statsData.by_type.main}
            </span>
          </div>

          {/* Alt Depo */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
            <span className="font-medium">Alt</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {statsData.by_type.sub}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <WarehousesViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={onCreateWarehouse}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Depo</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default WarehousesHeader;

