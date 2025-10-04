import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Circle, Clock, CheckCircle2, XCircle, AlertTriangle, Wrench, AlertCircle } from "lucide-react";
import ServiceViewToggle from "./ServiceViewToggle";

type ViewType = "calendar" | "list";

interface ServicePageHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onCreateRequest: () => void;
  serviceRequests?: { [key: string]: any[] };
}

const ServicePageHeader = ({ 
  activeView, 
  setActiveView, 
  onCreateRequest,
  serviceRequests = {}
}: ServicePageHeaderProps) => {
  // Toplam servis talebi sayısını hesapla
  const totalCount = Object.values(serviceRequests).reduce((sum, props) => sum + props.length, 0);

  // Durum kartları için veri - Supabase service_status enum değerleri
  const statusCards = [
    { status: 'new', icon: AlertCircle, label: 'Yeni' },
    { status: 'assigned', icon: Circle, label: 'Atanmış' },
    { status: 'in_progress', icon: Clock, label: 'Devam Ediyor' },
    { status: 'on_hold', icon: AlertTriangle, label: 'Beklemede' },
    { status: 'completed', icon: CheckCircle2, label: 'Tamamlandı' },
    { status: 'cancelled', icon: XCircle, label: 'İptal' }
  ];

  // Durum renklerini tanımla
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
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
              Teknisyenlerinizi yönetin ve servis taleplerini takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - Durum Kartları ve Toplam */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam servis talebi sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
          
          {/* Durum kartları */}
          {statusCards.map(({ status, icon: Icon, label }) => {
            const count = serviceRequests[status]?.length || 0;
            const colorClass = getStatusColor(status);
            
            return (
              <div
                key={status}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${colorClass} border-gray-200`}
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
          <ServiceViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={onCreateRequest}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Servis Talebi</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ServicePageHeader;
