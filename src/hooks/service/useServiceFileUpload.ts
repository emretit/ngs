
import { supabase } from "@/integrations/supabase/client";
import { ServiceRequestAttachment } from "./types";

export const useServiceFileUpload = () => {
  // Dosya yükleme fonksiyonu
  const uploadFiles = async (files: File[], serviceRequestId: string): Promise<ServiceRequestAttachment[]> => {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${serviceRequestId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('service-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Dosya yükleme hatası:', error);
          return null;
        }

        return {
          name: file.name,
          path: fileName,
          type: file.type,
          size: file.size,
        };
      })
    );

    return uploadedFiles.filter(Boolean) as ServiceRequestAttachment[];
  };

  return {
    uploadFiles
  };
};
