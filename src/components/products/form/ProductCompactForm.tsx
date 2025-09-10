import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, AlertTriangle, Package, DollarSign, Archive, Settings } from "lucide-react";
import CurrencySelect from "./pricing/CurrencySelect";
import PriceInput from "./pricing/PriceInput";
import TaxRateSelect from "./pricing/TaxRateSelect";
import PricePreviewCard from "./pricing/PricePreviewCard";
import SupplierSelect from "./supplier/SupplierSelect";
import BarcodeInput from "./supplier/BarcodeInput";
import ProductStatusSwitch from "./supplier/ProductStatusSwitch";
import ImageUploader from "./supplier/ImageUploader";
import CategorySelect from "./CategorySelect";

interface ProductCompactFormProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductCompactForm = ({ form }: ProductCompactFormProps) => {
  // Watch form values for real-time updates
  const watchedValues = useWatch({
    control: form.control,
    name: ["stock_quantity", "stock_threshold", "min_stock_level", "price", "tax_rate", "currency", "purchase_price", "price_includes_vat"]
  });

  const [stockQuantity, stockThreshold, minStockLevel, price, taxRate, currency, purchasePrice, priceIncludesVat] = watchedValues;



  // Stock status calculation
  const getStockStatus = () => {
    const thresholdToUse = stockThreshold || minStockLevel;
    
    if (stockQuantity <= 0) {
      return {
        label: "Stokta Yok",
        icon: <AlertCircle className="h-4 w-4 text-destructive" />,
        color: "text-destructive",
      };
    } else if (stockQuantity <= thresholdToUse) {
      return {
        label: "Düşük Stok",
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        color: "text-amber-500",
      };
    } else {
      return {
        label: "Stokta Mevcut",
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        color: "text-green-600",
      };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
      {/* Hidden company_id field */}
      <FormField
        control={form.control}
        name="company_id"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Left Column */}
      <div className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ürün adı giriniz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Stok Kodu)</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU giriniz" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CategorySelect form={form} />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ürün açıklaması giriniz"
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Inventory Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Stok Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Stok Miktarı *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Sistemdeki mevcut ürün miktarını girin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birim</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "piece"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birim seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="piece">Adet</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="g">Gram</SelectItem>
                            <SelectItem value="lt">Litre</SelectItem>
                            <SelectItem value="m">Metre</SelectItem>
                            <SelectItem value="package">Paket</SelectItem>
                            <SelectItem value="box">Kutu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="min_stock_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stok Seviyesi *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Bu seviyenin altına düştüğünde sistem uyarı verecektir
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok Alarm Eşiği</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Özel bir alarm eşiği belirleyin (boş bırakılırsa minimum stok seviyesi kullanılır)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Stock Status Preview */}
              <div className="lg:col-span-1">
                <Card className="bg-muted/50 h-fit">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-4 text-center">Stok Durumu</h4>
                    <div className="flex flex-col items-center space-y-3">
                      {stockStatus.icon}
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                      
                      <div className="w-full pt-3 border-t border-border space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mevcut:</span>
                          <span className="font-medium">{stockQuantity || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min. Seviye:</span>
                          <span className="font-medium">{minStockLevel || 0}</span>
                        </div>
                        {stockThreshold > 0 && stockThreshold !== minStockLevel && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alarm:</span>
                            <span className="font-medium">{stockThreshold}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Pricing & Tax Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fiyatlandırma ve Vergi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CurrencySelect form={form} />
                  <TaxRateSelect form={form} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PriceInput 
                    form={form} 
                    name="price" 
                    label="Satış Fiyatı" 
                    isRequired
                    showVatToggle={true}
                  />
                  <PriceInput 
                    form={form} 
                    name="purchase_price" 
                    label="Alış Fiyatı" 
                    showVatToggle={true}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <PricePreviewCard 
                  price={price || 0}
                  taxRate={taxRate || 20}
                  currency={currency || "TRY"}
                  priceIncludesVat={priceIncludesVat || false}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ek Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <SupplierSelect form={form} />
                <BarcodeInput form={form} />
                <ProductStatusSwitch form={form} />
              </div>
              <ImageUploader form={form} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductCompactForm;