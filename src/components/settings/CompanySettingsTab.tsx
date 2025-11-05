import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { CompanyInfoCard } from "./CompanyInfoCard";

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
      <CompanyInfoCard 
        company={company}
        formData={formData}
        onFieldChange={handleFieldChange}
        isDirty={isDirty}
      />

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