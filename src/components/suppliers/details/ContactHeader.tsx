
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X, Building, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from "@/types/supplier";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/phoneFormatter";

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
  const { toast } = useToast();

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
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/suppliers" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Avatar/Icon */}
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {supplier.type === 'kurumsal' ? (
                <Building className="h-6 w-6 text-primary" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>

            {/* Name and details */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getDisplayName()}</h1>
              {getSubtitle() && (
                <p className="text-gray-600 mt-1">{getSubtitle()}</p>
              )}
              
              {/* Quick contact info */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {supplier.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.mobile_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{formatPhoneNumber(supplier.mobile_phone)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isEditingStatus ? (
              <div className="flex items-center gap-2">
                <Select value={statusValue} onValueChange={(value) => setStatusValue(value as typeof supplier.status)}>
                  <SelectTrigger className="w-32">
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
                  className="px-2"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
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
                  className="px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingStatus(true)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors hover:opacity-80 ${getStatusColor(supplier.status)}`}
              >
                {supplier.status}
              </button>
            )}
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2">
            {isEditingType ? (
              <div className="flex items-center gap-2">
                <Select value={typeValue} onValueChange={(value) => setTypeValue(value as typeof supplier.type)}>
                  <SelectTrigger className="w-32">
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
                  className="px-2"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
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
                  className="px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingType(true)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors hover:opacity-80 ${getTypeColor(supplier.type)}`}
              >
                {supplier.type}
              </button>
            )}
          </div>

          {/* Edit Button */}
          <Button onClick={onEdit} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>
    </div>
  );
};
