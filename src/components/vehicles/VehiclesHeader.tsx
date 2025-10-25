import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Car, Circle, CheckCircle2, XCircle, AlertTriangle, Wrench, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VehiclesViewToggle from "./header/VehiclesViewToggle";

type ViewType = "list" | "grid";

interface VehiclesHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  stats?: {
    total: number;
    aktif: number;
    bakım: number;
    pasif: number;
    satıldı: number;
  };
}

const VehiclesHeader = ({ activeView, setActiveView, stats }: VehiclesHeaderProps) => {
  const navigate = useNavigate();

  // Durum kartları için veri
  const statusCards = [
    { status: 'aktif', icon: CheckCircle2, label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { status: 'bakım', icon: Wrench, label: 'Bakımda', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'pasif', icon: XCircle, label: 'Pasif', color: 'bg-red-100 text-red-800' },
    { status: 'satıldı', icon: DollarSign, label: 'Satıldı', color: 'bg-gray-100 text-gray-800' },
    { status: 'hasar', icon: AlertTriangle, label: 'Hasarlı', color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Car className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Araç Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Şirket araçlarınızı yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - Durum Kartları ve Toplam */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam araç sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {stats?.total || 0}
            </span>
          </div>
          
          {/* Durum kartları */}
          {statusCards.map(({ status, icon: Icon, label, color }) => {
            const count = stats?.[status as keyof typeof stats] || 0;
            
            return (
              <div
                key={status}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color} border-gray-200`}
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
          <VehiclesViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate("/vehicles/create")}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Araç</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default VehiclesHeader;
