
import { Form } from "@/components/ui/form";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import ProductGeneralSection from "./ProductGeneralSection";
import ProductPricingSection from "./ProductPricingSection";
import ProductInventorySection from "./ProductInventorySection";
import ProductSupplierSection from "./supplier/ProductSupplierSection";

interface ProductFormTabsProps {
  form: UseFormReturn<ProductFormSchema>;
  onSubmit: (values: ProductFormSchema, addAnother: boolean) => Promise<{ resetForm: boolean }>;
}

const ProductFormTabs = ({ form, onSubmit }: ProductFormTabsProps) => {
  // Handle form submission with only the values parameter
  const handleSubmit = (values: ProductFormSchema) => {
    return onSubmit(values, false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CustomTabs defaultValue="general" className="w-full">
          <CustomTabsList className="grid grid-cols-4 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
            <CustomTabsTrigger value="general" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Genel Bilgiler</CustomTabsTrigger>
            <CustomTabsTrigger value="pricing" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Fiyatlandırma</CustomTabsTrigger>
            <CustomTabsTrigger value="inventory" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Stok</CustomTabsTrigger>
            <CustomTabsTrigger value="additional" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Ek Bilgiler</CustomTabsTrigger>
          </CustomTabsList>
          
          <CustomTabsContent value="general">
            <ProductGeneralSection form={form} />
          </CustomTabsContent>
          
          <CustomTabsContent value="pricing">
            <ProductPricingSection form={form} />
          </CustomTabsContent>
          
          <CustomTabsContent value="inventory">
            <ProductInventorySection form={form} />
          </CustomTabsContent>
          
          <CustomTabsContent value="additional">
            <ProductSupplierSection form={form} />
          </CustomTabsContent>
        </CustomTabs>
      </form>
    </Form>
  );
};

export default ProductFormTabs;
