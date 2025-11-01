import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin, ShoppingCart, Receipt } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import { OrderStatus } from "@/types/orders";
import { orderStatusLabels, orderStatusColors } from "./OrderDetailsCard";

interface OrderCustomerInfoCardProps {
  formData: {
    customer_id: string;
    contact_name: string;
    subject?: string;
    order_date?: Date;
    requested_date?: Date;
    currency?: string;
    status: OrderStatus;
    order_number?: string;
    delivery_address?: string;
    delivery_contact_name?: string;
    delivery_contact_phone?: string;
    shipment_date?: Date;
    delivery_date?: Date;
    shipment_location?: string;
    payment_method?: string;
    invoice_number?: string;
    invoice_date?: Date;
    notes?: string;
    exchange_rate?: number;
    is_cancelled?: boolean;
    is_non_shippable?: boolean;
  };
  handleFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const OrderCustomerInfoCard: React.FC<OrderCustomerInfoCardProps> = ({
  formData,
  handleFieldChange,
  errors = {}
}) => {
  // Form object for FormProvider
  const form = useForm({
    defaultValues: {
      customer_id: formData.customer_id || '',
      contact_name: formData.contact_name || '',
    }
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {/* Sipariş Bilgileri */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
            Sipariş Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Sol Sütun */}
            <div className="space-y-2">
              <FormProvider {...form}>
                {/* Müşteri */}
                <ProposalPartnerSelect partnerType="customer" required />

                {/* İletişim Kişisi */}
                <ContactPersonInput
                  value={formData.contact_name}
                  onChange={(value) => handleFieldChange('contact_name', value)}
                  customerId={formData.customer_id}
                  error={errors.contact_name || ""}
                  required
                />
              </FormProvider>

              {/* Sipariş Tarihi */}
              <div>
                <Label htmlFor="order_date" className="text-xs font-medium text-gray-700">
                  Sipariş Tarihi <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={formData.order_date}
                  onSelect={(date) => handleFieldChange('order_date', date)}
                  placeholder="Sipariş tarihi seçin"
                  className="h-7 text-xs"
                />
              </div>

              {/* Para Birimi */}
              <div>
                <Label htmlFor="currency" className="text-xs font-medium text-gray-700">Para Birimi</Label>
                <Select value={formData.currency || "TRY"} onValueChange={(value) => handleFieldChange('currency', value)}>
                  <SelectTrigger className="mt-1 h-7 text-xs">
                    <SelectValue placeholder="Para birimi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ TRY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sağ Sütun */}
            <div className="space-y-2">
              {/* Sipariş Konusu */}
              <div>
                <Label htmlFor="subject" className="text-xs font-medium text-gray-700">
                  Sipariş Konusu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={formData.subject || ""}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="Sipariş konusunu girin"
                  className="mt-1 h-7 text-xs"
                />
              </div>

              {/* Sipariş No */}
              <div>
                <Label htmlFor="order_number" className="text-xs font-medium text-gray-700">Sipariş No</Label>
                <Input
                  id="order_number"
                  value={formData.order_number || ""}
                  onChange={(e) => handleFieldChange('order_number', e.target.value)}
                  className="mt-1 h-7 text-xs"
                  readOnly
                />
              </div>

              {/* Sipariş Durumu */}
              <div>
                <Label htmlFor="status" className="text-xs font-medium text-gray-700">Sipariş Durumu</Label>
                <Select value={formData.status} onValueChange={(value: OrderStatus) => handleFieldChange('status', value)}>
                  <SelectTrigger className="mt-1 h-7 text-xs">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${orderStatusColors[value as OrderStatus]}`}></span>
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ödeme Şekli - Sadece payment dropdown göster */}
              <ProposalFormTerms
                paymentTerms={formData.payment_method || ""}
                deliveryTerms=""
                warrantyTerms=""
                priceTerms=""
                otherTerms=""
                showOnlyPayment={true}
                showOnlyLabel={true}
                onInputChange={(e) => {
                  if (e.target.name === 'payment_terms') {
                    handleFieldChange('payment_method', e.target.value);
                  }
                }}
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

          {/* Notlar / Açıklama */}
          <div>
            <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar / Açıklama</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Sipariş hakkında notlarınızı yazın..."
              className="mt-1 h-16 text-xs resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teslimat ve Fatura Bilgileri */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            Teslimat ve Fatura Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 px-3 pb-3">
          {/* Teslimat Tarihleri ve Sevk Yeri */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <Label htmlFor="requested_date" className="text-xs font-medium text-gray-700">
                İstenen Tarih
              </Label>
              <DatePicker
                date={formData.requested_date}
                onSelect={(date) => handleFieldChange('requested_date', date)}
                placeholder="İstenen tarih seçin"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="shipment_date" className="text-xs font-medium text-gray-700">
                Sevk Tarihi
              </Label>
              <DatePicker
                date={formData.shipment_date}
                onSelect={(date) => handleFieldChange('shipment_date', date)}
                placeholder="Sevk tarihi seçin"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="delivery_date" className="text-xs font-medium text-gray-700">
                Teslim Tarihi
              </Label>
              <DatePicker
                date={formData.delivery_date}
                onSelect={(date) => handleFieldChange('delivery_date', date)}
                placeholder="Teslim tarihi seçin"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="shipment_location" className="text-xs font-medium text-gray-700">
                Sevk Yeri
              </Label>
              <Input
                id="shipment_location"
                value={formData.shipment_location || ""}
                onChange={(e) => handleFieldChange('shipment_location', e.target.value)}
                placeholder="Sevk yeri girin"
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>

          {/* Teslimat Adresi */}
          <div>
            <Label htmlFor="delivery_address" className="text-xs font-medium text-gray-700">
              Teslimat Adresi
            </Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address || ""}
              onChange={(e) => handleFieldChange('delivery_address', e.target.value)}
              placeholder="Teslimat adresini girin..."
              className="mt-1 h-14 text-xs resize-none"
            />
          </div>

          {/* Teslimat İletişim Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="delivery_contact_name" className="text-xs font-medium text-gray-700">
                Teslim Alacak Kişi
              </Label>
              <Input
                id="delivery_contact_name"
                value={formData.delivery_contact_name || ""}
                onChange={(e) => handleFieldChange('delivery_contact_name', e.target.value)}
                placeholder="İsim Soyisim"
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="delivery_contact_phone" className="text-xs font-medium text-gray-700">
                Teslim Alacak Kişi Telefon
              </Label>
              <Input
                id="delivery_contact_phone"
                value={formData.delivery_contact_phone || ""}
                onChange={(e) => handleFieldChange('delivery_contact_phone', e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>

          {/* Fatura Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCustomerInfoCard;
