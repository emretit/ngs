import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ServiceRequestFormData } from "../types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useServiceQueries } from "../useServiceQueries";
import { toast } from "@/hooks/use-toast";

export const useServiceCrudMutations = () => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const { getServiceRequest } = useServiceQueries();

  // Create service request mutation
  const createServiceRequestMutation = useMutation({
    mutationFn: async ({ formData, files }: { formData: ServiceRequestFormData; files: File[] }) => {
      console.log("Creating service request with data:", formData);
      
      if (!userData?.company_id) {
        throw new Error("Company ID is required");
      }

      // Generate a unique service number
      const serviceNumber = `SRV-${Date.now()}`;

      // Helper function to validate UUID
      const isValidUUID = (str: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const serviceRequestData = {
        ...formData,
        service_number: serviceNumber,
        service_due_date: formData.service_due_date ? 
          (typeof formData.service_due_date === 'string' ? formData.service_due_date : null) : null,
        service_reported_date: formData.service_reported_date ? 
          (typeof formData.service_reported_date === 'string' ? formData.service_reported_date : null) : null,
        issue_date: formData.issue_date ? 
          (typeof formData.issue_date === 'string' ? formData.issue_date : null) : null,
        assigned_technician: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          isValidUUID(formData.assigned_technician) ? formData.assigned_technician : null,
        service_status: formData.assigned_technician && 
          formData.assigned_technician !== 'unassigned' && 
          isValidUUID(formData.assigned_technician) ? 'assigned' as const : 'new' as const,
        attachments: [],
        company_id: userData.company_id,
      };

      console.log("Submitting service request data:", serviceRequestData);

      const { data, error } = await supabase
        .from('service_requests')
        .insert([serviceRequestData])
        .select()
        .single();

      if (error) {
        console.error("Error creating service request:", error);
        throw error;
      }

      console.log("Service request created successfully:", data);

      // Upload files if any
      if (files && files.length > 0) {
        const attachments = [];
        
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${data.id}_${Date.now()}.${fileExt}`;
          const filePath = `service-requests/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            continue;
          }

          attachments.push({
            name: file.name,
            path: filePath,
            type: file.type,
            size: file.size
          });
        }

        // Update the service request with attachments
        if (attachments.length > 0) {
          const { error: updateError } = await supabase
            .from('service_requests')
            .update({ attachments })
            .eq('id', data.id);

          if (updateError) {
            console.error("Error updating attachments:", updateError);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast({
        title: "Başarılı",
        description: "Servis talebi başarıyla oluşturuldu.",
      });
    },
    onError: (error) => {
      console.error("Create service request error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Servis talebi oluşturulurken bir hata oluştu.",
      });
    },
  });

  // Update service request mutation
  const updateServiceRequestMutation = useMutation({
    mutationFn: async ({ id, updateData, newFiles }: { id: string; updateData: Partial<ServiceRequestFormData>; newFiles?: File[] }) => {
      console.log("Updating service request:", id, updateData);
      
      if (!userData?.company_id) {
        throw new Error("Company ID is required");
      }

      // Fetch current request data to preserve existing values
      const currentRequest = await getServiceRequest(id);
      if (!currentRequest) {
        throw new Error("Service request not found");
      }

      // Helper function to validate UUID
      const isValidUUID = (str: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      let attachmentsForDb = Array.isArray(currentRequest.attachments) ? currentRequest.attachments : [];

      // Upload new files if any
      if (newFiles && newFiles.length > 0) {
        const newAttachments = [];
        
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${id}_${Date.now()}.${fileExt}`;
          const filePath = `service-requests/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            continue;
          }

          newAttachments.push({
            name: file.name,
            path: filePath,
            type: file.type,
            size: file.size
          });
        }

        attachmentsForDb = [...attachmentsForDb, ...newAttachments];
      }

      const newAssignedTechnician = updateData.assigned_technician && 
        updateData.assigned_technician !== 'unassigned' && 
        isValidUUID(updateData.assigned_technician) ? updateData.assigned_technician : currentRequest.assigned_technician;
      
      const isTechnicianChanged = newAssignedTechnician && 
        newAssignedTechnician !== currentRequest.assigned_technician;

      const updatePayload = {
        ...updateData,
        service_due_date: updateData.service_due_date ? 
          (typeof updateData.service_due_date === 'string' ? updateData.service_due_date : currentRequest.service_due_date) : 
          currentRequest.service_due_date,
        service_reported_date: updateData.service_reported_date ? 
          (typeof updateData.service_reported_date === 'string' ? updateData.service_reported_date : currentRequest.service_reported_date) : 
          currentRequest.service_reported_date,
        issue_date: updateData.issue_date ? 
          (typeof updateData.issue_date === 'string' ? updateData.issue_date : currentRequest.issue_date) : 
          currentRequest.issue_date,
        assigned_technician: newAssignedTechnician,
        service_status: updateData.assigned_technician && 
          updateData.assigned_technician !== 'unassigned' && 
          isValidUUID(updateData.assigned_technician) ? 'assigned' as const : currentRequest.service_status,
        attachments: attachmentsForDb
      };

      console.log("Update payload:", updatePayload);

      const { data, error } = await supabase
        .from('service_requests')
        .update(updatePayload)
        .eq('id', id)
        .eq('company_id', userData.company_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating service request:", error);
        throw error;
      }

      console.log("Service request updated successfully:", data);

      // Eğer teknisyen değiştiyse ve yeni bir teknisyen atandıysa push notification gönder
      if (isTechnicianChanged && newAssignedTechnician) {
        try {
          // Teknisyenin user_id'sini bul
          const { data: technician, error: techError } = await supabase
            .from('employees')
            .select('user_id, first_name, last_name')
            .eq('id', newAssignedTechnician)
            .single();

          if (!techError && technician?.user_id) {
            const notificationTitle = 'Yeni Servis Ataması';
            const notificationBody = `${currentRequest.service_title || 'Servis talebi'} size atandı.`;
            
            // Database'e bildirim kaydı ekle
            await supabase
              .from('notifications')
              .insert({
                user_id: technician.user_id,
                title: notificationTitle,
                body: notificationBody,
                type: 'service_assignment',
                service_request_id: id,
                technician_id: newAssignedTechnician,
                company_id: userData.company_id,
                is_read: false,
              });

            // Push notification gönder (mobil uygulamaya)
            try {
              const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: technician.user_id,
                  title: notificationTitle,
                  body: notificationBody,
                  data: {
                    type: 'service_assignment',
                    service_request_id: id,
                    action: 'open_service_request',
                  }
                }
              });

              if (pushError) {
                console.error('Push notification gönderme hatası:', pushError);
              } else {
                console.log('Push notification başarıyla gönderildi:', pushData);
              }
            } catch (pushErr) {
              console.error('Push notification çağrı hatası:', pushErr);
              // Push notification hatası kritik değil, devam et
            }
          }
        } catch (notifErr) {
          console.error('Bildirim gönderme hatası:', notifErr);
          // Bildirim hatası kritik değil, devam et
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast({
        title: "Başarılı",
        description: "Servis talebi başarıyla güncellendi.",
      });
    },
    onError: (error) => {
      console.error("Update service request error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Servis talebi güncellenirken bir hata oluştu.",
      });
    },
  });

  return {
    createServiceRequest: createServiceRequestMutation.mutate,
    isCreating: createServiceRequestMutation.isPending,
    updateServiceRequest: updateServiceRequestMutation.mutate,
    isUpdating: updateServiceRequestMutation.isPending,
  };
};