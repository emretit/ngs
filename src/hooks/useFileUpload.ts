import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, folder: string = ""): Promise<string | null> => {
    if (!file) return null;

    try {
      setUploading(true);
      
      // Auth disabled - no user check needed

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `dummy-user/${folder ? folder + '/' : ''}${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('cashflow-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cashflow-attachments')
        .getPublicUrl(data.path);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message,
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      const { error } = await supabase.storage
        .from('cashflow-attachments')
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Error",
        description: error.message,
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
  };
};