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
import { useQueryClient } from "@tanstack/react-query";
import { CompanyInfoCard } from "./CompanyInfoCard";

export const CompanySettingsTab = () => {
  const { company } = useCompanies();
  const queryClient = useQueryClient();
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
      // Define allowed updatable fields based on Supabase companies table schema
      // Only include fields that actually exist in the database
      const allowedFields = [
        'name',
        'address',
        'phone',
        'email',
        'tax_number',
        'tax_office',
        'logo_url',
        'default_currency',
        'email_settings',
        'domain',
        'website',
        'is_active',
        // Address details
        'city',
        'district',
        'country',
        'postal_code',
        // Business information
        'trade_registry_number',
        'mersis_number',
        'einvoice_alias_name',
        'sector',
        'establishment_date',
        // Bank information
        'bank_name',
        'iban',
        'account_number',
      ];
      
      // Build update object with only allowed fields
      const updateData: any = {};
      
      allowedFields.forEach(field => {
        if (field in formData) {
          const value = formData[field as keyof Company];
          // Only include if value is not undefined
          if (value !== undefined) {
            updateData[field] = value;
          }
        }
      });
      
      // Ensure email_settings is properly formatted as JSON object
      if (updateData.email_settings && typeof updateData.email_settings === 'object') {
        updateData.email_settings = updateData.email_settings;
      }
      
      // Remove empty string values that might cause issues (keep null values)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });
      
      const { error, data } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select()
        .single();

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }
      
      // Update local formData with the returned data immediately
      if (data) {
        setFormData(data as Company);
      }
      
      // Invalidate and refetch companies query to update the cache
      // This will trigger useCompanies hook to refetch and update the UI
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      // Also update the cache directly with the returned data for immediate UI update
      if (data) {
        queryClient.setQueryData(['companies'], data);
      }
      
      setIsDirty(false);
      toast.success('Ayarlar başarıyla kaydedildi', {
        duration: 1000, // 1 saniye
      });
    } catch (error: any) {
      console.error('Error saving company settings:', error);
      const errorMessage = error?.message || error?.details || 'Ayarlar kaydedilirken hata oluştu';
      toast.error(`Hata: ${errorMessage}`);
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