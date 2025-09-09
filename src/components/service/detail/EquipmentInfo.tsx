
import React from "react";
import { Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Equipment {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  installation_date?: string;
  status?: string;
}

interface EquipmentInfoProps {
  equipmentId?: string;
}

export const EquipmentInfo: React.FC<EquipmentInfoProps> = ({ equipmentId }) => {
  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async (): Promise<Equipment | null> => {
      if (!equipmentId) return null;
      
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("id", equipmentId)
        .single();
      
      if (error) {
        console.error("Error fetching equipment:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!equipmentId,
  });

  if (!equipmentId) return null;
  
  return (
    <div className="bg-muted/40 p-4 rounded-lg">
      <div className="flex items-center">
        <Wrench className="h-5 w-5 mr-2 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Ekipman</h3>
      </div>
      
      {isLoading ? (
        <p className="text-muted-foreground mt-1">Ekipman bilgileri yükleniyor...</p>
      ) : equipment ? (
        <div className="mt-2 space-y-1">
          <p className="font-medium">{equipment.name}</p>
          {equipment.model && <p className="text-muted-foreground text-sm">Model: {equipment.model}</p>}
          {equipment.serial_number && <p className="text-muted-foreground text-sm">Seri No: {equipment.serial_number}</p>}
          {equipment.status && <p className="text-muted-foreground text-sm">Durum: {equipment.status}</p>}
        </div>
      ) : (
        <p className="text-muted-foreground mt-1">Ekipman ID: {equipmentId}</p>
      )}
    </div>
  );
};
