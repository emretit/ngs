import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart } from "lucide-react";
import { OrderStatus } from "@/types/orders";

// Sipariş durumu label'ları
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  processing: 'İşlemde',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi'
};

// Sipariş durumu renkleri
export const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-orange-500',
  delivered: 'bg-green-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500'
};

interface OrderDetailsCardProps {
  formData: {
    expected_delivery_date?: Date;
    document_number?: string;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
    payment_method?: string;
    invoice_date?: Date;
    invoice_number?: string;
    is_cancelled?: boolean;
    is_non_shippable?: boolean;
  };
  handleFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  formData,
  handleFieldChange,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-1.5 pt-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
          Sipariş Detayları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 px-3 pb-3">
        {/* Tahmini Teslimat ve Evrak No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="expected_delivery_date" className="text-xs font-medium text-gray-700">
              Tahmini Teslimat
            </Label>
            <DatePicker
              date={formData.expected_delivery_date}
              onSelect={(date) => handleFieldChange('expected_delivery_date', date)}
              placeholder="Tahmini teslimat"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="document_number" className="text-xs font-medium text-gray-700">Evrak No</Label>
            <Input
              id="document_number"
              value={formData.document_number || ""}
              onChange={(e) => handleFieldChange('document_number', e.target.value)}
              placeholder="Evrak no girin"
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>

        {/* Döviz Kuru - Sadece TRY dışındaki para birimleri için */}
        {formData.currency && formData.currency !== "TRY" && (
          <div>
            <Label htmlFor="exchange_rate" className="text-xs font-medium text-gray-700">
              Döviz Kuru (1 {formData.currency} = ? TRY)
            </Label>
            <Input
              id="exchange_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.exchange_rate || ""}
              onChange={(e) => handleFieldChange('exchange_rate', parseFloat(e.target.value) || 1)}
              placeholder="Örn: 32.50"
              className="mt-1 h-7 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              1 {formData.currency} = {formData.exchange_rate || "1"} TRY
            </p>
          </div>
        )}

        {/* Ödeme Şekli */}
        <div>
          <Label htmlFor="payment_method" className="text-xs font-medium text-gray-700">Ödeme Şekli</Label>
          <Textarea
            id="payment_method"
            value={formData.payment_method || ""}
            onChange={(e) => handleFieldChange('payment_method', e.target.value)}
            placeholder="Ödeme şeklini yazın..."
            className="mt-1 h-12 text-xs resize-none"
          />
        </div>

        {/* Fatura Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="invoice_number" className="text-xs font-medium text-gray-700">Fatura No</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number || ""}
              onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
              placeholder="Fatura numarası"
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="invoice_date" className="text-xs font-medium text-gray-700">Fatura Tarihi</Label>
            <DatePicker
              date={formData.invoice_date}
              onSelect={(date) => handleFieldChange('invoice_date', date)}
              placeholder="Fatura tarihi seçin"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Durum Checkboxları */}
        <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_cancelled"
              checked={formData.is_cancelled || false}
              onCheckedChange={(checked) => handleFieldChange('is_cancelled', checked)}
            />
            <label
              htmlFor="is_cancelled"
              className="text-xs font-medium text-gray-700 cursor-pointer select-none"
            >
              Sipariş İptal
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_non_shippable"
              checked={formData.is_non_shippable || false}
              onCheckedChange={(checked) => handleFieldChange('is_non_shippable', checked)}
            />
            <label
              htmlFor="is_non_shippable"
              className="text-xs font-medium text-gray-700 cursor-pointer select-none"
            >
              Sevkedilmez
            </label>
          </div>
        </div>

        {/* Notlar Alanı */}
        <div>
          <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar / Açıklama</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Sipariş hakkında notlarınızı yazın..."
            className="mt-1 h-16 text-xs resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetailsCard;
