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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full">
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
      <div className="space-y-3">
        {/* Basic Information Card */}
        <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl h-[320px]">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Temel Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-5 pb-5 h-full flex flex-col">
            {/* Ürün Adı - Tam Genişlik */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Ürün Adı *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ürün adı giriniz" 
                      className="h-9 text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* SKU ve Kategori - Yan Yana */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">SKU (Stok Kodu)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SKU giriniz" 
                        className="h-9 text-sm" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <CategorySelect form={form} />
            </div>

            {/* Açıklama - Tam Genişlik */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ürün açıklaması giriniz"
                      className="resize-none min-h-[80px] text-sm"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Inventory Management Card */}
        <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl h-[320px]">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                <Archive className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Stok Yönetimi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-5 pb-5 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sol Taraf - Form Alanları */}
              <div className="lg:col-span-2 space-y-4">
                {/* Stok Miktarı ve Birim */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Başlangıç Stok Miktarı *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500 mt-1">
                          Sistemdeki mevcut ürün miktarını girin
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Birim</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "piece"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
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
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Minimum Stok ve Alarm Eşiği */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="min_stock_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Minimum Stok Seviyesi *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500 mt-1">
                          Bu seviyenin altına düştüğünde sistem uyarı verecektir
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Stok Alarm Eşiği</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500 mt-1">
                          Özel bir alarm eşiği belirleyin
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sağ Taraf - Stok Durumu Önizleme */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200/50 h-full">
                  <CardContent className="p-4 h-full flex flex-col justify-center">
                    <h4 className="font-semibold mb-3 text-center text-sm text-gray-800">Stok Durumu</h4>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="scale-90">{stockStatus.icon}</div>
                      <span className={`text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                      
                      <div className="w-full pt-2 border-t border-gray-200 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mevcut:</span>
                          <span className="font-medium text-gray-800">{stockQuantity || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Min. Seviye:</span>
                          <span className="font-medium text-gray-800">{minStockLevel || 0}</span>
                        </div>
                        {stockThreshold > 0 && stockThreshold !== minStockLevel && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Alarm:</span>
                            <span className="font-medium text-gray-800">{stockThreshold}</span>
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
      <div className="space-y-3">
        {/* Pricing & Tax Card */}
        <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl h-[320px]">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Fiyatlandırma ve Vergi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-5 pb-5 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sol Taraf - Form Alanları */}
              <div className="lg:col-span-2 space-y-4">
                {/* Para Birimi ve Vergi Oranı */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CurrencySelect form={form} />
                  <TaxRateSelect form={form} />
                </div>

                {/* Fiyat Alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              {/* Sağ Taraf - Fiyat Önizleme */}
              <div className="lg:col-span-1 flex">
                <div className="w-full">
                  <PricePreviewCard 
                    price={price || 0}
                    taxRate={taxRate || 20}
                    currency={currency || "TRY"}
                    priceIncludesVat={priceIncludesVat || false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl h-[320px]">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Ek Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-5 pb-5 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sol Taraf - Form Alanları */}
              <div className="space-y-4">
                <SupplierSelect form={form} />
                <BarcodeInput form={form} />
                <ProductStatusSwitch form={form} />
              </div>
              
              {/* Sağ Taraf - Resim Yükleme */}
              <div>
                <ImageUploader form={form} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductCompactForm;