import React from "react";
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
import { Building2, FileText, CheckCircle2, Info, CheckCircle2 as CheckIcon } from "lucide-react";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";

interface InvoiceHeaderCardProps {
  // Customer fields
  selectedCustomer: any;
  
  // Invoice fields
  formData: {
    fatura_no: string;
    fatura_tarihi: Date;
    issue_time: string; // HH:mm formatında saat
    vade_tarihi: Date | null;
    invoice_type: string; // SATIS, IADE, ISTISNA, OZELMATRAH, IHRACKAYITLI, SGK
    invoice_profile: string; // TEMELFATURA, TICARIFATURA
    send_type: string; // KAGIT, ELEKTRONIK
    sales_platform: string; // NORMAL, INTERNET
    is_despatch: boolean; // İrsaliye yerine geçer
    internet_info: any; // JSONB - İnternet satış bilgileri
    return_invoice_info: any; // JSONB - İade fatura bilgileri
    aciklama: string;
    notlar: string;
    para_birimi: string;
    exchange_rate: number; // Döviz kuru
    odeme_sekli: string;
    banka_bilgileri: string;
  };
  assignedInvoiceNumber: string | null;
  einvoiceStatus?: any;
  onFieldChange: (field: string, value: any) => void;
  form?: UseFormReturn<any>; // React Hook Form instance
}

const InvoiceHeaderCard: React.FC<InvoiceHeaderCardProps> = ({
  selectedCustomer,
  formData,
  assignedInvoiceNumber,
  einvoiceStatus,
  onFieldChange,
  form,
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          Müşteri ve Fatura Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 px-4 pb-4">
        {/* Dört Kolonlu Yapı */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kolon 1: Müşteri - ProposalPartnerSelect kullanıyoruz */}
          <div className="space-y-2">
            {form ? (
              <FormProvider {...form}>
                <ProposalPartnerSelect 
                  partnerType="customer" 
                  required 
                  hideLabel={false}
                />
              </FormProvider>
            ) : (
              <Label htmlFor="customer">Müşteri *</Label>
            )}
            
            {selectedCustomer && (
              <div className="flex flex-col gap-2 text-sm">
                {selectedCustomer.is_einvoice_mukellef ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    E-Fatura Mükellefi
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 w-fit">
                    <Info className="h-3 w-3 mr-1" />
                    E-Fatura Değil
                  </Badge>
                )}
                {selectedCustomer.tax_number && (
                  <span className="text-gray-500 text-xs">VKN: {selectedCustomer.tax_number}</span>
                )}
              </div>
            )}
          </div>

          {/* Kolon 2: Fatura Numarası ve Tarih */}
          <div className="space-y-2">
            <Label htmlFor="fatura_no">Fatura Numarası</Label>
            <div className="relative">
              <Input
                id="fatura_no"
                value={assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id || "Henüz atanmadı"}
                placeholder="E-fatura gönderilirken otomatik atanacak"
                disabled
                className={`bg-gray-50 ${assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id ? 'text-green-600 font-medium' : 'text-gray-500'}`}
              />
              {(assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id) && (
                <CheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id
                ? "✅ Nilvera tarafından atandı" 
                : "⏳ Otomatik atanacak"
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fatura_tarihi">Fatura Tarihi *</Label>
            <DatePicker
              date={formData.fatura_tarihi}
              onSelect={(date) => date && onFieldChange("fatura_tarihi", date)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_time">Fatura Saati</Label>
            <TimePicker
              time={formData.issue_time}
              onSelect={(time) => onFieldChange("issue_time", time)}
              placeholder="Saat seçin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vade_tarihi">Vade Tarihi</Label>
            <DatePicker
              date={formData.vade_tarihi}
              onSelect={(date) => onFieldChange("vade_tarihi", date)}
            />
          </div>
        </div>

        {/* İkinci Satır: Dört Kolon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="invoice_type">Fatura Tipi</Label>
            <Select
              value={formData.invoice_type}
              onValueChange={(value) => onFieldChange("invoice_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fatura tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SATIS">Satış Faturası</SelectItem>
                <SelectItem value="IADE">İade Faturası</SelectItem>
                <SelectItem value="ISTISNA">İstisna Faturası</SelectItem>
                <SelectItem value="OZELMATRAH">Özel Matrah Faturası</SelectItem>
                <SelectItem value="IHRACKAYITLI">İhraç Kayıtlı Fatura</SelectItem>
                <SelectItem value="SGK">SGK Faturası</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="invoice_profile">Fatura Profili</Label>
            <Select
              value={formData.invoice_profile}
              onValueChange={(value) => onFieldChange("invoice_profile", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fatura profili seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEMELFATURA">Temel Fatura</SelectItem>
                <SelectItem value="TICARIFATURA">Ticari Fatura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="para_birimi">Para Birimi</Label>
            <Select
              value={formData.para_birimi}
              onValueChange={(value) => {
                onFieldChange("para_birimi", value);
                // TRY seçildiğinde exchange_rate'ı 1 yap
                if (value === "TRY") {
                  onFieldChange("exchange_rate", 1);
                }
              }}
            >
              <SelectTrigger>
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

          {formData.para_birimi !== "TRY" && (
            <div>
              <Label htmlFor="exchange_rate">Döviz Kuru</Label>
              <Input
                id="exchange_rate"
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.exchange_rate || 1}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 1;
                  onFieldChange("exchange_rate", value);
                }}
                placeholder="1.0000"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 {formData.para_birimi} = {formData.exchange_rate || 1} TRY
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="odeme_sekli">Ödeme Şekli</Label>
            <Input
              id="odeme_sekli"
              value={formData.odeme_sekli}
              onChange={(e) => onFieldChange("odeme_sekli", e.target.value)}
              placeholder="Nakit, Kredi Kartı, Havale..."
            />
          </div>
          </div>

        {/* Üçüncü Satır: Açıklama */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="aciklama">Açıklama</Label>
            <Textarea
              id="aciklama"
              value={formData.aciklama}
              onChange={(e) => onFieldChange("aciklama", e.target.value)}
              placeholder="Fatura açıklaması..."
              className="resize-none"
            />
          </div>
        </div>

        {/* E-Arşiv ve İade Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="send_type">Gönderim Tipi</Label>
            <Select
              value={formData.send_type}
              onValueChange={(value) => onFieldChange("send_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gönderim tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ELEKTRONIK">Elektronik</SelectItem>
                <SelectItem value="KAGIT">Kağıt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sales_platform">Satış Platformu</Label>
            <Select
              value={formData.sales_platform}
              onValueChange={(value) => onFieldChange("sales_platform", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Satış platformu seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="INTERNET">İnternet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_despatch"
                checked={formData.is_despatch || false}
                onCheckedChange={(checked) => onFieldChange("is_despatch", checked)}
              />
              <Label htmlFor="is_despatch" className="text-sm font-normal cursor-pointer">
                İrsaliye Yerine Geçer
              </Label>
            </div>
          </div>
        </div>

        {/* İnternet Satış Bilgileri - Sadece sales_platform = INTERNET ise */}
        {formData.sales_platform === "INTERNET" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <Label htmlFor="internet_website">Web Sitesi</Label>
              <Input
                id="internet_website"
                value={formData.internet_info?.website || ""}
                onChange={(e) => onFieldChange("internet_info", {
                  ...formData.internet_info,
                  website: e.target.value
                })}
                placeholder="www.example.com"
              />
            </div>
            <div>
              <Label htmlFor="internet_payment_method">Ödeme Yöntemi</Label>
              <Input
                id="internet_payment_method"
                value={formData.internet_info?.payment_method || ""}
                onChange={(e) => onFieldChange("internet_info", {
                  ...formData.internet_info,
                  payment_method: e.target.value
                })}
                placeholder="KREDIKARTI, BANKAKARTI, vb."
              />
            </div>
            <div>
              <Label htmlFor="internet_payment_method_name">Ödeme Yöntemi Adı</Label>
              <Input
                id="internet_payment_method_name"
                value={formData.internet_info?.payment_method_name || ""}
                onChange={(e) => onFieldChange("internet_info", {
                  ...formData.internet_info,
                  payment_method_name: e.target.value
                })}
                placeholder="Kredi Kartı"
              />
            </div>
            <div>
              <Label htmlFor="internet_payment_agent_name">Ödeme Aracı Adı</Label>
              <Input
                id="internet_payment_agent_name"
                value={formData.internet_info?.payment_agent_name || ""}
                onChange={(e) => onFieldChange("internet_info", {
                  ...formData.internet_info,
                  payment_agent_name: e.target.value
                })}
                placeholder="iyzico, paytr, vb."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="internet_payment_date">Ödeme Tarihi</Label>
              <DatePicker
                date={formData.internet_info?.payment_date ? new Date(formData.internet_info.payment_date) : undefined}
                onSelect={(date) => onFieldChange("internet_info", {
                  ...formData.internet_info,
                  payment_date: date ? date.toISOString().split('T')[0] : null
                })}
              />
            </div>
          </div>
        )}

        {/* İade Fatura Bilgileri - Sadece invoice_type = IADE ise */}
        {formData.invoice_type === "IADE" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <Label htmlFor="return_invoice_number">İade Edilen Fatura No</Label>
              <Input
                id="return_invoice_number"
                value={formData.return_invoice_info?.invoice_number || ""}
                onChange={(e) => onFieldChange("return_invoice_info", {
                  ...formData.return_invoice_info,
                  invoice_number: e.target.value
                })}
                placeholder="FTR2024000001"
              />
            </div>
            <div>
              <Label htmlFor="return_issue_date">İade Edilen Fatura Tarihi</Label>
              <DatePicker
                date={formData.return_invoice_info?.issue_date ? new Date(formData.return_invoice_info.issue_date) : undefined}
                onSelect={(date) => onFieldChange("return_invoice_info", {
                  ...formData.return_invoice_info,
                  issue_date: date ? date.toISOString().split('T')[0] : null
                })}
              />
            </div>
          </div>
        )}

        {/* Dördüncü Satır: Notlar ve Banka Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea
              id="notlar"
              value={formData.notlar}
              onChange={(e) => onFieldChange("notlar", e.target.value)}
              placeholder="Ek notlar..."
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="banka_bilgileri">Banka Bilgileri</Label>
            <Textarea
              id="banka_bilgileri"
              value={formData.banka_bilgileri}
              onChange={(e) => onFieldChange("banka_bilgileri", e.target.value)}
              placeholder="Banka adı, IBAN, hesap bilgileri..."
              className="resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHeaderCard;

