
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import SupplierSelect from "./SupplierSelect";
import BarcodeInput from "./BarcodeInput";
import ProductStatusSwitch from "./ProductStatusSwitch";
import ImageUploader from "./ImageUploader";
import MaxStockLevelInput from "./MaxStockLevelInput";
import WeightInput from "./WeightInput";
import DimensionsInput from "./DimensionsInput";
import WarrantyPeriodInput from "./WarrantyPeriodInput";
import TagsInput from "./TagsInput";
import VatIncludedSwitch from "./VatIncludedSwitch";

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
          <VatIncludedSwitch form={form} />
        </div>

        <div className="space-y-6">
          <ImageUploader form={form} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <MaxStockLevelInput form={form} />
          <WeightInput form={form} />
          <DimensionsInput form={form} />
        </div>

        <div className="space-y-6">
          <WarrantyPeriodInput form={form} />
          <TagsInput form={form} />
        </div>
      </div>
    </div>
  );
};

export default ProductSupplierSection;
