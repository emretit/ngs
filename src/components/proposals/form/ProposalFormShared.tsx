
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { Skeleton } from "@/components/ui/skeleton";
import ProposalFormHeader from "./ProposalFormHeader";
import ProposalFormBasicInfo from "./ProposalFormBasicInfo";
import ProposalFormCustomerInfo from "./ProposalFormCustomerInfo";
import ProposalFormDetails from "./ProposalFormDetails";
import ProposalFormActions from "./ProposalFormActions";

interface ProposalFormSharedProps {
  proposal: Proposal | null;
  loading: boolean;
  saving: boolean;
  isNew: boolean;
  onSave: (formData: any) => Promise<void>;
  onBack: () => void;
  title: string; // Adding the missing title prop
}

const ProposalFormShared = ({
  proposal,
  loading,
  saving,
  isNew,
  onSave,
  onBack,
  title,
}: ProposalFormSharedProps) => {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    valid_until: "",
    payment_terms: "",
    delivery_terms: "",
    warranty_terms: "",
    price_terms: "",
    other_terms: "",
    notes: "",
    status: "draft" as ProposalStatus
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    if (proposal && !isNew) {
      // Initialize form with proposal data for edit mode
      setFormData({
        title: proposal.title || "",
        description: proposal.description || "",
        valid_until: proposal.valid_until || "",
        payment_terms: proposal.payment_terms || "",
        delivery_terms: proposal.delivery_terms || "",
        warranty_terms: proposal.warranty_terms || "",
        price_terms: proposal.price_terms || "",
        other_terms: proposal.other_terms || "",
        notes: proposal.notes || "",
        status: proposal.status
      });
    }
  }, [proposal, isNew]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Teklif başlığı gereklidir";
    }
    
    if (!formData.valid_until) {
      errors.valid_until = "Geçerlilik tarihi gereklidir";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsFormDirty(true);
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsFormDirty(true);
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        valid_until: date.toISOString()
      }));
      setIsFormDirty(true);
      
      // Clear error when field is edited
      if (formErrors.valid_until) {
        setFormErrors(prev => ({
          ...prev,
          valid_until: ""
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }
    
    await onSave(formData);
    setIsFormDirty(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      return "";
    }
  };

  return (
    <>
      <ProposalFormHeader 
        title={title}
        loading={loading}
        saving={saving}
        isNew={isNew}
        proposal={proposal}
        subtitle="Teklif bilgilerini düzenleyin"
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProposalFormBasicInfo 
              formData={formData}
              formErrors={formErrors}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              handleDateChange={handleDateChange}
              formatDate={formatDate}
            />
            
            <ProposalFormCustomerInfo 
              proposal={proposal}
              isNew={isNew}
            />
          </div>
          
          <ProposalFormDetails 
            formData={formData}
            handleInputChange={handleInputChange}
          />
          
          <ProposalFormActions 
            isNew={isNew}
            saving={saving}
            onSave={handleSave}
            onBack={onBack}
            isFormDirty={isFormDirty}
          />
        </div>
      )}
    </>
  );
};

export default ProposalFormShared;
