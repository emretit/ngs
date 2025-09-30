import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserCheck, UserX, UserCog, Briefcase, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmployeesViewToggle from "./header/EmployeesViewToggle";

type ViewType = "table";

interface EmployeesHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  employeeStats?: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    fullTime: number;
    partTime: number;
  };
}

const EmployeesHeader = ({ activeView, setActiveView, employeeStats }: EmployeesHeaderProps) => {
  const navigate = useNavigate();

  const statusCards = [
    { key: 'active', icon: UserCheck, label: 'Aktif', color: 'bg-green-100 text-green-800 border-green-200' },
    { key: 'inactive', icon: UserX, label: 'Pasif', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { key: 'onLeave', icon: Clock, label: 'İzinli', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { key: 'fullTime', icon: Briefcase, label: 'Tam Zamanlı', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { key: 'partTime', icon: UserCog, label: 'Yarı Zamanlı', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Çalışan Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm çalışanları görüntüle, yönet ve maaş bilgilerini takip et
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam çalışan sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {employeeStats?.total || 0}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ key, icon: Icon, label, color }) => {
          const count = employeeStats?.[key as keyof typeof employeeStats] || 0;
          
          return (
            <div
              key={key}
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
        <EmployeesViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300" 
          onClick={() => navigate("/add-employee")}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Çalışan</span>
        </Button>
      </div>
    </div>
  );
};

export default EmployeesHeader;
