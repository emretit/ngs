import SupplierFormFields from "./SupplierFormFields";
import { SupplierFormData } from "@/types/supplier";

interface SupplierFormContentProps {
  formData: SupplierFormData;
  setFormData: (data: SupplierFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

const SupplierFormContent = ({
  formData,
  setFormData,
  handleSubmit,
  isPending,
  isEdit,
  onCancel
}: SupplierFormContentProps) => {
  return (
    <div className="w-full">
      <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
        <SupplierFormFields formData={formData} setFormData={setFormData} isEdit={isEdit} />
      </form>
    </div>
  );
};

export default SupplierFormContent;
