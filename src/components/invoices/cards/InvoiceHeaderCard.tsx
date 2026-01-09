import React, { useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, FileText, CheckCircle2, CheckCircle2 as CheckIcon, ChevronDown, ChevronUp, Settings2, Globe, RotateCcw } from "lucide-react";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { cn } from "@/lib/utils";

interface InvoiceHeaderCardProps {
  // Customer fields
  selectedCustomer: any;
  
  // Invoice fields
  formData: {
    fatura_no?: string;
    fatura_tarihi: Date;
    issue_time: string;
    vade_tarihi: Date | null;
    invoice_type: string;
    invoice_profile: string;
    send_type: string;
    sales_platform: string;
    is_despatch: boolean;
    internet_info: any;
    return_invoice_info: any;
    aciklama: string;
    notlar: string;
    para_birimi: string;
    exchange_rate: number;
    banka_bilgileri: string;
  };
  assignedInvoiceNumber?: string | null;
  einvoiceStatus?: any;
  onFieldChange: (field: string, value: any) => void;
  form?: UseFormReturn<any>;
  compact?: boolean; // Kompakt mod için
}

const InvoiceHeaderCard: React.FC<InvoiceHeaderCardProps> = ({
  selectedCustomer,
  formData,
  assignedInvoiceNumber,
  einvoiceStatus,
  onFieldChange,
  form,
  compact = true,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // E-fatura ayarları değiştirilmiş mi kontrol et
  const hasAdvancedChanges = 
    formData.invoice_type !== "SATIS" ||
    formData.invoice_profile !== "TEMELFATURA" ||
    formData.send_type !== "ELEKTRONIK" ||
    formData.sales_platform !== "NORMAL" ||
    formData.is_despatch === true;

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl relative z-10">
      <CardHeader className="pb-2 pt-2.5 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          Fatura Bilgileri
          {hasAdvancedChanges && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Özel Ayarlar
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Ana Bilgiler - 4 kolonlu yapı */}
        <div className="grid grid-cols-4 gap-3">
          {/* Müşteri Seçimi */}
          <div className="col-span-2">
            {form ? (
              <FormProvider {...form}>
                <ProposalPartnerSelect 
                  partnerType="customer" 
                  required 
                  hideLabel={false}
                />
              </FormProvider>
            ) : (
              <div>
                <Label className="text-xs">Müşteri *</Label>
                <div className="text-sm text-gray-500">Müşteri seçilmedi</div>
              </div>
            )}
            
            {selectedCustomer && (
              <div className="flex items-center gap-2 mt-1">
                {selectedCustomer.is_einvoice_mukellef ? (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 py-0">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    E-Fatura
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200 py-0">
                    E-Arşiv
                  </Badge>
                )}
                {selectedCustomer.tax_number && (
                  <span className="text-[10px] text-gray-400">VKN: {selectedCustomer.tax_number}</span>
                )}
              </div>
            )}
          </div>

          {/* Fatura Numarası */}
          <div className="col-span-2">
            <Label className="text-xs">Fatura No</Label>
            {(assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id) ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id}
                </span>
                <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700 border-green-200 py-0">
                  Sistem Atandı
                </Badge>
              </div>
            ) : (
              <Input
                value={formData.fatura_no || ""}
                onChange={(e) => onFieldChange("fatura_no", e.target.value)}
                placeholder="Fatura numarası (opsiyonel)"
                className="h-9"
              />
            )}
          </div>

          {/* Fatura Tarihi */}
          <div>
            <Label className="text-xs">Fatura Tarihi *</Label>
            <DatePicker
              date={formData.fatura_tarihi}
              onSelect={(date) => date && onFieldChange("fatura_tarihi", date)}
              className="h-9"
            />
          </div>

          {/* Fatura Saati */}
          <div>
            <Label className="text-xs">Saat</Label>
            <TimePicker
              time={formData.issue_time}
              onSelect={(time) => onFieldChange("issue_time", time)}
              placeholder="HH:mm"
              className="h-9"
            />
          </div>

          {/* Vade Tarihi */}
          <div>
            <Label className="text-xs">Vade Tarihi</Label>
            <DatePicker
              date={formData.vade_tarihi}
              onSelect={(date) => onFieldChange("vade_tarihi", date)}
              className="h-9"
            />
          </div>

          {/* Para Birimi */}
          <div>
            <Label className="text-xs">Para Birimi</Label>
            <Select
              value={formData.para_birimi}
              onValueChange={(value) => {
                onFieldChange("para_birimi", value);
                if (value === "TRY") {
                  onFieldChange("exchange_rate", 1);
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Döviz Kuru - Sadece TRY değilse */}
        {formData.para_birimi !== "TRY" && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
            <Label className="text-xs text-amber-700 whitespace-nowrap">Döviz Kuru:</Label>
            <Input
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.exchange_rate || 1}
              onChange={(e) => onFieldChange("exchange_rate", parseFloat(e.target.value) || 1)}
              className="h-7 w-24 text-sm"
            />
            <span className="text-xs text-amber-600">
              1 {formData.para_birimi} = {formData.exchange_rate || 1} TRY
            </span>
          </div>
        )}

        {/* Gelişmiş E-Fatura Ayarları - Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-between h-8 text-xs font-normal",
                hasAdvancedChanges ? "text-amber-700 bg-amber-50 hover:bg-amber-100" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                <span>E-Fatura Ayarları</span>
                {hasAdvancedChanges && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1 bg-amber-100 border-amber-200">
                    Değiştirildi
                  </Badge>
                )}
              </div>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <Label className="text-xs">Fatura Tipi</Label>
                <Select
                  value={formData.invoice_type}
                  onValueChange={(value) => onFieldChange("invoice_type", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SATIS">Satış</SelectItem>
                    <SelectItem value="IADE">İade</SelectItem>
                    <SelectItem value="ISTISNA">İstisna</SelectItem>
                    <SelectItem value="OZELMATRAH">Özel Matrah</SelectItem>
                    <SelectItem value="IHRACKAYITLI">İhraç Kayıtlı</SelectItem>
                    <SelectItem value="IHRACAT">İhracat</SelectItem>
                    <SelectItem value="SGK">SGK</SelectItem>
                    <SelectItem value="TEVKIFAT">Tevkifat</SelectItem>
                    <SelectItem value="TEVKIFAT_IADE">Tevkifat İade</SelectItem>
                    <SelectItem value="KONAKLAMA">Konaklama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Fatura Profili</Label>
                <Select
                  value={formData.invoice_profile}
                  onValueChange={(value) => onFieldChange("invoice_profile", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEMELFATURA">Temel Fatura</SelectItem>
                    <SelectItem value="TICARIFATURA">Ticari Fatura</SelectItem>
                    <SelectItem value="YOLCUBERABERFATURA">Yolcu Beraber Fatura</SelectItem>
                    <SelectItem value="EARSIVFATURA">E-Arşiv Fatura</SelectItem>
                    <SelectItem value="EARSIVIRSLIYE">E-Arşiv İrsaliye</SelectItem>
                    <SelectItem value="IHRACAT">İhracat</SelectItem>
                    <SelectItem value="KAMU">Kamu</SelectItem>
                    <SelectItem value="HKS">HKS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Gönderim Tipi</Label>
                <Select
                  value={formData.send_type}
                  onValueChange={(value) => onFieldChange("send_type", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELEKTRONIK">Elektronik</SelectItem>
                    <SelectItem value="KAGIT">Kağıt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Satış Platformu</Label>
                <Select
                  value={formData.sales_platform}
                  onValueChange={(value) => onFieldChange("sales_platform", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="INTERNET">İnternet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 flex items-center gap-2 pt-1">
                <Checkbox
                  id="is_despatch"
                  checked={formData.is_despatch || false}
                  onCheckedChange={(checked) => onFieldChange("is_despatch", checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_despatch" className="text-xs font-normal cursor-pointer">
                  İrsaliye Yerine Geçer
                </Label>
              </div>
            </div>

            {/* İnternet Satış Bilgileri - E-Arşiv için Geliştirilmiş */}
            {formData.sales_platform === "INTERNET" && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium">
                  <Globe className="h-3.5 w-3.5" />
                  İnternet Satış Bilgileri {formData.invoice_profile === "EARSIVFATURA" && "(E-Arşiv)"}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px]">Web Sitesi URL</Label>
                    <Input
                      value={formData.internet_info?.website || ""}
                      onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, website: e.target.value })}
                      placeholder="www.ornek.com"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Ödeme Şekli</Label>
                    <select
                      value={formData.internet_info?.payment_method || ""}
                      onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, payment_method: e.target.value })}
                      className="h-7 text-xs w-full border rounded-md px-2"
                    >
                      <option value="">Seçiniz</option>
                      <option value="KREDIKARTI">Kredi Kartı</option>
                      <option value="EFT">EFT/Havale</option>
                      <option value="KAPIODEME">Kapıda Ödeme</option>
                      <option value="ODEMEARACI">Ödeme Aracı</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Ödeme Şekli Adı</Label>
                    <Input
                      value={formData.internet_info?.payment_method_name || ""}
                      onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, payment_method_name: e.target.value })}
                      placeholder="Kredi Kartı ile Ödeme"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Ödeme Aracı/Platform</Label>
                    <Input
                      value={formData.internet_info?.payment_agent_name || ""}
                      onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, payment_agent_name: e.target.value })}
                      placeholder="iyzico, paytr, stripe"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                {/* E-Arşiv için ek kargo bilgileri */}
                {formData.invoice_profile === "EARSIVFATURA" && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200">
                    <div>
                      <Label className="text-[10px]">Taşıyıcı Firma</Label>
                      <Input
                        value={formData.internet_info?.carrier_name || ""}
                        onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, carrier_name: e.target.value })}
                        placeholder="Aras Kargo, MNG, Yurtiçi"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Gönderi Takip No</Label>
                      <Input
                        value={formData.internet_info?.tracking_number || ""}
                        onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, tracking_number: e.target.value })}
                        placeholder="1234567890"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Gönderi Tarihi</Label>
                      <Input
                        type="date"
                        value={formData.internet_info?.shipment_date || ""}
                        onChange={(e) => onFieldChange("internet_info", { ...formData.internet_info, shipment_date: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* İade Fatura Bilgileri */}
            {formData.invoice_type === "IADE" && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 space-y-2">
                <div className="flex items-center gap-1.5 text-orange-700 text-xs font-medium">
                  <RotateCcw className="h-3.5 w-3.5" />
                  İade Fatura Bilgileri
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <Label className="text-[10px]">İade Edilen Fatura No</Label>
                    <Input
                      value={formData.return_invoice_info?.invoice_number || ""}
                      onChange={(e) => onFieldChange("return_invoice_info", { ...formData.return_invoice_info, invoice_number: e.target.value })}
                      placeholder="FTR2024000001"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px]">İade Edilen Fatura Tarihi</Label>
                    <DatePicker
                      date={formData.return_invoice_info?.issue_date ? new Date(formData.return_invoice_info.issue_date) : undefined}
                      onSelect={(date) => onFieldChange("return_invoice_info", { ...formData.return_invoice_info, issue_date: date?.toISOString().split('T')[0] })}
                      className="h-7"
                    />
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  );
};

export default InvoiceHeaderCard;
