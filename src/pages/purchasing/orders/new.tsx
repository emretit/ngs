import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Globe, Calendar, RefreshCcw } from "lucide-react";
import { useCreatePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useVendors } from "@/hooks/useVendors";
import { useRFQ } from "@/hooks/useRFQs";
import { useExchangeRates } from "@/hooks/useExchangeRates";
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

  // Exchange rates management
  const { exchangeRates, lastUpdate, loading: isLoadingRates, refreshExchangeRates } = useExchangeRates();

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

  // Get exchange rate for selected currency
  const getCurrentExchangeRate = (): number | null => {
    const currency = watch('currency');
    if (!currency || currency === "TRY") {
      return null;
    }
    const rate = exchangeRates.find(r => r.currency_code === currency);
    return rate?.forex_selling || null;
  };

  // Auto-update exchange rate when currency changes
  useEffect(() => {
    const currency = watch('currency');
    if (currency && currency !== "TRY") {
      const currentRate = getCurrentExchangeRate();
      if (currentRate) {
        setValue('exchange_rate', currentRate);
      }
    } else if (currency === "TRY") {
      setValue('exchange_rate', 1.0);
    }
  }, [watch('currency'), exchangeRates]);

  const currentRate = getCurrentExchangeRate();

  const getLastUpdateText = () => {
    if (!lastUpdate) return "Güncelleme bilgisi yok";
    
    try {
      const date = new Date(lastUpdate);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      logger.error('Date parsing error:', error);
      return 'Geçersiz tarih';
    }
  };

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

          {/* Para Birimi ve Döviz Kuru - Modern Tek Satır Tasarım */}
          <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              {/* Para Birimi Seçimi */}
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-amber-900 whitespace-nowrap">Para Birimi:</Label>
                <Select 
                  value={watch('currency')} 
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger className="h-8 w-24 text-xs bg-white border-amber-300">
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

              {/* Döviz Kuru - Sadece TRY değilse */}
              {watch('currency') && watch('currency') !== "TRY" && (
                <>
                  <div className="h-5 w-px bg-amber-300" />
                  
                  <div className="flex items-center justify-between gap-2 flex-1">
                    {/* Sol: Kur Bilgisi */}
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-amber-900 whitespace-nowrap">
                          1 {watch('currency')} =
                        </span>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={watch('exchange_rate') || 1}
                          onChange={(e) => setValue('exchange_rate', parseFloat(e.target.value) || 1)}
                          className="h-7 w-24 text-xs font-medium text-amber-900 bg-white border-amber-300 text-right"
                        />
                        <span className="text-xs font-semibold text-amber-900">TRY</span>
                      </div>
                    </div>
                    
                    {/* Orta: Güncel Kur */}
                    {currentRate && (
                      <div className="text-[10px] text-amber-600 whitespace-nowrap">
                        Güncel: {currentRate.toFixed(4)} TRY
                      </div>
                    )}
                    
                    {/* Sağ: Tarih ve Yenile */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-amber-600">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{getLastUpdateText()}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-amber-100 shrink-0"
                        onClick={refreshExchangeRates}
                        disabled={isLoadingRates}
                        title="Kurları Yenile"
                      >
                        <RefreshCcw className={`h-3 w-3 text-amber-700 ${isLoadingRates ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
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
