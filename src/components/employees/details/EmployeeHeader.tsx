import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X, User, Building, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeHeaderProps {
  employee: Employee;
  id: string;
  onEdit: () => void;
  onUpdate?: (updatedEmployee: Employee) => void;
}

export const EmployeeHeader = ({ employee, id, onEdit, onUpdate }: EmployeeHeaderProps) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [statusValue, setStatusValue] = useState(employee.status);
  const [positionValue, setPositionValue] = useState(employee.position);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pasif':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateEmployeeField = async (field: string, value: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .update({ [field]: value })
        .eq("id", employee.id)
        .select()
        .single();

      if (error) throw error;
      
      if (onUpdate && data) {
        onUpdate(data);
      }

      toast({
        title: "Başarılı",
        description: "Güncelleme başarılı",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Güncelleme sırasında hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSave = async () => {
    await updateEmployeeField("status", statusValue);
    setIsEditingStatus(false);
  };

  const handlePositionSave = async () => {
    await updateEmployeeField("position", positionValue);
    setIsEditingPosition(false);
  };

  const getDisplayName = () => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  const getSubtitle = () => {
    return employee.position || 'Çalışan detayları';
  };

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
          <User className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {getDisplayName()}
          </h1>
          <p className="text-xs text-muted-foreground/70">
            {getSubtitle()}
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Durum */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
          {isEditingStatus ? (
            <div className="flex items-center gap-2">
              <Select value={statusValue} onValueChange={(value) => setStatusValue(value as typeof employee.status)}>
                <SelectTrigger className="w-24 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleStatusSave}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                {isLoading ? (
                  <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-2 w-2" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusValue(employee.status);
                  setIsEditingStatus(false);
                }}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingStatus(true)}
              className="flex items-center gap-1.5"
            >
              <span className="font-bold">Durum</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {employee.status}
              </span>
            </button>
          )}
        </div>

        {/* Pozisyon */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
          {isEditingPosition ? (
            <div className="flex items-center gap-2">
              <Select value={positionValue} onValueChange={(value) => setPositionValue(value)}>
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yazılım Geliştirici">Yazılım Geliştirici</SelectItem>
                  <SelectItem value="Proje Yöneticisi">Proje Yöneticisi</SelectItem>
                  <SelectItem value="Tasarımcı">Tasarımcı</SelectItem>
                  <SelectItem value="Satış Temsilcisi">Satış Temsilcisi</SelectItem>
                  <SelectItem value="Muhasebeci">Muhasebeci</SelectItem>
                  <SelectItem value="İnsan Kaynakları">İnsan Kaynakları</SelectItem>
                  <SelectItem value="Genel Müdür">Genel Müdür</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handlePositionSave}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                {isLoading ? (
                  <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-2 w-2" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPositionValue(employee.position);
                  setIsEditingPosition(false);
                }}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPosition(true)}
              className="flex items-center gap-1.5"
            >
              <span className="font-medium">Pozisyon</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {employee.position}
              </span>
            </button>
          )}
        </div>

      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          <span>Düzenle</span>
        </Button>
      </div>
    </div>
  );
};
