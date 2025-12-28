import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Building2, UserPlus, Plus, ArrowLeft } from "lucide-react";

interface OrganizationPageHeaderProps {
  totalDepartments: number;
  totalEmployees: number;
  activeEmployees: number;
  departmentHeads: number;
  onCreateDepartment?: () => void;
}

const OrganizationPageHeader = ({
  totalDepartments,
  totalEmployees,
  activeEmployees,
  departmentHeads,
  onCreateDepartment
}: OrganizationPageHeaderProps) => {
  // Durum kartları
  const statusCards = [
    { 
      status: 'departments', 
      icon: Building2, 
      label: 'Departman', 
      count: totalDepartments,
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      status: 'employees', 
      icon: Users, 
      label: 'Çalışan', 
      count: totalEmployees,
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    { 
      status: 'active', 
      icon: UserPlus, 
      label: 'Aktif', 
      count: activeEmployees,
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
    { 
      status: 'heads', 
      icon: Users, 
      label: 'Departman Şefi', 
      count: departmentHeads,
      color: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Link 
          to="/employees" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Organizasyon Şeması
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Şirket hiyerarşisini görselleştirin ve yönetin
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam çalışan sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalEmployees}
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
        {onCreateDepartment && (
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-300" 
            onClick={onCreateDepartment}
          >
            <Plus className="h-4 w-4" />
            <span>Departman Ekle</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrganizationPageHeader;

