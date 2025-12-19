
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X, Building, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer } from "@/types/customer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";

interface ContactHeaderProps {
  customer: Customer;
  id: string;
  onEdit: () => void;
  onUpdate?: (updatedCustomer: Customer) => void;
}

export const ContactHeader = ({ customer, id, onEdit, onUpdate }: ContactHeaderProps) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [statusValue, setStatusValue] = useState(customer.status);
  const [typeValue, setTypeValue] = useState(customer.type);
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

  const updateCustomerField = async (field: string, value: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .update({ [field]: value })
        .eq("id", customer.id)
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
    await updateCustomerField("status", statusValue);
    setIsEditingStatus(false);
  };

  const handleTypeSave = async () => {
    await updateCustomerField("type", typeValue);
    setIsEditingType(false);
  };

  const getDisplayName = () => {
    // Kurumsal müşteri ise şirket adını göster
    if (customer.type === 'kurumsal' && customer.company) {
      return customer.company;
    }
    // Bireysel müşteri ise kişi adını göster
    return customer.name || customer.company || 'Müşteri';
  };

  const getSubtitle = () => {
    // Kurumsal müşteri ise hem şirket hem yetkili kişi göster
    if (customer.type === 'kurumsal') {
      if (customer.company && customer.name) {
        return `Yetkili: ${customer.name}`;
      }
      if (customer.name) {
        return `Yetkili: ${customer.name}`;
      }
    }
    // Bireysel müşteri için varsa şirket bilgisi göster
    if (customer.type === 'bireysel' && customer.company) {
      return customer.company;
    }
    return null;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Link 
          to="/customers" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
          {customer.type === 'kurumsal' ? (
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
            {getSubtitle() || 'Müşteri detayları'}
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Durum */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
          {isEditingStatus ? (
            <div className="flex items-center gap-2">
              <Select value={statusValue} onValueChange={(value) => setStatusValue(value as typeof customer.status)}>
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
                  setStatusValue(customer.status);
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
                {customer.status}
              </span>
            </button>
          )}
        </div>

        {/* Tip */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
          {isEditingType ? (
            <div className="flex items-center gap-2">
              <Select value={typeValue} onValueChange={(value) => setTypeValue(value as typeof customer.type)}>
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
                  setTypeValue(customer.type);
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
                {customer.type}
              </span>
            </button>
          )}
        </div>

        {/* Bakiye */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Bakiye</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(customer.balance)}
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
