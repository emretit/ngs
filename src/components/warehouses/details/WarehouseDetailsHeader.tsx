import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit, Warehouse as WarehouseIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Warehouse } from "@/types/warehouse";

interface WarehouseDetailsHeaderProps {
  warehouse: Warehouse;
  id: string;
  onEdit: () => void;
  onUpdate?: (updatedWarehouse: Warehouse) => void;
}

const WarehouseDetailsHeader = ({ warehouse, id, onEdit, onUpdate }: WarehouseDetailsHeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const duplicateWarehouseMutation = useMutation({
    mutationFn: async () => {
      if (!warehouse) return;
      
      const newWarehouse = {
        ...warehouse,
        name: `${warehouse.name} (Kopya)`,
        code: warehouse.code ? `${warehouse.code}-copy` : null,
      };
      
      delete (newWarehouse as any).id;
      delete (newWarehouse as any).created_at;
      delete (newWarehouse as any).updated_at;

      const { data, error } = await supabase
        .from("warehouses")
        .insert([newWarehouse])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newWarehouse) => {
      await queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Depo başarıyla kopyalandı");
      if (newWarehouse) {
        navigate(`/inventory/warehouses/${newWarehouse.id}`);
      }
    },
    onError: () => {
      toast.error("Depo kopyalanırken bir hata oluştu");
    },
  });

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'main':
        return 'Ana Depo';
      case 'sub':
        return 'Alt Depo';
      case 'virtual':
        return 'Sanal Depo';
      case 'transit':
        return 'Transfer Depo';
      default:
        return 'Depo';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sub':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'virtual':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'transit':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <Link 
          to="/inventory/warehouses" 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
          <WarehouseIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {warehouse.name}
          </h1>
          <p className="text-xs text-muted-foreground/70">
            {warehouse.code ? `Kod: ${warehouse.code}` : 'Kod yok'} • {getTypeLabel(warehouse.warehouse_type)}
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Durum */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border ${warehouse.is_active ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-sm' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          <span className="font-bold">Durum</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${warehouse.is_active ? 'bg-white/20' : 'bg-white/50'}`}>
            {warehouse.is_active ? "Aktif" : "Pasif"}
          </span>
        </div>

        {/* Depo Tipi */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(warehouse.warehouse_type)}`}>
          <span className="font-medium">Tip</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {getTypeLabel(warehouse.warehouse_type)}
          </span>
        </div>

        {/* Kapasite */}
        {warehouse.capacity && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
            <WarehouseIcon className="h-3 w-3" />
            <span className="font-medium">Kapasite</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {warehouse.capacity} {warehouse.capacity_unit || 'birim'}
            </span>
          </div>
        )}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
          <span>Düzenle</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => duplicateWarehouseMutation.mutate()}
          disabled={duplicateWarehouseMutation.isPending}
        >
          <Copy className="h-4 w-4 mr-2" />
          Kopyala
        </Button>
      </div>
    </div>
  );
};

export default WarehouseDetailsHeader;

