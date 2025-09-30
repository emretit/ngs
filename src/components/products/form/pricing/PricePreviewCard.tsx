
import { Card } from "@/components/ui/card";
import { formatPrice, calculateTax } from "../../utils/priceUtils";

interface PricePreviewCardProps {
  price: number;
  taxRate: number;
  currency: string;
  priceIncludesVat?: boolean;
}

const PricePreviewCard = ({ 
  price, 
  taxRate, 
  currency,
  priceIncludesVat = false
}: PricePreviewCardProps) => {
  // KDV dahil/hariç hesaplama mantığı
  const calculatePrices = () => {
    if (priceIncludesVat) {
      // Girilen fiyat KDV dahil ise, KDV hariç fiyatı hesapla
      const priceExcludingVat = price / (1 + taxRate / 100);
      const vatAmount = price - priceExcludingVat;
      return {
        priceExcludingVat,
        vatAmount,
        priceIncludingVat: price
      };
    } else {
      // Girilen fiyat KDV hariç ise, KDV dahil fiyatı hesapla
      const vatAmount = calculateTax(price, taxRate);
      return {
        priceExcludingVat: price,
        vatAmount,
        priceIncludingVat: price + vatAmount
      };
    }
  };

  const { priceExcludingVat, vatAmount, priceIncludingVat } = calculatePrices();

  return (
    <Card className="p-6 bg-muted/50 h-full flex flex-col justify-center space-y-6">
      <h3 className="text-sm font-semibold text-center mb-2">
        Fiyat Önizleme
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {priceIncludesVat ? "KDV Hariç Fiyat:" : "Satış Fiyatı:"}
          </span>
          <span className="font-medium">
            {formatPrice(priceExcludingVat, currency)}
          </span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">KDV Tutarı:</span>
          <span className="font-medium">
            {formatPrice(vatAmount, currency)}
          </span>
        </div>
        
        <div className="flex justify-between pt-2 border-t border-border text-xs">
          <span className="font-medium">
            {priceIncludesVat ? "Satış Fiyatı:" : "KDV Dahil Fiyat:"}
          </span>
          <span className="font-bold">
            {formatPrice(priceIncludingVat, currency)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PricePreviewCard;
