import { Button } from "@/components/ui/button";
import { Plus, Wrench, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import ServiceViewToggle, { ViewType } from "../ServiceViewToggle";

interface ServicePageHeaderProps {
  onCreateService: () => void;
  services?: {
    pending?: any[];
    in_progress?: any[];
    completed?: any[];
    cancelled?: any[];
  };
  activeView?: ViewType;
  setActiveView?: (view: ViewType) => void;
}

const ServicePageHeader = ({ onCreateService, services = {}, activeView, setActiveView }: ServicePageHeaderProps) => {
  // Toplam servis sayısını hesapla
  const totalCount = Object.values(services).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  // Durum kartları
  const statusCards = [
    { status: 'pending', icon: AlertCircle, label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { status: 'in_progress', icon: Clock, label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { status: 'completed', icon: CheckCircle2, label: 'Tamamlandı', color: 'bg-green-100 text-green-800 border-green-200' },
    { status: 'cancelled', icon: XCircle, label: 'İptal Edildi', color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Servis Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm servis taleplerinizi yönetin ve takip edin.
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam servis sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, color }) => {
          const count = services[status as keyof typeof services]?.length || 0;
          
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
      
      {/* Sağ taraf - Tab Toggle ve Buton */}
      <div className="flex items-center gap-2">
        {activeView !== undefined && setActiveView && (
          <ServiceViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
        )}
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateService}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Servis Talebi</span>
        </Button>
      </div>
    </div>
  );
};

export default ServicePageHeader;
