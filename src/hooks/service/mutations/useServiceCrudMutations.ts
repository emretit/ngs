


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ServiceRequestFormData } from "../types";
import { useServiceFileUpload } from "../useServiceFileUpload";
import { useServiceQueries } from "../useServiceQueries";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const useServiceCrudMutations = () => {
  const queryClient = useQueryClient();
  const { uploadFiles } = useServiceFileUpload();
  const { getServiceRequest } = useServiceQueries();
  const { userData } = useCurrentUser();

  // Generate service number
  const generateServiceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    const serviceCount = (count || 0) + 1;
    return `SR-${year}-${serviceCount.toString().padStart(4, '0')}`;
  };

  // Create service request
  const createServiceRequestMutation = useMutation({
    mutationFn: async ({ formData, files }: { formData: ServiceRequestFormData, files: File[] }) => {
      console.log('➕ createServiceRequestMutation başlatıldı:', {
        formData,
        filesCount: files.length
      });

      // Generate service number
      console.log('🔢 Servis numarası oluşturuluyor...');
      const serviceNumber = await generateServiceNumber();
      console.log('✅ Servis numarası oluşturuldu:', serviceNumber);
      
      // UUID validation function
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Tarih alanlarını güvenli şekilde işle
      const safeToISOString = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date; // Zaten string ise olduğu gibi bırak
        return null;
      };

      const serviceRequestData = {
        ...formData,
        service_number: serviceNumber,
        service_due_date: safeToISOString(formData.service_due_date),
        service_reported_date: safeToISOString(formData.service_reported_date),
        issue_date: safeToISOString(formData.issue_date), // Planlanan tarih
        assigned_technician: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          formData.assigned_technician !== 'bilinmeyen' &&
          isValidUUID(formData.assigned_technician) ? formData.assigned_technician : null,
        service_status: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          isValidUUID(formData.assigned_technician) ? 'assigned' as const : 'new' as const,
        attachments: [],
        company_id: userData?.company_id,
      };

      // Submit to Supabase
      console.log('💾 Supabase insert işlemi başlatılıyor:', serviceRequestData);
      const { data, error } = await supabase
        .from('service_requests')
        .insert(serviceRequestData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert hatası:', error);
        throw error;
      }
      
      console.log('✅ Supabase insert başarılı:', data);

      if (files.length > 0 && data) {
        const uploadedFiles = await uploadFiles(files, data.id);
        
        // After upload, update with the attachments array
        // Convert to a plain object structure that Supabase can handle
        const attachmentsForDb = uploadedFiles.map(file => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size
        }));
        
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ attachments: attachmentsForDb })
          .eq('id', data.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 createServiceRequestMutation başarılı:', data);
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("Service request created successfully");
    },
    onError: (error: any) => {
      console.error('💥 createServiceRequestMutation hatası:', error);
      console.error('Hata detayları:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error("Failed to create service request");
    },
  });

  // Update service request
  const updateServiceRequestMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updateData, 
      newFiles = [] 
    }: { 
      id: string; 
      updateData: Partial<ServiceRequestFormData>; 
      newFiles?: File[] 
    }) => {
      console.log('🔄 updateServiceRequestMutation başlatıldı:', {
        id,
        updateData,
        newFilesCount: newFiles.length
      });

      // Get current service request
      console.log('📋 Mevcut servis talebi getiriliyor...');
      const currentRequest = await getServiceRequest(id);
      if (!currentRequest) {
        console.error('❌ Servis talebi bulunamadı:', id);
        throw new Error("Service request not found");
      }
      console.log('✅ Mevcut servis talebi bulundu:', currentRequest);

      let updatedAttachments = [...(currentRequest.attachments || [])];

      // Upload new files if any
      if (newFiles.length > 0) {
        const uploadedFiles = await uploadFiles(newFiles, id);
        updatedAttachments = [...updatedAttachments, ...uploadedFiles];
      }

      // Convert attachments to a plain object structure Supabase can handle
      const attachmentsForDb = updatedAttachments.map(file => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size
      }));

      // UUID validation function
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Tarih alanlarını güvenli şekilde işle
      const safeToISOString = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date; // Zaten string ise olduğu gibi bırak
        return null;
      };

      const updatePayload = {
        ...updateData,
        service_due_date: safeToISOString(updateData.service_due_date) || currentRequest.service_due_date,
        service_reported_date: safeToISOString(updateData.service_reported_date) || currentRequest.service_reported_date,
        issue_date: safeToISOString(updateData.issue_date) || currentRequest.issue_date, // Planlanan tarih
        assigned_technician: updateData.assigned_technician && 
          updateData.assigned_technician !== 'unassigned' && 
          updateData.assigned_technician !== 'bilinmeyen' &&
          isValidUUID(updateData.assigned_technician) ? updateData.assigned_technician : 
          (updateData.assigned_technician === 'unassigned' || updateData.assigned_technician === 'bilinmeyen' ? null : currentRequest.assigned_technician),
        service_status: updateData.assigned_technician && 
          updateData.assigned_technician !== 'unassigned' && 
          updateData.assigned_technician !== 'bilinmeyen' &&
          isValidUUID(updateData.assigned_technician) ? 'assigned' as const : 
          (updateData.assigned_technician === 'unassigned' || updateData.assigned_technician === 'bilinmeyen' ? 'new' as const : currentRequest.service_status),
        attachments: attachmentsForDb
      };

      console.log('📦 Update payload hazırlandı:', updatePayload);

      console.log('💾 Supabase güncelleme işlemi başlatılıyor...');
      const { data, error } = await supabase
        .from('service_requests')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase güncelleme hatası:', error);
        throw error;
      }
      
      console.log('✅ Supabase güncelleme başarılı:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 updateServiceRequestMutation başarılı:', data);
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("Service request updated successfully");
    },
    onError: (error: any) => {
      console.error('💥 updateServiceRequestMutation hatası:', error);
      console.error('Hata detayları:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error("Failed to update service request");
    },
  });

  return {
    createServiceRequest: createServiceRequestMutation.mutate,
    isCreating: createServiceRequestMutation.isPending,
    updateServiceRequest: updateServiceRequestMutation.mutate,
    isUpdating: updateServiceRequestMutation.isPending,
  };
};
