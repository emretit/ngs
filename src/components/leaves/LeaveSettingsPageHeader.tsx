import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Settings2, FileText, CheckCircle, ArrowLeft, Save } from "lucide-react";

interface LeaveSettingsPageHeaderProps {
  totalLeaveTypes: number;
  activeLeaveTypes: number;
  totalRules: number;
  hasActiveSettings: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

const LeaveSettingsPageHeader = ({
  totalLeaveTypes,
  activeLeaveTypes,
  totalRules,
  hasActiveSettings,
  onSave,
  isSaving
}: LeaveSettingsPageHeaderProps) => {
  const navigate = useNavigate();

  // Durum kartları
  const statusCards = [
    { 
      status: 'leave-types', 
      icon: Calendar, 
      label: 'İzin Türü', 
      count: totalLeaveTypes,
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      status: 'active-types', 
      icon: CheckCircle, 
      label: 'Aktif Tür', 
      count: activeLeaveTypes,
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    { 
      status: 'rules', 
      icon: FileText, 
      label: 'Kural', 
      count: totalRules,
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
    { 
      status: 'policies', 
      icon: Settings2, 
      label: 'Politika', 
      count: hasActiveSettings ? 1 : 0,
      color: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            İzin Ayarları
          </h1>
          <p className="text-xs text-muted-foreground/70">
            İzin politikalarını, kurallarını ve türlerini yönetin
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam izin türü sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalLeaveTypes}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, count, color }) => {
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
        {onSave && (
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-300" 
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Kaydediliyor..." : "Kaydet"}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default LeaveSettingsPageHeader;

