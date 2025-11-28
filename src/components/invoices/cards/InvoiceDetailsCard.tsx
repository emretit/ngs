import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FileText, CheckCircle2 } from "lucide-react";

interface InvoiceDetailsCardProps {
  formData: {
    fatura_no: string;
    fatura_tarihi: Date;
    vade_tarihi: Date | null;
    aciklama: string;
    notlar: string;
    para_birimi: string;
    banka_bilgileri: string;
  };
  assignedInvoiceNumber: string | null;
  einvoiceStatus?: any;
  onFieldChange: (field: string, value: any) => void;
}

const InvoiceDetailsCard: React.FC<InvoiceDetailsCardProps> = ({
  formData,
  assignedInvoiceNumber,
  einvoiceStatus,
  onFieldChange,
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
          Fatura Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {assignedInvoiceNumber || einvoiceStatus?.nilvera_invoice_id
                ? "✅ Fatura numarası Nilvera tarafından atandı" 
                : "⏳ E-fatura gönderilirken Nilvera tarafından otomatik atanacak"
              }
            </p>
          </div>

          <div>
            <Label htmlFor="fatura_tarihi">Fatura Tarihi *</Label>
            <DatePicker
              date={formData.fatura_tarihi}
              onSelect={(date) => date && onFieldChange("fatura_tarihi", date)}
            />
          </div>

          <div>
            <Label htmlFor="vade_tarihi">Vade Tarihi</Label>
            <DatePicker
              date={formData.vade_tarihi}
              onSelect={(date) => onFieldChange("vade_tarihi", date)}
            />
          </div>

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

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="aciklama">Açıklama</Label>
            <Textarea
              id="aciklama"
              value={formData.aciklama}
              onChange={(e) => onFieldChange("aciklama", e.target.value)}
              placeholder="Fatura açıklaması..."
            />
          </div>

          <div>
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea
              id="notlar"
              value={formData.notlar}
              onChange={(e) => onFieldChange("notlar", e.target.value)}
              placeholder="Ek notlar..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="banka_bilgileri">Banka Bilgileri</Label>
          <Textarea
            id="banka_bilgileri"
            value={formData.banka_bilgileri}
            onChange={(e) => onFieldChange("banka_bilgileri", e.target.value)}
            placeholder="Banka adı, IBAN, hesap bilgileri..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailsCard;







