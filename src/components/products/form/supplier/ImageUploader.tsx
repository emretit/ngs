
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Check, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  form: UseFormReturn<ProductFormSchema>;
  compact?: boolean;
}

const ImageUploader = ({ form, compact = false }: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Sadece resim dosyaları yükleyebilirsiniz (JPEG, PNG, WebP, GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `products/${Date.now()}.${fileExt}`;
      
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          return next > 90 ? 90 : next;
        });
      }, 200);
      
      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file);
      
      clearInterval(interval);
      
      if (error) throw error;
      
      setUploadProgress(100);
      
      // Get the public URL
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
      if (data) {
        form.setValue('image_url', data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Dosya yüklenirken bir hata oluştu');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  return (
    <FormField
      control={form.control}
      name="image_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Ürün Görseli</FormLabel>
          <Card 
            className={`relative ${compact ? "h-40 p-3" : "h-64 p-6"} flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {field.value ? (
              <div className="relative w-full h-full">
                <img
                  src={field.value}
                  alt="Ürün görseli"
                  className={`w-full h-full object-contain rounded-md`}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-white"
                  onClick={() => form.setValue('image_url', null)}
                >
                  <X size={16} />
                </button>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-full max-w-xs bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Yükleniyor... {uploadProgress}%
                </p>
              </div>
            ) : (
              <>
                <Upload className={`${compact ? "h-7 w-7" : "h-10 w-10"} text-muted-foreground mb-2`} />
                <p className={`text-center text-muted-foreground mb-2 ${compact ? "text-xs" : "text-sm"}`}>
                  Resmi buraya sürükleyip bırakın veya dosya seçin
                </p>
                <label className={`inline-flex items-center justify-center rounded-md bg-primary ${compact ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"} font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer`}>
                  Dosya Seç
                  <Input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </>
            )}
          </Card>
          <FormDescription>
            Ürün için temsili bir görsel yükleyin (maks. 5MB)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ImageUploader;
