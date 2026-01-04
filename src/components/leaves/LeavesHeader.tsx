import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Clock, CheckCircle2, XCircle, Calendar as CalendarIcon, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeavesViewToggle from "./LeavesViewToggle";
import NewLeaveDialog from "./NewLeaveDialog";

type ViewType = "list" | "calendar";

interface LeavesHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  stats?: {
    todayOnLeave: number;
    pendingApprovals: number;
    upcoming7Days: number;
    thisMonthTotal: number;
  };
}

const LeavesHeader = ({ activeView, setActiveView, stats }: LeavesHeaderProps) => {
  const navigate = useNavigate();
  const [isNewLeaveDialogOpen, setIsNewLeaveDialogOpen] = useState(false);

  // Varsayılan stats
  const {
    todayOnLeave = 0,
    pendingApprovals = 0,
    upcoming7Days = 0,
    thisMonthTotal = 0,
  } = stats || {};

  // Durum kartları için veri
  const statusCards = [
    { key: 'today', icon: Users, label: 'Bugün İzinde', count: todayOnLeave, color: 'bg-blue-100 text-blue-800' },
    { key: 'pending', icon: Clock, label: 'Onay Bekliyor', count: pendingApprovals, color: 'bg-yellow-100 text-yellow-800' },
    { key: 'upcoming', icon: CalendarIcon, label: 'Yaklaşan (7 Gün)', count: upcoming7Days, color: 'bg-purple-100 text-purple-800' },
    { key: 'month', icon: FileText, label: 'Bu Ay Toplam', count: thisMonthTotal, color: 'bg-green-100 text-green-800' }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              İzinler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Şirket genelindeki izin taleplerini görüntüleyin ve yönetin.
            </p>
          </div>
        </div>
        
        {/* Orta - Durum Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {statusCards.map(({ key, icon: Icon, label, count, color }) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color} border-gray-200`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          ))}
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <LeavesViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button
            variant="outline"
            onClick={() => navigate("/employees/leaves/settings")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Ayarlar
          </Button>
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => setIsNewLeaveDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni İzin</span>
          </Button>
        </div>
      </div>
      
      {/* New Leave Dialog */}
      <NewLeaveDialog 
        isOpen={isNewLeaveDialogOpen} 
        onClose={() => setIsNewLeaveDialogOpen(false)} 
      />
    </>
  );
};

export default LeavesHeader;

