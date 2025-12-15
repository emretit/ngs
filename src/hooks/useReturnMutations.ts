import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Return, CreateReturnData, UpdateReturnData } from "@/types/returns";
import { toast } from "sonner";

// Fetch single return with items
export const useReturn = (id: string | undefined) => {
  return useQuery({
    queryKey: ["return", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("returns")
        .select(`
          *,
          customer:customers(id, name, company, email, mobile_phone, office_phone),
          order:orders(id, order_number, title),
          delivery:deliveries(id, delivery_number),
          employee:employees!returns_employee_id_fkey(id, first_name, last_name),
          reviewed_by_employee:employees!returns_reviewed_by_fkey(id, first_name, last_name),
          items:return_items(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Return;
    },
    enabled: !!id,
  });
};

// Update return
export const useUpdateReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReturnData }) => {
      const { error } = await supabase
        .from("returns")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["return", id] });
      toast.success("İade başarıyla güncellendi");
    },
    onError: (error: any) => {
      toast.error(error.message || "İade güncellenirken hata oluştu");
    },
  });
};

// Update return status
export const useUpdateReturnStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reviewedBy }: { id: string; status: string; reviewedBy?: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set review/completion dates based on status
      if (status === 'under_review' || status === 'approved' || status === 'rejected') {
        updateData.review_date = new Date().toISOString();
        if (reviewedBy) updateData.reviewed_by = reviewedBy;
      }
      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("returns")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["return", id] });
      toast.success("İade durumu güncellendi");
    },
    onError: (error: any) => {
      toast.error(error.message || "Durum güncellenirken hata oluştu");
    },
  });
};

// Delete return
export const useDeleteReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Items will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from("returns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("İade başarıyla silindi");
    },
    onError: (error: any) => {
      toast.error(error.message || "İade silinirken hata oluştu");
    },
  });
};
