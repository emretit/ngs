
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X, Building, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from "@/types/supplier";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { formatCurrency } from "@/utils/formatters";

interface ContactHeaderProps {
  supplier: Supplier;
  id: string;
  onEdit: () => void;
  onUpdate?: (updatedSupplier: Supplier) => void;
}

export const ContactHeader = ({ supplier, id, onEdit, onUpdate }: ContactHeaderProps) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [statusValue, setStatusValue] = useState(supplier.status);
  const [typeValue, setTypeValue] = useState(supplier.type);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pasif':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'potansiyel':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'kurumsal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bireysel':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateSupplierField = async (field: string, value: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .update({ [field]: value })
        .eq("id", supplier.id)
        .select()
        .single();

      if (error) throw error;
      
      if (onUpdate && data) {
        onUpdate(data);
      }

      toast.success("Güncelleme başarılı", { duration: 1000 });
    } catch (error) {
      toast.error("Güncelleme sırasında hata oluştu", { duration: 1000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSave = async () => {
    await updateSupplierField("status", statusValue);
    setIsEditingStatus(false);
  };

  const handleTypeSave = async () => {
    await updateSupplierField("type", typeValue);
    setIsEditingType(false);
  };

  const getDisplayName = () => {
    if (supplier.type === 'kurumsal' && supplier.company) {
      return supplier.company;
    }
    return supplier.name;
  };

  const getSubtitle = () => {
    if (supplier.type === 'kurumsal' && supplier.company && supplier.name) {
      return `Yetkili: ${supplier.name}`;
    }
    return null;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Link 
          to="/suppliers" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          {supplier.type === 'kurumsal' ? (
            <Building className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {getDisplayName()}
          </h1>
          <p className="text-xs text-muted-foreground/70">
            {getSubtitle() || 'Tedarikçi detayları'}
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Durum */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          {isEditingStatus ? (
            <div className="flex items-center gap-2">
              <Select value={statusValue} onValueChange={(value) => setStatusValue(value as typeof supplier.status)}>
                <SelectTrigger className="w-24 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="pasif">Pasif</SelectItem>
                  <SelectItem value="potansiyel">Potansiyel</SelectItem>
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
                  setStatusValue(supplier.status);
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
                {supplier.status}
              </span>
            </button>
          )}
        </div>

        {/* Tip */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
          {isEditingType ? (
            <div className="flex items-center gap-2">
              <Select value={typeValue} onValueChange={(value) => setTypeValue(value as typeof supplier.type)}>
                <SelectTrigger className="w-24 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bireysel">Bireysel</SelectItem>
                  <SelectItem value="kurumsal">Kurumsal</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleTypeSave}
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
                  setTypeValue(supplier.type);
                  setIsEditingType(false);
                }}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingType(true)}
              className="flex items-center gap-1.5"
            >
              <span className="font-medium">Tip</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {supplier.type}
              </span>
            </button>
          )}
        </div>

        {/* Bakiye */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Bakiye</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(supplier.balance)}
          </span>
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
