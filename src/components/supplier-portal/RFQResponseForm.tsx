import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Send, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubmitQuote } from '@/hooks/useSupplierPortal';
import type { PortalRFQ, QuoteFormData, QuoteLineFormData } from '@/types/supplier-portal';

interface RFQResponseFormProps {
  rfq: PortalRFQ;
  onSuccess?: () => void;
}

export default function RFQResponseForm({ rfq, onSuccess }: RFQResponseFormProps) {
  const submitQuote = useSubmitQuote();
  
  // Initialize form with existing quote data if available
  const defaultLines: QuoteLineFormData[] = rfq.lines?.map((line) => {
    const existingLine = rfq.my_quote?.lines?.find(ql => ql.rfq_line_id === line.id);
    return {
      rfq_line_id: line.id,
      unit_price: existingLine?.unit_price || line.target_price || 0,
      tax_rate: existingLine?.tax_rate || 18,
      discount_rate: existingLine?.discount_rate || 0,
      delivery_days: existingLine?.delivery_days,
      notes: existingLine?.notes || '',
    };
  }) || [];

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
    defaultValues: {
      currency: rfq.my_quote?.currency || rfq.currency || 'TRY',
      valid_until: rfq.my_quote?.valid_until?.split('T')[0] || '',
      delivery_days: rfq.my_quote?.delivery_days || undefined,
      shipping_cost: rfq.my_quote?.shipping_cost || 0,
      discount_rate: rfq.my_quote?.discount_rate || 0,
      payment_terms: rfq.my_quote?.payment_terms || '',
      notes: rfq.my_quote?.notes || '',
      lines: defaultLines,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchLines = watch('lines');
  const watchShippingCost = watch('shipping_cost');
  const watchDiscountRate = watch('discount_rate');

  // Calculate totals
  const calculateLineTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    watchLines?.forEach((line, index) => {
      const rfqLine = rfq.lines?.[index];
      if (!rfqLine) return;

      const quantity = rfqLine.quantity || 1;
      const lineSubtotal = (line.unit_price || 0) * quantity;
      const discount = lineSubtotal * ((line.discount_rate || 0) / 100);
      const taxable = lineSubtotal - discount;
      const tax = taxable * ((line.tax_rate || 18) / 100);

      subtotal += taxable;
      taxTotal += tax;
    });

    const globalDiscount = subtotal * ((watchDiscountRate || 0) / 100);
    const finalSubtotal = subtotal - globalDiscount;
    const shipping = watchShippingCost || 0;
    const grandTotal = finalSubtotal + taxTotal + shipping;

    return { subtotal, taxTotal, globalDiscount, shipping, grandTotal };
  };

  const totals = calculateLineTotals();

  const onSubmit = (data: QuoteFormData) => {
    // Add quantity from rfq lines to each quote line for calculation
    const linesWithQuantity = data.lines.map((line, index) => ({
      ...line,
      quantity: rfq.lines?.[index]?.quantity || 1,
    }));

    submitQuote.mutate(
      { 
        rfqId: rfq.id, 
        quoteData: { ...data, lines: linesWithQuantity } 
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teklif Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Para Birimi</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                    <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Geçerlilik Tarihi</Label>
            <Input type="date" {...register('valid_until')} />
          </div>

          <div className="space-y-2">
            <Label>Genel Teslimat (Gün)</Label>
            <Input 
              type="number" 
              placeholder="Ör: 15" 
              {...register('delivery_days', { valueAsNumber: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Kargo/Nakliye Ücreti</Label>
            <Input 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              {...register('shipping_cost', { valueAsNumber: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Genel İskonto (%)</Label>
            <Input 
              type="number" 
              step="0.01"
              placeholder="0" 
              {...register('discount_rate', { valueAsNumber: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Ödeme Koşulları</Label>
            <Input 
              placeholder="Ör: 30 gün vadeli" 
              {...register('payment_terms')} 
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label>Notlar</Label>
            <Textarea 
              placeholder="Teklifinizle ilgili eklemek istediğiniz notlar..." 
              rows={3}
              {...register('notes')} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Kalem Fiyatlandırması
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Açıklama</TableHead>
                  <TableHead className="w-[80px]">Miktar</TableHead>
                  <TableHead className="w-[60px]">Birim</TableHead>
                  <TableHead className="w-[120px]">Birim Fiyat</TableHead>
                  <TableHead className="w-[80px]">KDV %</TableHead>
                  <TableHead className="w-[80px]">İskonto %</TableHead>
                  <TableHead className="w-[80px]">Teslimat</TableHead>
                  <TableHead className="w-[120px]">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const rfqLine = rfq.lines?.[index];
                  const line = watchLines?.[index];
                  
                  // Calculate line total
                  const quantity = rfqLine?.quantity || 1;
                  const lineSubtotal = (line?.unit_price || 0) * quantity;
                  const discount = lineSubtotal * ((line?.discount_rate || 0) / 100);
                  const taxable = lineSubtotal - discount;
                  const tax = taxable * ((line?.tax_rate || 18) / 100);
                  const lineTotal = taxable + tax;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rfqLine?.description}</p>
                          {rfqLine?.target_price && (
                            <p className="text-xs text-slate-500">
                              Hedef: {rfqLine.target_price.toLocaleString('tr-TR')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{rfqLine?.quantity}</TableCell>
                      <TableCell>{rfqLine?.uom}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-full"
                          {...register(`lines.${index}.unit_price`, { 
                            required: true,
                            valueAsNumber: true 
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-full"
                          {...register(`lines.${index}.tax_rate`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-full"
                          {...register(`lines.${index}.discount_rate`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-full"
                          placeholder="Gün"
                          {...register(`lines.${index}.delivery_days`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex flex-col items-end gap-2 text-sm">
              <div className="flex justify-between w-64">
                <span className="text-slate-600">Ara Toplam:</span>
                <span className="font-medium">{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              {totals.globalDiscount > 0 && (
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">İskonto:</span>
                  <span className="font-medium text-red-600">-{totals.globalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between w-64">
                <span className="text-slate-600">KDV Toplam:</span>
                <span className="font-medium">{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              {totals.shipping > 0 && (
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">Kargo:</span>
                  <span className="font-medium">{totals.shipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between w-64 text-lg border-t pt-2">
                <span className="font-semibold">Genel Toplam:</span>
                <span className="font-bold text-emerald-600">
                  {totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {watch('currency')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={submitQuote.isPending}
        >
          {submitQuote.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Teklifi Gönder
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

