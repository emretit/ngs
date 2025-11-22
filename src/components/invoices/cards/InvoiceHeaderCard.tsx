import React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
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
    vade_tarihi: Date | null;
    aciklama: string;
    notlar: string;
    para_birimi: string;
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
            <Label htmlFor="para_birimi">Para Birimi</Label>
            <Select
              value={formData.para_birimi}
              onValueChange={(value) => onFieldChange("para_birimi", value)}
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

          <div>
            <Label htmlFor="odeme_sekli">Ödeme Şekli</Label>
            <Input
              id="odeme_sekli"
              value={formData.odeme_sekli}
              onChange={(e) => onFieldChange("odeme_sekli", e.target.value)}
              placeholder="Nakit, Kredi Kartı, Havale..."
            />
          </div>

          <div className="md:col-span-2">
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

        {/* Üçüncü Satır: Notlar ve Banka Bilgileri */}
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

