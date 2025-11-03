import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { DeliveryStats } from "@/types/deliveries";

interface DeliveriesHeaderProps {
  stats?: DeliveryStats;
  deliveries?: any[];
  onCreateDelivery?: () => void;
}

const DeliveriesHeader = ({ stats, deliveries = [], onCreateDelivery }: DeliveriesHeaderProps) => {
  const navigate = useNavigate();

  // Toplam teslimat sayısı
  const totalCount = deliveries.length;

  // Durum kartları için veri
  const statusCards = [
    { status: 'pending', label: 'Bekleyen', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Package },
    { status: 'prepared', label: 'Hazırlanan', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
    { status: 'shipped', label: 'Kargoda', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
    { status: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800 border-green-200', icon: Package },
    { status: 'cancelled', label: 'İptal', color: 'bg-red-100 text-red-800 border-red-200', icon: Package }
  ];

  // Durum sayılarını hesapla
  const statusCounts = statusCards.reduce((acc, { status }) => {
    acc[status] = deliveries.filter(delivery => delivery.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
          <Package className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Teslimatlar
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm teslimatlarınızı yönetin ve takip edin.
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam teslimat sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, color }) => {
          const count = statusCounts[status] || 0;
          
          return (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateDelivery || (() => navigate('/deliveries/new', { replace: false }))}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Teslimat</span>
        </Button>
      </div>
    </div>
  );
};

export default DeliveriesHeader;
