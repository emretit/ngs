
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface ProductInventorySectionProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductInventorySection = ({ form }: ProductInventorySectionProps) => {
  const stockQuantity = useWatch({
    control: form.control,
    name: "stock_quantity",
    defaultValue: 0,
  });

  const stockThreshold = useWatch({
    control: form.control,
    name: "stock_threshold",
    defaultValue: 0,
  });

  const minStockLevel = useWatch({
    control: form.control,
    name: "min_stock_level",
    defaultValue: 0,
  });

  const getStockStatus = () => {
    // Use stockThreshold as the primary threshold, fall back to minStockLevel if not set
    const thresholdToUse = stockThreshold || minStockLevel;
    
    if (stockQuantity <= 0) {
      return {
        label: "Stokta Yok",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        message: "Ürün stokta mevcut değil.",
        color: "text-destructive",
      };
    } else if (stockQuantity <= thresholdToUse) {
      return {
        label: "Düşük Stok",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        message: `Stok kritik seviyenin altında (${thresholdToUse} adet).`,
        color: "text-amber-500",
      };
    } else {
      return {
        label: "Stokta Mevcut",
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        message: `Yeterli stok mevcut (${stockQuantity} adet).`,
        color: "text-green-600",
      };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
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

        <Card className="p-6 bg-muted/50 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-center mb-6">
            Stok Durumu
          </h3>
          
          <div className="flex flex-col items-center space-y-4">
            {stockStatus.icon}
            <span className={`text-lg font-bold ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
            <p className="text-center text-muted-foreground">
              {stockStatus.message}
            </p>
            
            <div className="w-full mt-4 pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mevcut Stok:</span>
                <span className="font-medium">{stockQuantity} birim</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Minimum Seviye:</span>
                <span className="font-medium">{minStockLevel} birim</span>
              </div>
              {stockThreshold > 0 && stockThreshold !== minStockLevel && (
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">Alarm Eşiği:</span>
                  <span className="font-medium">{stockThreshold} birim</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductInventorySection;
