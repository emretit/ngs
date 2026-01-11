import React, { useState, useEffect } from "react";
import { Building } from "lucide-react";
import { CompanyInfoCard } from "@/components/settings/CompanyInfoCard";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface CompanyInfoSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const CompanyInfoSettings = ({ isCollapsed, setIsCollapsed }: CompanyInfoSettingsProps) => {
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
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      // Also update the cache directly with the returned data for immediate UI update
      if (data) {
        queryClient.setQueryData(['companies'], data);
      }
      
      setIsDirty(false);
      toast.success('Şirket bilgileri başarıyla kaydedildi', {
        duration: 1000,
      });
    } catch (error: any) {
      console.error('Error saving company info:', error);
      const errorMessage = error?.message || error?.details || 'Şirket bilgileri kaydedilirken hata oluştu';
      toast.error(`Hata: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Building className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Şirket Bilgileri
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Şirket bilgilerinizi düzenleyin ve güncelleyin
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <CompanyInfoCard 
        company={company}
        formData={formData}
        onFieldChange={handleFieldChange}
        isDirty={isDirty}
      />

      {/* Kaydet Butonu */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`gap-2 ${isDirty ? 'bg-primary hover:bg-primary/90' : ''}`}
          size="lg"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Kaydediliyor...' : isDirty ? `Değişiklikleri Kaydet` : 'Kaydet'}
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

export default CompanyInfoSettings;
