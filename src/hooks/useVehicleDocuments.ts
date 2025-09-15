import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleDocument, DocumentFormData } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export const useVehicleDocuments = (vehicleId?: string) => {
  return useQuery({
    queryKey: ['vehicle-documents', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_documents')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .order('created_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['vehicle-document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentData: DocumentFormData & { file_url: string }) => {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .insert([documentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents'] });
      toast({
        title: "Başarılı",
        description: "Belge başarıyla yüklendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Belge yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Document creation error:', error);
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...documentData }: Partial<VehicleDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .update(documentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-document', data.id] });
      toast({
        title: "Başarılı",
        description: "Belge bilgileri güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Belge güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Document update error:', error);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents'] });
      toast({
        title: "Başarılı",
        description: "Belge silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Belge silinirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Document deletion error:', error);
    },
  });
};

export const useExpiringDocuments = () => {
  return useQuery({
    queryKey: ['expiring-documents'],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('vehicle_documents')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .not('expiry_date', 'is', null)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
