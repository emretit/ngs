
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import PriceInput from "./pricing/PriceInput";
import TaxRateSelect from "./pricing/TaxRateSelect";
import CurrencySelect from "./pricing/CurrencySelect";
import PricePreviewCard from "./pricing/PricePreviewCard";

interface ProductPricingSectionProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductPricingSection = ({ form }: ProductPricingSectionProps) => {
  const price = useWatch({
    control: form.control,
    name: "price",
    defaultValue: 0,
  });

  const priceIncludesVat = useWatch({
    control: form.control,
    name: "price_includes_vat",
    defaultValue: false,
  });



  const taxRate = useWatch({
    control: form.control,
    name: "tax_rate",
    defaultValue: 20,
  });

  const currency = useWatch({
    control: form.control,
    name: "currency",
    defaultValue: "TRY",
  });
  
  const purchasePrice = useWatch({
    control: form.control,
    name: "purchase_price",
    defaultValue: undefined,
  });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CurrencySelect form={form} />
          
          <PriceInput 
            form={form} 
            name="price" 
            label="Satış Fiyatı" 
            isRequired={true} 
            showVatToggle={true}
          />


          
          <PriceInput 
            form={form} 
            name="purchase_price" 
            label="Alış Fiyatı" 
            description="Ürünün alış fiyatı (isteğe bağlı)" 
            showVatToggle={true}
          />

          <TaxRateSelect form={form} />
        </div>

        <PricePreviewCard 
          price={price} 
          taxRate={taxRate} 
          currency={currency}
          priceIncludesVat={priceIncludesVat}
        />
      </div>
    </div>
  );
};

export default ProductPricingSection;
