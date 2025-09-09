import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, AlertCircle, MapPin, Building, User, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalAddressTabProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  validationErrors: Record<string, string[]>;
  onNext: () => void;
}

const ProposalAddressTab: React.FC<ProposalAddressTabProps> = ({
  formData,
  onFieldChange,
  validationErrors,
  onNext
}) => {
  const handleBillingAddressChange = (field: string, value: string) => {
    onFieldChange("billing_address", {
      ...formData.billing_address,
      [field]: value
    });
    
    // If "same as billing" is checked, update shipping address too
    if (formData.shipping_address?.same_as_billing) {
      onFieldChange("shipping_address", {
        ...formData.shipping_address,
        [field]: value
      });
    }
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    onFieldChange("shipping_address", {
      ...formData.shipping_address,
      [field]: value
    });
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    if (checked) {
      // Copy billing address to shipping address
      onFieldChange("shipping_address", {
        ...formData.billing_address,
        same_as_billing: true
      });
    } else {
      onFieldChange("shipping_address", {
        ...formData.shipping_address,
        same_as_billing: false
      });
    }
  };

  const copyBillingToShipping = () => {
    onFieldChange("shipping_address", {
      ...formData.billing_address,
      same_as_billing: false
    });
  };

  const isValid = !!(
    formData.billing_address?.company && 
    formData.billing_address?.address &&
    formData.billing_address?.contact_person
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Adres Bilgileri
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Faturalandırma ve teslimat adres bilgilerini girin
          </p>
        </div>
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Sonraki: Teklif Kalemleri
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation Alert */}
      {(validationErrors.billing_company || validationErrors.billing_address) && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lütfen fatura adresi bilgilerini tamamlayın
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Fatura Adresi
              <span className="text-red-500 text-sm">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="billing_company">
                Firma Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billing_company"
                value={formData.billing_address?.company || ""}
                onChange={(e) => handleBillingAddressChange("company", e.target.value)}
                className={cn(
                  validationErrors.billing_company && "border-destructive"
                )}
                placeholder="Şirket adı"
              />
              {validationErrors.billing_company && (
                <p className="text-destructive text-sm">{validationErrors.billing_company[0]}</p>
              )}
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="billing_contact_person">
                İletişim Kişisi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billing_contact_person"
                value={formData.billing_address?.contact_person || ""}
                onChange={(e) => handleBillingAddressChange("contact_person", e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="billing_address">
                Adres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billing_address"
                value={formData.billing_address?.address || ""}
                onChange={(e) => handleBillingAddressChange("address", e.target.value)}
                className={cn(
                  validationErrors.billing_address && "border-destructive"
                )}
                placeholder="Sokak, mahalle, bina no"
              />
              {validationErrors.billing_address && (
                <p className="text-destructive text-sm">{validationErrors.billing_address[0]}</p>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_city">Şehir</Label>
                <Input
                  id="billing_city"
                  value={formData.billing_address?.city || ""}
                  onChange={(e) => handleBillingAddressChange("city", e.target.value)}
                  placeholder="İstanbul"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_postal_code">Posta Kodu</Label>
                <Input
                  id="billing_postal_code"
                  value={formData.billing_address?.postal_code || ""}
                  onChange={(e) => handleBillingAddressChange("postal_code", e.target.value)}
                  placeholder="34000"
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="billing_country">Ülke</Label>
              <Input
                id="billing_country"
                value={formData.billing_address?.country || "Türkiye"}
                onChange={(e) => handleBillingAddressChange("country", e.target.value)}
              />
            </div>

            {/* Tax Information */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">Vergi Bilgileri</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_tax_number">Vergi Numarası</Label>
                  <Input
                    id="billing_tax_number"
                    value={formData.billing_address?.tax_number || ""}
                    onChange={(e) => handleBillingAddressChange("tax_number", e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_tax_office">Vergi Dairesi</Label>
                  <Input
                    id="billing_tax_office"
                    value={formData.billing_address?.tax_office || ""}
                    onChange={(e) => handleBillingAddressChange("tax_office", e.target.value)}
                    placeholder="Kadıköy Vergi Dairesi"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Teslimat Adresi
              </div>
              {!formData.shipping_address?.same_as_billing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBillingToShipping}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Fatura Adresini Kopyala
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Same as Billing Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="same_as_billing"
                checked={formData.shipping_address?.same_as_billing || false}
                onCheckedChange={handleSameAsBillingChange}
              />
              <Label htmlFor="same_as_billing" className="text-sm font-medium">
                Fatura adresi ile aynı
              </Label>
            </div>

            {/* Shipping Address Fields - Only show if not same as billing */}
            {!formData.shipping_address?.same_as_billing && (
              <>
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="shipping_company">Firma Adı</Label>
                  <Input
                    id="shipping_company"
                    value={formData.shipping_address?.company || ""}
                    onChange={(e) => handleShippingAddressChange("company", e.target.value)}
                    placeholder="Şirket adı"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="shipping_contact_person">İletişim Kişisi</Label>
                  <Input
                    id="shipping_contact_person"
                    value={formData.shipping_address?.contact_person || ""}
                    onChange={(e) => handleShippingAddressChange("contact_person", e.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Adres</Label>
                  <Input
                    id="shipping_address"
                    value={formData.shipping_address?.address || ""}
                    onChange={(e) => handleShippingAddressChange("address", e.target.value)}
                    placeholder="Sokak, mahalle, bina no"
                  />
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_city">Şehir</Label>
                    <Input
                      id="shipping_city"
                      value={formData.shipping_address?.city || ""}
                      onChange={(e) => handleShippingAddressChange("city", e.target.value)}
                      placeholder="İstanbul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_postal_code">Posta Kodu</Label>
                    <Input
                      id="shipping_postal_code"
                      value={formData.shipping_address?.postal_code || ""}
                      onChange={(e) => handleShippingAddressChange("postal_code", e.target.value)}
                      placeholder="34000"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="shipping_country">Ülke</Label>
                  <Input
                    id="shipping_country"
                    value={formData.shipping_address?.country || "Türkiye"}
                    onChange={(e) => handleShippingAddressChange("country", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Display billing address when same as billing is checked */}
            {formData.shipping_address?.same_as_billing && (
              <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Fatura adresi kullanılacak
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{formData.billing_address?.company}</p>
                  <p>{formData.billing_address?.contact_person}</p>
                  <p>{formData.billing_address?.address}</p>
                  <p>{formData.billing_address?.city} {formData.billing_address?.postal_code}</p>
                  <p>{formData.billing_address?.country}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalAddressTab; 