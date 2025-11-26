import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useCreatePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useVendors } from "@/hooks/useVendors";
import { useRFQ } from "@/hooks/useRFQs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface POLine {
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
}

export default function NewPurchaseOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfq_id');
  const vendorId = searchParams.get('vendor_id');

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      supplier_id: vendorId || '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      currency: 'TRY',
      exchange_rate: 1,
      incoterm: '',
      notes: '',
    },
  });

  const createPO = useCreatePurchaseOrder();
  const { data: vendors } = useVendors({ is_active: true });
  const { data: rfq } = useRFQ(rfqId || '');
  
  const [lines, setLines] = useState<POLine[]>([
    { description: '', quantity: 1, uom: 'adet', unit_price: 0, tax_rate: 18, discount_rate: 0 },
  ]);

  // Pre-fill from RFQ if available
  useEffect(() => {
    if (rfq && vendorId) {
      const selectedQuote = rfq.quotes?.find(q => q.vendor_id === vendorId && q.is_selected);
      if (selectedQuote) {
        setValue('currency', selectedQuote.currency);
        setValue('exchange_rate', selectedQuote.exchange_rate);
        
        const rfqLines = selectedQuote.lines?.map(line => ({
          description: line.rfq_line?.description || '',
          quantity: line.rfq_line?.quantity || 1,
          uom: line.rfq_line?.uom || 'adet',
          unit_price: line.unit_price,
          tax_rate: line.tax_rate,
          discount_rate: line.discount_rate,
        })) || [];
        
        if (rfqLines.length > 0) {
          setLines(rfqLines);
        }
      }
    }
  }, [rfq, vendorId, setValue]);

  // Pre-fill from PR if available
  useEffect(() => {
    const prItems = location.state?.prItems;
    if (prItems && Array.isArray(prItems) && prItems.length > 0) {
      setLines(prItems);
    }
  }, [location.state]);

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, uom: 'adet', unit_price: 0, tax_rate: 18, discount_rate: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof POLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const calculateLineTotal = (line: POLine) => {
    const subtotal = line.quantity * line.unit_price;
    const discount = subtotal * (line.discount_rate / 100);
    const taxable = subtotal - discount;
    const tax = taxable * (line.tax_rate / 100);
    return taxable + tax;
  };

  const grandTotal = lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);

  const onSubmit = async (data: any) => {
    if (!data.supplier_id) {
      alert('Tedarikçi seçmelisiniz');
      return;
    }

    if (lines.some(line => !line.description)) {
      alert('Tüm satırlar için açıklama girmelisiniz');
      return;
    }

    await createPO.mutateAsync({
      ...data,
      rfq_id: rfqId || undefined,
      items: lines,
    });

    navigate('/purchasing/orders');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Satın Alma Siparişi</h1>
          <p className="text-muted-foreground">Tedarikçiye sipariş oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Sipariş Bilgileri</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Tedarikçi *</Label>
              <Select 
                value={watch('supplier_id')} 
                onValueChange={(value) => setValue('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_date">Sipariş Tarihi *</Label>
              <Input
                id="order_date"
                type="date"
                {...register('order_date', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Beklenen Teslimat</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                {...register('expected_delivery_date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select 
                value={watch('currency')} 
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange_rate">Kur</Label>
              <Input
                id="exchange_rate"
                type="number"
                step="0.0001"
                {...register('exchange_rate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incoterm">Incoterm</Label>
              <Input
                id="incoterm"
                placeholder="EXW, FOB, CIF..."
                {...register('incoterm')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Sipariş notları..."
              {...register('notes')}
              rows={2}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Sipariş Kalemleri</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Satır Ekle
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Input
                      placeholder="Açıklama *"
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="Miktar"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      placeholder="Birim"
                      value={line.uom}
                      onChange={(e) => updateLine(index, 'uom', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Birim fiyat"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="KDV%"
                      value={line.tax_rate}
                      onChange={(e) => updateLine(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="İsk%"
                      value={line.discount_rate}
                      onChange={(e) => updateLine(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={calculateLineTotal(line).toFixed(2)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <div className="text-lg font-semibold">
                Genel Toplam: {grandTotal.toFixed(2)} {watch('currency')}
              </div>
              {watch('currency') !== 'TRY' && watch('exchange_rate') > 0 && (
                <div className="text-sm text-muted-foreground">
                  ≈ {(grandTotal * watch('exchange_rate')).toFixed(2)} TRY
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/purchasing/orders')}
          >
            İptal
          </Button>
          <Button type="submit" disabled={createPO.isPending}>
            {createPO.isPending ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
