
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Circle, Square, Star, Target, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import OpportunityForm from "./OpportunityForm";
import OpportunitiesViewToggle from "./OpportunitiesViewToggle";
import { OpportunityStatus, opportunityStatusLabels, opportunityStatusColors } from "@/types/crm";

type ViewType = "kanban" | "list";

interface OpportunitiesHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  opportunities?: { [key: string]: any[] };
}

const OpportunitiesHeader = ({ activeView, setActiveView, opportunities = {} }: OpportunitiesHeaderProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Toplam fırsat sayısını hesapla
  const totalCount = Object.values(opportunities).reduce((sum, opps) => sum + opps.length, 0);

  // Durum kartları için veri
  const statusCards = [
    { status: 'new' as OpportunityStatus, icon: Circle, label: 'Yeni' },
    { status: 'meeting_visit' as OpportunityStatus, icon: Square, label: 'Görüşme' },
    { status: 'proposal' as OpportunityStatus, icon: Star, label: 'Teklif' },
    { status: 'negotiation' as OpportunityStatus, icon: Target, label: 'Müzakere' },
    { status: 'won' as OpportunityStatus, icon: CheckCircle2, label: 'Kazanıldı' },
    { status: 'lost' as OpportunityStatus, icon: XCircle, label: 'Kaybedildi' }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Satış Fırsatları
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Tüm satış fırsatlarınızı yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - Durum Kartları ve Toplam */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam fırsat sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
          
          {/* Durum kartları */}
          {statusCards.map(({ status, icon: Icon, label }) => {
            const count = opportunities[status]?.length || 0;
            const colorClass = opportunityStatusColors[status] || 'bg-gray-100 text-gray-800';
            
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
          <OpportunitiesViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Fırsat</span>
          </Button>
        </div>
      </div>
      
      <OpportunityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
};

export default OpportunitiesHeader;
