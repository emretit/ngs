import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Factory, ClipboardCheck, Settings } from "lucide-react";
import { ProductionStats } from "@/types/production";

interface ProductionHeaderProps {
  stats?: ProductionStats;
  onCreateWorkOrder?: () => void;
  onCreateBOM?: () => void;
}

const ProductionHeader = ({ 
  stats,
  onCreateWorkOrder,
  onCreateBOM
}: ProductionHeaderProps) => {
  const navigate = useNavigate();

  const statsData = stats || {
    active_work_orders: 0,
    completed_this_month: 0,
    bom_count: 0,
    planned_this_week: 0,
  };

  const statCards = [
    { 
      label: 'Aktif İş Emirleri', 
      icon: Factory,
      value: statsData.active_work_orders,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      subtitle: `Planlanan: ${statsData.planned_this_week}`
    },
    { 
      label: 'Tamamlanan', 
      icon: ClipboardCheck,
      value: statsData.completed_this_month,
      color: 'bg-green-100 text-green-800 border-green-200',
      subtitle: 'Bu ay'
    },
    { 
      label: 'Ürün Reçeteleri', 
      icon: Settings,
      value: statsData.bom_count,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      subtitle: 'Aktif'
    },
    { 
      label: 'Planlanan Üretim', 
      icon: Factory,
      value: statsData.planned_this_week,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      subtitle: 'Bu hafta'
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Üretim Yönetimi
        </h1>
        <p className="text-xs text-muted-foreground/70">
          İş emirleri, ürün reçeteleri ve üretim planlaması
        </p>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {statCards.map(({ label, icon: Icon, value, color, subtitle }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
          >
            <Icon className="h-3 w-3" />
            <span className="font-medium">{label}</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateBOM || (() => navigate('/production/bom/new'))}
          className="text-xs"
        >
          <Settings className="h-3 w-3 mr-1" />
          Yeni Ürün Reçetesi
        </Button>
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateWorkOrder || (() => navigate('/production/work-orders/new', { replace: false }))}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni İş Emri</span>
        </Button>
      </div>
    </div>
  );
};

export default ProductionHeader;

