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
import { AlertCircle, CheckCircle, AlertTriangle, Package, DollarSign, Archive, Settings, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import CurrencySelect from "./pricing/CurrencySelect";
import PriceInput from "./pricing/PriceInput";
import TaxRateSelect from "./pricing/TaxRateSelect";
import PricePreviewCard from "./pricing/PricePreviewCard";
import SupplierSelect from "./supplier/SupplierSelect";
import BarcodeInput from "./supplier/BarcodeInput";
import ProductStatusSwitch from "./supplier/ProductStatusSwitch";
import ImageUploader from "./supplier/ImageUploader";
import CategorySelect from "./CategorySelect";
import MaxStockLevelInput from "./supplier/MaxStockLevelInput";
import WeightInput from "./supplier/WeightInput";
import DimensionsInput from "./supplier/DimensionsInput";
import WarrantyPeriodInput from "./supplier/WarrantyPeriodInput";
import TagsInput from "./supplier/TagsInput";

interface ProductCompactFormProps {
  form: UseFormReturn<ProductFormSchema>;
  onSubmit: (values: any, addAnother?: boolean) => Promise<{ resetForm: boolean }>;
  isSubmitting: boolean;
  isEditing: boolean;
  productId?: string;
  onDuplicate: () => void;
}

const ProductCompactForm = ({ 
  form, 
  onSubmit, 
  isSubmitting, 
  isEditing, 
  productId, 
  onDuplicate 
}: ProductCompactFormProps) => {
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
    <div className="w-full space-y-4">
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
      
      {/* Top Row - Basic Info & Stock Management */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Basic Information Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                Temel Bilgiler
              </CardTitle>
              <div className="ml-4">
                <ProductStatusSwitch form={form} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
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
                      className="h-7 text-xs" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* SKU ve Kategori - Yan Yana */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">SKU (Stok Kodu)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SKU giriniz" 
                        className="h-7 text-xs" 
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
                      className="resize-none min-h-[80px] text-xs"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

          {/* Etiketler - Temel Bilgiler'e taşındı */}
          <TagsInput form={form} />

            
          </CardContent>
        </Card>

        {/* Stock Management Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                <Archive className="h-4 w-4 text-green-600" />
              </div>
              Stok Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Stock Quantity and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Başlangıç Stok Miktarı *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        className="h-7 text-xs" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Adet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="adet">Adet</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="m">Metre</SelectItem>
                        <SelectItem value="m2">Metrekare</SelectItem>
                        <SelectItem value="m3">Metreküp</SelectItem>
                        <SelectItem value="lt">Litre</SelectItem>
                        <SelectItem value="paket">Paket</SelectItem>
                        <SelectItem value="kutu">Kutu</SelectItem>
                        <SelectItem value="saat">Saat</SelectItem>
                        <SelectItem value="gün">Gün</SelectItem>
                        <SelectItem value="hafta">Hafta</SelectItem>
                        <SelectItem value="ay">Ay</SelectItem>
                      </SelectContent>
                    </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

            {/* Min Stock Level and Threshold */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="min_stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Minimum Stok Seviyesi *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        className="h-7 text-xs" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
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
                        placeholder="0" 
                        className="h-7 text-xs" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Özel bir alarm eşiği belirleyin
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Max Stock Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MaxStockLevelInput form={form} />
            </div>

            {/* Stock Status Display */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Stok Durumu</h4>
              <div className="flex items-center gap-2">
                {stockStatus.icon}
                <span className="text-sm font-medium">{stockStatus.label}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Mevcut:</span> {stockQuantity || 0}
                </div>
                <div>
                  <span className="font-medium">Min. Seviye:</span> {minStockLevel || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Pricing & Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pricing Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              Fiyatlandırma ve Vergi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Currency and Tax Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CurrencySelect form={form} />
              <TaxRateSelect form={form} />
            </div>

            {/* Price Inputs - compact two-column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Price Preview */}
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Fiyat Önizleme</h4>
              <PricePreviewCard 
                price={price || 0}
                taxRate={taxRate || 20}
                currency={currency || "TRY"}
                priceIncludesVat={priceIncludesVat || false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                <Settings className="h-4 w-4 text-purple-600" />
              </div>
              Ek Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Row 1: Image (left) + Physical Attributes (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ImageUploader form={form} compact />
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-700">Fiziksel Özellikler</h4>
                <div className="space-y-3">
                  <WeightInput form={form} />
                  <DimensionsInput form={form} />
                  <WarrantyPeriodInput form={form} />
                </div>
              </div>
            </div>

            {/* Row 2: Supplier + Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SupplierSelect form={form} />
              <BarcodeInput form={form} />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Duplicate Button - Only show in edit mode */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDuplicate}
            className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
          >
            <Copy className="h-4 w-4" />
            <span className="font-medium">Kopyala</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductCompactForm;