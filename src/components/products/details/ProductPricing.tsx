
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit2, Check, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import ExchangeRateInfo from "./ExchangeRateInfo";
import { getCurrentExchangeRates } from "@/components/proposals/form/items/utils/currencyUtils";
import { Tooltip } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ProductPricingProps {
  price: number;
  currency: string;
  taxRate: number;
  purchasePrice?: number | null;
  exchangeRate?: number;
  onUpdate: (updates: {
    price?: number;
    tax_rate?: number;
    currency?: string;
    exchange_rate?: number;
    purchase_price?: number | null;
  }) => void;
}

const ProductPricing = ({ 
  price, 
  currency,
  taxRate,
  purchasePrice,
  exchangeRate,
  onUpdate 
}: ProductPricingProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [editValues, setEditValues] = useState({
    price,
    taxRate,
    currency,
    purchasePrice: purchasePrice || null,
    exchangeRate: exchangeRate
  });

  // Update edit values when props change
  useEffect(() => {
    if (!isEditing) {
      setEditValues({
        price,
        taxRate,
        currency,
        purchasePrice: purchasePrice || null,
        exchangeRate: exchangeRate
      });
    }
  }, [price, taxRate, currency, purchasePrice, exchangeRate, isEditing]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };



  const handleCurrencyChange = (newCurrency: string) => {
    setEditValues(prev => {
      // Get current exchange rates
      const rates = getCurrentExchangeRates();
      const newExchangeRate = newCurrency === "TRY" ? undefined : rates[newCurrency];
      
      // Show currency change alert
      if (prev.currency !== newCurrency) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
      
      return {
        ...prev,
        currency: newCurrency,
        exchangeRate: newExchangeRate
      };
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Check for valid values
    if (editValues.price < 0) {
      toast.error("Fiyat 0'dan küçük olamaz");
      setIsSaving(false);
      return;
    }

    // Get exchange rates if needed
    const rates = getCurrentExchangeRates();
    
    // If currency changed, calculate and include the exchange rate
    const updateData: any = {
      price: Number(editValues.price),
      tax_rate: Number(editValues.taxRate),
      currency: editValues.currency,
      purchase_price: editValues.purchasePrice ? Number(editValues.purchasePrice) : null
    };

    // Include exchange rate if not TRY
    if (editValues.currency !== "TRY") {
      updateData.exchange_rate = rates[editValues.currency] || 1;
    } else {
      updateData.exchange_rate = undefined;
    }

    onUpdate(updateData);
    setIsEditing(false);
    setIsSaving(false);
    toast.success("Fiyat bilgileri güncellendi");
  };

  const currencyOptions = [
    { value: "TRY", label: "Türk Lirası (TRY)" },
    { value: "USD", label: "Amerikan Doları (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "İngiliz Sterlini (GBP)" }
  ];
  
  return (
    <Card className="overflow-hidden">
      {showAlert && (
        <Alert variant="default" className="border-orange-300 bg-orange-50 p-3 mt-0 rounded-none">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-sm text-orange-700">
            Para birimi değiştirildiğinde, döviz kuru otomatik olarak güncellenecektir.
          </AlertDescription>
        </Alert>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fiyat Bilgileri
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Satış Fiyatı</span>
            {isEditing ? (
              <Input
                type="number"
                value={editValues.price}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  price: e.target.valueAsNumber || 0
                }))}
                className="w-32 text-right"
              />
            ) : (
              <span className="text-lg font-medium">{formatPrice(price)}</span>
            )}
          </div>



          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Alış Fiyatı</span>
            {isEditing ? (
              <Input
                type="number"
                value={editValues.purchasePrice || ''}
                onChange={(e) => setEditValues(prev => ({
                  ...prev,
                  purchasePrice: e.target.value ? e.target.valueAsNumber : null
                }))}
                className="w-32 text-right"
              />
            ) : purchasePrice ? (
              <span className="text-lg font-medium">{formatPrice(purchasePrice)}</span>
            ) : (
              <span>-</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">KDV Oranı</span>
            {isEditing ? (
              <Select 
                value={String(editValues.taxRate)}
                onValueChange={(value) => setEditValues(prev => ({
                  ...prev,
                  taxRate: parseInt(value)
                }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="KDV Oranı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">%20</SelectItem>
                  <SelectItem value="18">%18</SelectItem>
                  <SelectItem value="10">%10</SelectItem>
                  <SelectItem value="8">%8</SelectItem>
                  <SelectItem value="1">%1</SelectItem>
                  <SelectItem value="0">%0</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span>%{taxRate}</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Para Birimi</span>
              {!isEditing && currency !== "TRY" && (
                <ExchangeRateInfo currency={currency} />
              )}
            </div>
            {isEditing ? (
              <div className="flex flex-col items-end">
                <Select
                  value={editValues.currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Para birimi seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editValues.currency !== "TRY" && (
                  <ExchangeRateInfo currency={editValues.currency} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  {currency}
                </Badge>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditValues({ 
                    price, 
                    taxRate, 
                    currency,
                    purchasePrice: purchasePrice || null,
                    exchangeRate
                  });
                  setIsEditing(false);
                  setShowAlert(false);
                }}
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" /> İptal
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" /> Kaydet
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPricing;
