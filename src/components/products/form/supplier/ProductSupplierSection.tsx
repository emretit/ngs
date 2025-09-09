
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import SupplierSelect from "./SupplierSelect";
import BarcodeInput from "./BarcodeInput";
import ProductStatusSwitch from "./ProductStatusSwitch";
import ImageUploader from "./ImageUploader";

interface ProductSupplierSectionProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductSupplierSection = ({ form }: ProductSupplierSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SupplierSelect form={form} />
          <BarcodeInput form={form} />
          <ProductStatusSwitch form={form} />
        </div>

        <ImageUploader form={form} />
      </div>
    </div>
  );
};

export default ProductSupplierSection;
