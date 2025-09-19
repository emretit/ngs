import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Circle, Clock, CheckCircle2, XCircle, AlertTriangle, FileText, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalsViewToggle from "./header/ProposalsViewToggle";
import { ProposalStatus } from "@/types/proposal";

type ViewType = "kanban" | "list";

interface ProposalsHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  proposals?: { [key: string]: any[] };
}

const ProposalsHeader = ({ activeView, setActiveView, proposals = {} }: ProposalsHeaderProps) => {
  const navigate = useNavigate();

  // Toplam teklif sayısını hesapla
  const totalCount = Object.values(proposals).reduce((sum, props) => sum + props.length, 0);

  // Durum kartları için veri
  const statusCards = [
    { status: 'draft' as ProposalStatus, icon: FileText, label: 'Taslak' },
    { status: 'pending_approval' as ProposalStatus, icon: Clock, label: 'Onay Bekliyor' },
    { status: 'sent' as ProposalStatus, icon: Circle, label: 'Gönderildi' },
    { status: 'accepted' as ProposalStatus, icon: CheckCircle2, label: 'Kabul Edildi' },
    { status: 'rejected' as ProposalStatus, icon: XCircle, label: 'Reddedildi' },
    { status: 'expired' as ProposalStatus, icon: AlertTriangle, label: 'Süresi Dolmuş' }
  ];

  // Durum renklerini tanımla
  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <FileCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Teklifler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Müşterilerinize gönderdiğiniz teklifleri yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - Durum Kartları ve Toplam */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam teklif sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
          
          {/* Durum kartları */}
          {statusCards.map(({ status, icon: Icon, label }) => {
            const count = proposals[status]?.length || 0;
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
          <ProposalsViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate("/proposal/create")}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Teklif</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProposalsHeader;
