import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogoUploadFieldProps {
  logoUrl?: string;
  onLogoChange: (url: string | null) => void;
  logoPosition?: 'left' | 'center' | 'right';
  onPositionChange?: (position: 'left' | 'center' | 'right') => void;
  logoSize?: number;
  onSizeChange?: (size: number) => void;
  showLogo?: boolean;
  onShowLogoChange?: (show: boolean) => void;
}

export const LogoUploadField: React.FC<LogoUploadFieldProps> = ({ 
  logoUrl, 
  onLogoChange,
  logoPosition = 'left',
  onPositionChange,
  logoSize = 100,
  onSizeChange,
  showLogo = true,
  onShowLogoChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl || null);

  // Update previewUrl when logoUrl prop changes
  React.useEffect(() => {
    setPreviewUrl(logoUrl || null);
  }, [logoUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Logo yüklemek için giriş yapmanız gerekiyor');
        return;
      }

      // Create unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `template-logos/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        if (error.message.includes('JWT')) {
          toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        } else {
          toast.error(`Logo yüklenirken hata: ${error.message}`);
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onLogoChange(publicUrl);
      toast.success('Logo başarıyla yüklendi');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Logo yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onLogoChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Logo Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded">
            <Image className="h-3 w-3 text-blue-700" />
          </div>
          <Label className="text-sm font-semibold text-gray-800">Logo</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-logo"
            checked={showLogo}
            onCheckedChange={onShowLogoChange}
            className="scale-75"
          />
          <Label htmlFor="show-logo" className="text-xs text-gray-600">Göster</Label>
        </div>
      </div>

      {/* Logo Controls - Only show when enabled */}
      {showLogo && (
        <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-3 space-y-3">
          {/* Upload Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={previewUrl ? "secondary" : "default"}
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={isUploading}
                className="h-8 px-3 text-sm"
              >
                <Upload className="h-3 w-3 mr-1" />
                {isUploading ? 'Yükleniyor...' : previewUrl ? 'Değiştir' : 'Logo Seç'}
              </Button>
              
              {previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="h-8 px-2 text-gray-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {previewUrl && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">Aktif</span>
              </div>
            )}
          </div>

          {/* Position & Size Controls - Simplified */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Pozisyon</span>
              <Select value={logoPosition} onValueChange={onPositionChange}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sol</SelectItem>
                  <SelectItem value="center">Orta</SelectItem>
                  <SelectItem value="right">Sağ</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="text-xs text-gray-600">Boyut</span>
              <Input
                type="number"
                value={logoSize}
                onChange={(e) => onSizeChange?.(Number(e.target.value))}
                className="h-8 w-16 text-center text-xs"
                min="20"
                max="200"
                placeholder="80"
              />
            </div>
          </div>
        </div>
      )}
      
      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};