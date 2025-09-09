import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, Building, Settings } from "lucide-react";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const CompanySettingsTab = () => {
  const { company } = useCompanies();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleFieldChange = (field: keyof Company, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `logo-${timestamp}.${fileExtension}`;
      const filePath = `${company?.id}/${uniqueFileName}`;

      // First, try to delete any existing logo for this company
      if (formData?.logo_url) {
        try {
          const existingPath = formData.logo_url.split('/').slice(-2).join('/');
          await supabase.storage.from('logos').remove([existingPath]);
        } catch (deleteError) {
          console.log('No existing logo to delete or delete failed:', deleteError);
        }
      }

      // Upload the new logo
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          upsert: true
        });

      if (error) {
        console.error('Error uploading logo:', error);
        toast.error('Logo yüklenirken hata oluştu');
        return;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(data.path);

        handleFieldChange('logo_url', publicUrl);
        toast.success('Logo başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Error in logo upload process:', error);
      toast.error('Logo yüklenirken hata oluştu');
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id);

      if (error) throw error;
      
      setIsDirty(false);
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Şirket Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Şirket Bilgileri
          </CardTitle>
          <CardDescription>
            Şirketinizin temel bilgilerini ve iletişim detaylarını yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDirty && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                ⚠️ Kaydedilmemiş değişiklikleriniz var
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Değişiklikleri kaydetmek için aşağıdaki "Ayarları Kaydet" butonuna tıklayın.
              </p>
            </div>
          )}
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Şirket Adı *
                {formData?.name !== company?.name && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="name"
                placeholder="örn: NGS Teknoloji Ltd. Şti."
                value={formData?.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={formData?.name !== company?.name ? 'border-orange-300 bg-orange-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                Şirket Adresi
                {formData?.address !== company?.address && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Textarea
                id="address"
                placeholder="Tam şirket adresinizi giriniz"
                rows={3}
                value={formData?.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className={formData?.address !== company?.address ? 'border-orange-300 bg-orange-50' : ''}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  Telefon
                  {formData?.phone !== company?.phone && (
                    <span className="text-xs text-orange-500">●</span>
                  )}
                </Label>
                <Input
                  id="phone"
                  placeholder="+90 212 555 0123"
                  value={formData?.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={formData?.phone !== company?.phone ? 'border-orange-300 bg-orange-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  E-posta
                  {formData?.email !== company?.email && (
                    <span className="text-xs text-orange-500">●</span>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@sirket.com"
                  value={formData?.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={formData?.email !== company?.email ? 'border-orange-300 bg-orange-50' : ''}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax_number" className="flex items-center gap-1">
                  Vergi Numarası
                  {formData?.tax_number !== company?.tax_number && (
                    <span className="text-xs text-orange-500">●</span>
                  )}
                </Label>
                <Input
                  id="tax_number"
                  placeholder="1234567890"
                  value={formData?.tax_number || ''}
                  onChange={(e) => handleFieldChange('tax_number', e.target.value)}
                  className={formData?.tax_number !== company?.tax_number ? 'border-orange-300 bg-orange-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_office" className="flex items-center gap-1">
                  Vergi Dairesi
                  {formData?.tax_office !== company?.tax_office && (
                    <span className="text-xs text-orange-500">●</span>
                  )}
                </Label>
                <Input
                  id="tax_office"
                  placeholder="Beşiktaş Vergi Dairesi"
                  value={formData?.tax_office || ''}
                  onChange={(e) => handleFieldChange('tax_office', e.target.value)}
                  className={formData?.tax_office !== company?.tax_office ? 'border-orange-300 bg-orange-50' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1">
                Web Sitesi
                {formData?.website !== company?.website && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.sirket.com"
                value={formData?.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                className={formData?.website !== company?.website ? 'border-orange-300 bg-orange-50' : ''}
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Şirket Logosu</Label>
              <div className="flex items-center gap-4">
                {formData?.logo_url && (
                  <img 
                    src={formData.logo_url} 
                    alt="Company logo" 
                    className="h-16 w-16 object-contain border rounded p-2 bg-white"
                  />
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={handleLogoUpload}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData?.logo_url ? 'Logo Değiştir' : 'Logo Yükle'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG veya SVG • Maksimum 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistem Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistem Ayarları
          </CardTitle>
          <CardDescription>
            Genel sistem tercihleri ve bildirim ayarları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Varsayılan Para Birimi</Label>
              <Select
                value={formData?.default_currency || 'TRY'}
                onValueChange={(value) => handleFieldChange('default_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-posta Bildirimleri</Label>
                <div className="text-sm text-muted-foreground">
                  Sistem bildirimleri için e-posta gönderimi
                </div>
              </div>
              <Switch
                checked={formData?.email_settings?.notifications_enabled || false}
                onCheckedChange={(checked) =>
                  handleFieldChange('email_settings', { 
                    ...formData?.email_settings,
                    notifications_enabled: checked 
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kaydet Butonu */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`gap-2 ${isDirty ? 'bg-primary hover:bg-primary/90' : ''}`}
          size="lg"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Kaydediliyor...' : isDirty ? `Değişiklikleri Kaydet` : 'Ayarları Kaydet'}
        </Button>
        {!isDirty && (
          <p className="text-xs text-muted-foreground mt-2">
            Kaydetmek için önce bir değişiklik yapın
          </p>
        )}
      </div>
    </div>
  );
};