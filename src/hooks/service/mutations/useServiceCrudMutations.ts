


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
      // Generate service number
      const serviceNumber = await generateServiceNumber();
      
      // UUID validation function
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const serviceRequestData = {
        ...formData,
        service_number: serviceNumber,
        service_due_date: formData.service_due_date?.toISOString(),
        service_reported_date: formData.service_reported_date?.toISOString(),
        issue_date: formData.issue_date?.toISOString(), // Planlanan tarih
        assigned_technician: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          isValidUUID(formData.assigned_technician) ? formData.assigned_technician : null,
        service_status: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          isValidUUID(formData.assigned_technician) ? 'assigned' as const : 'new' as const,
        attachments: [],
        company_id: userData?.company_id,
      };

      // Submit to Supabase
      const { data, error } = await supabase
        .from('service_requests')
        .insert(serviceRequestData)
        .select()
        .single();

      if (error) throw error;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("Service request created successfully");
    },
    onError: (error) => {
      console.error('Service request creation error:', error);
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
      // Get current service request
      const currentRequest = await getServiceRequest(id);
      if (!currentRequest) {
        throw new Error("Service request not found");
      }

      let updatedAttachments = [...(Array.isArray(currentRequest.attachments) ? currentRequest.attachments : [])];

      // Upload new files if any
      if (newFiles.length > 0) {
        const uploadedFiles = await uploadFiles(newFiles, id);
        updatedAttachments = [...updatedAttachments, ...uploadedFiles as any];
      }

      // Convert attachments to a plain object structure Supabase can handle
      const attachmentsForDb = updatedAttachments.map(file => {
        if (typeof file === 'object' && file !== null && 'name' in file) {
          return {
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size
          };
        }
        return file; // Keep as is if not the expected structure
      });

      // UUID validation function
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const updatePayload = {
        ...updateData,
        service_due_date: updateData.service_due_date ? updateData.service_due_date.toISOString() : currentRequest.service_due_date,
        service_reported_date: updateData.service_reported_date ? updateData.service_reported_date.toISOString() : currentRequest.service_reported_date,
        issue_date: updateData.issue_date ? updateData.issue_date.toISOString() : currentRequest.issue_date, // Planlanan tarih
        assigned_technician: updateData.assigned_technician && 
          updateData.assigned_technician !== 'unassigned' && 
          isValidUUID(updateData.assigned_technician) ? updateData.assigned_technician : currentRequest.assigned_technician,
        service_status: updateData.assigned_technician && 
          updateData.assigned_technician !== 'unassigned' && 
          isValidUUID(updateData.assigned_technician) ? 'assigned' as const : currentRequest.service_status,
        attachments: attachmentsForDb
      };

      const { data, error } = await supabase
        .from('service_requests')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("Service request updated successfully");
    },
    onError: (error) => {
      console.error('Service request update error:', error);
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
