import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormContent from "@/components/suppliers/SupplierFormContent";
import { useSupplierForm } from "@/hooks/useSupplierForm";

const SupplierForm = () => {
  const {
    id,
    formData,
    setFormData,
    isLoadingSupplier,
    supplierError,
    mutation,
    handleSubmit,
    navigate
  } = useSupplierForm();

  if (supplierError) {
    return null;
  }

  // For edit mode, show loading if supplier data hasn't loaded yet (name is empty means data not loaded)
  const isEditMode = !!id;
  const isDataLoading = isEditMode && isLoadingSupplier;
  const isWaitingForData = isEditMode && !isLoadingSupplier && !formData.name && !formData.company;

  return (
    <div>
      <SupplierFormHeader 
        id={id} 
        isPending={mutation.isPending}
        onCancel={() => navigate('/suppliers')}
      />
      {(isDataLoading || isWaitingForData) ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Tedarikçi bilgileri yükleniyor...</span>
          </div>
        </div>
      ) : (
        <SupplierFormContent
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isPending={mutation.isPending}
          isEdit={isEditMode}
          onCancel={() => navigate('/suppliers')}
        />
      )}
    </div>
  );
};

export default SupplierForm;