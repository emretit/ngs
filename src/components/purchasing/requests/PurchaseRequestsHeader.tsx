import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PurchaseRequestsHeaderProps {
  requests?: { [key: string]: any[] };
}

const PurchaseRequestsHeader = ({ requests = {} }: PurchaseRequestsHeaderProps) => {
  const navigate = useNavigate();

  // Toplam talep sayısını hesapla
  const totalCount = Object.values(requests).reduce((sum, reqs) => sum + reqs.length, 0);

  // Durum kartları için veri
  const statusCards = [
    { status: 'draft', icon: FileText, label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
    { status: 'submitted', icon: Clock, label: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'approved', icon: CheckCircle2, label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
    { status: 'rejected', icon: XCircle, label: 'Reddedildi', color: 'bg-red-100 text-red-800' },
    { status: 'converted', icon: RefreshCcw, label: 'Dönüştürüldü', color: 'bg-blue-100 text-blue-800' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Satın Alma Talepleri
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Satın alma taleplerini oluşturun ve yönetin.
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam talep sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, color }) => {
          const count = requests[status]?.length || 0;
          
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
      
      {/* Sağ taraf - Yeni Talep Butonu */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={() => navigate("/purchase-requests/new")}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Talep</span>
        </Button>
      </div>
    </div>
  );
};

export default React.memo(PurchaseRequestsHeader);

