import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Building, FileText, Receipt, Calendar } from "lucide-react";
import { Company } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressFields from "@/components/shared/AddressFields";
import { DatePicker } from "@/components/ui/date-picker";

interface CompanyInfoCardProps {
  company: Company | null;
  formData: Partial<Company>;
  onFieldChange: (field: keyof Company, value: any) => void;
  isDirty: boolean;
}

export const CompanyInfoCard = ({ company, formData, onFieldChange, isDirty }: CompanyInfoCardProps) => {
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

        onFieldChange('logo_url', publicUrl);
        toast.success('Logo başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Error in logo upload process:', error);
      toast.error('Logo yüklenirken hata oluştu');
    }
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          Şirket Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
        {isDirty && (
          <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-800 font-medium">
              ⚠️ Kaydedilmemiş değişiklikleriniz var
            </p>
          </div>
        )}
        
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-gray-700 flex items-center gap-1">
              Şirket Adı *
              {formData?.name !== company?.name && (
                <span className="text-xs text-orange-500">●</span>
              )}
            </Label>
            <Input
              id="name"
              placeholder="örn: NGS Teknoloji Ltd. Şti."
              value={formData?.name || ''}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className={`h-7 text-xs ${formData?.name !== company?.name ? 'border-orange-300 bg-orange-50' : ''}`}
            />
          </div>

          {/* İletişim Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Telefon
                {formData?.phone !== company?.phone && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="phone"
                placeholder="+90 212 555 0123"
                value={formData?.phone || ''}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                className={`h-7 text-xs ${formData?.phone !== company?.phone ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700 flex items-center gap-1">
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
                onChange={(e) => onFieldChange('email', e.target.value)}
                className={`h-7 text-xs ${formData?.email !== company?.email ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-medium text-gray-700 flex items-center gap-1">
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
                onChange={(e) => onFieldChange('website', e.target.value)}
                className={`h-7 text-xs ${formData?.website !== company?.website ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Sektör/Faaliyet Alanı
                {formData?.sector !== company?.sector && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="sector"
                placeholder="Teknoloji, İnşaat..."
                value={formData?.sector || ''}
                onChange={(e) => onFieldChange('sector', e.target.value)}
                className={`h-7 text-xs ${formData?.sector !== company?.sector ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
          </div>

          {/* Adres Bilgileri */}
          <div className="pt-2 border-t border-gray-100">
            <AddressFields
              city={formData?.city || ''}
              district={formData?.district || ''}
              address={formData?.address || ''}
              country={formData?.country || 'Turkey'}
              postal_code={formData?.postal_code || ''}
              onCityChange={(value) => onFieldChange('city', value)}
              onDistrictChange={(value) => onFieldChange('district', value)}
              onAddressChange={(value) => onFieldChange('address', value)}
              onCountryChange={(value) => onFieldChange('country', value)}
              onPostalCodeChange={(value) => onFieldChange('postal_code', value)}
            />
          </div>

          {/* Vergi ve Ticari Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div className="space-y-1.5">
              <Label htmlFor="tax_number" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Vergi Numarası
                {formData?.tax_number !== company?.tax_number && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="tax_number"
                placeholder="1234567890"
                value={formData?.tax_number || ''}
                onChange={(e) => onFieldChange('tax_number', e.target.value)}
                className={`h-7 text-xs ${formData?.tax_number !== company?.tax_number ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax_office" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Vergi Dairesi
                {formData?.tax_office !== company?.tax_office && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="tax_office"
                placeholder="Beşiktaş Vergi Dairesi"
                value={formData?.tax_office || ''}
                onChange={(e) => onFieldChange('tax_office', e.target.value)}
                className={`h-7 text-xs ${formData?.tax_office !== company?.tax_office ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trade_registry_number" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Ticaret Sicil No
                {formData?.trade_registry_number !== company?.trade_registry_number && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="trade_registry_number"
                placeholder="123456"
                value={formData?.trade_registry_number || ''}
                onChange={(e) => onFieldChange('trade_registry_number', e.target.value)}
                className={`h-7 text-xs ${formData?.trade_registry_number !== company?.trade_registry_number ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mersis_number" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                MERSİS No
                {formData?.mersis_number !== company?.mersis_number && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="mersis_number"
                placeholder="0123456789012345"
                value={formData?.mersis_number || ''}
                onChange={(e) => onFieldChange('mersis_number', e.target.value)}
                className={`h-7 text-xs ${formData?.mersis_number !== company?.mersis_number ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
          </div>

          {/* E-Fatura Alias */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <Label htmlFor="einvoice_alias_name" className="text-xs font-medium text-gray-700 flex items-center gap-1">
              E-Fatura Alias
              {formData?.einvoice_alias_name !== company?.einvoice_alias_name && (
                <span className="text-xs text-orange-500">●</span>
              )}
            </Label>
            <Input
              id="einvoice_alias_name"
              placeholder="urn:mail:defaultpk-cgbilgi-4-6-2-c-2@mersel.io"
              value={formData?.einvoice_alias_name || ''}
              onChange={(e) => onFieldChange('einvoice_alias_name', e.target.value)}
              className={`h-7 text-xs font-mono ${formData?.einvoice_alias_name !== company?.einvoice_alias_name ? 'border-orange-300 bg-orange-50' : ''}`}
            />
            <p className="text-xs text-muted-foreground">
              E-Fatura entegrasyonu için alias bilgisi
            </p>
          </div>

          {/* Banka Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Banka Adı
                {formData?.bank_name !== company?.bank_name && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="bank_name"
                placeholder="Türkiye İş Bankası"
                value={formData?.bank_name || ''}
                onChange={(e) => onFieldChange('bank_name', e.target.value)}
                className={`h-7 text-xs ${formData?.bank_name !== company?.bank_name ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iban" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                IBAN
                {formData?.iban !== company?.iban && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="iban"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={formData?.iban || ''}
                onChange={(e) => onFieldChange('iban', e.target.value)}
                className={`h-7 text-xs ${formData?.iban !== company?.iban ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_number" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Hesap No
                {formData?.account_number !== company?.account_number && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <Input
                id="account_number"
                placeholder="1234567890"
                value={formData?.account_number || ''}
                onChange={(e) => onFieldChange('account_number', e.target.value)}
                className={`h-7 text-xs ${formData?.account_number !== company?.account_number ? 'border-orange-300 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment_date" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                Kuruluş Tarihi
                {formData?.establishment_date !== company?.establishment_date && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </Label>
              <DatePicker
                date={formData?.establishment_date ? new Date(formData.establishment_date + 'T00:00:00') : undefined}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    onFieldChange('establishment_date', `${year}-${month}-${day}`);
                  } else {
                    onFieldChange('establishment_date', '');
                  }
                }}
                placeholder="Kuruluş tarihi seçiniz"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <Label className="text-xs font-medium text-gray-700">Şirket Logosu</Label>
            <div className="flex items-center gap-3">
              {formData?.logo_url && (
                <img 
                  src={formData.logo_url} 
                  alt="Company logo" 
                  className="h-12 w-12 object-contain border rounded p-1.5 bg-white"
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
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="h-7 text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {formData?.logo_url ? 'Değiştir' : 'Yükle'}
                </Button>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG veya SVG • Maks. 2MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

