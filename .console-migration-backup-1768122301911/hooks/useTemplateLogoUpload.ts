import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useTemplateLogoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadTemplateLogo = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Sadece JPG, PNG, WebP ve SVG formatlarında dosya yükleyebilirsiniz",
      });
      return null;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Hata", 
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
      });
      return null;
    }

    try {
      setUploading(true);
      
      // Create unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `template-logos/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage logos bucket
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(data.path);

      toast({
        title: "Başarılı",
        description: "Logo başarıyla yüklendi",
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Template logo upload error:', error);
      toast({
        variant: "destructive",
        title: "Yükleme Hatası",
        description: error.message || "Logo yüklenirken bir hata oluştu",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplateLogo = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/storage/v1/object/public/logos/');
      if (urlParts.length < 2) {
        throw new Error('Geçersiz URL formatı');
      }
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Logo başarıyla silindi",
      });

      return true;
    } catch (error: any) {
      console.error('Template logo delete error:', error);
      toast({
        variant: "destructive",
        title: "Silme Hatası",
        description: error.message || "Logo silinirken bir hata oluştu",
      });
      return false;
    }
  };

  return {
    uploadTemplateLogo,
    deleteTemplateLogo,
    uploading,
  };
};