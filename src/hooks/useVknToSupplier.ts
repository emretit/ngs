import { useState } from "react";
import { logger } from '@/utils/logger';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface VknSupplierData {
  taxNumber: string;
  companyName: string;
  aliasName?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
  district?: string;
  mersisNo?: string;
  sicilNo?: string;
  email?: string;
  phone?: string;
}

export const useVknToSupplier = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSupplierFromVkn = async (vknData: VknSupplierData) => {
    setIsCreating(true);
    
    try {
      const { data: newSupplier, error } = await supabase
        .from("suppliers")
        .insert({
          name: vknData.companyName,
          company: vknData.companyName,
          tax_number: vknData.taxNumber,
          tax_office: vknData.taxOffice || null,
          address: vknData.address || null,
          city: vknData.city || null,
          district: vknData.district || null,
          email: vknData.email || null,
          mobile_phone: vknData.phone || null,
          einvoice_alias_name: vknData.aliasName || null,
          mersis_number: vknData.mersisNo || null,
          trade_registry_number: vknData.sicilNo || null,
          type: "kurumsal",
          status: "potansiyel",
          balance: 0,
          is_active: true,
          aliases: [],
        })
        .select()
        .single();

      if (error) throw error;

      // Suppliers listesini yenile
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      
      toast({
        title: "Başarılı",
        description: "Tedarikçi VKN bilgilerinden oluşturuldu",
      });

      return newSupplier;
    } catch (error) {
      logger.error("Error creating supplier from VKN:", error);
      toast({
        title: "Hata",
        description: "Tedarikçi oluşturulurken bir hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createSupplierFromVkn,
    isCreating,
  };
};
