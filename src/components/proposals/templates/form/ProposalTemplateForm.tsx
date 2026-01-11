
import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import { ProposalTemplate } from "@/types/proposal-template";
import { ProposalFormData } from "@/types/proposal-form";
import { ProposalItem } from "@/types/proposal";
import { Button } from "@/components/ui/button";
import ProposalTemplateFormHeader from "./ProposalTemplateFormHeader";
import ProposalTemplateFormDetails from "./ProposalTemplateFormDetails";
import ProposalTemplateCustomerSelect from "./ProposalTemplateCustomerSelect";
import ProposalTemplatePaymentTerms from "./ProposalTemplatePaymentTerms";
import ProposalTemplateItems from "./ProposalTemplateItems";
import ProposalTemplateNotes from "./ProposalTemplateNotes";
import ProposalTemplateTerms from "./ProposalTemplateTerms";

interface ProposalTemplateFormProps {
  template: ProposalTemplate;
  onSaveDraft: () => void;
}

const ProposalTemplateForm: React.FC<ProposalTemplateFormProps> = ({ template, onSaveDraft }) => {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    template.prefilledFields?.validityDays 
      ? new Date(Date.now() + template.prefilledFields.validityDays * 24 * 60 * 60 * 1000) 
      : undefined
  );

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProposalFormData>({
    defaultValues: {
      title: template.prefilledFields?.title || "",
      customer_id: undefined,
      items: [],
      paymentTerm: template.prefilledFields?.paymentTerm || "prepaid",
      internalNotes: template.prefilledFields?.internalNotes || "",
      discounts: 0,
      additionalCharges: 0,
    },
  });

  useEffect(() => {
    // Initialize items from template
    if (template.items && template.items.length > 0) {
      const initialItems = template.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
      }));
      setItems(initialItems);
    }
  }, [template]);

  const onSubmit = (data: ProposalFormData) => {
    const formData = {
      ...data,
      items,
      valid_until: validUntil ? validUntil.toISOString() : undefined,
    };
    logger.debug("Form data to be submitted:", formData);
    onSaveDraft();
  };
  
  const handleItemsChange = (newItems: ProposalItem[]) => {
    setItems(newItems);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ProposalTemplateFormHeader />
      
      <ProposalTemplateFormDetails 
        register={register}
        errors={errors}
        validUntil={validUntil}
        setValidUntil={setValidUntil}
      />
      
      <ProposalTemplateCustomerSelect 
        register={register}
      />
      
      <ProposalTemplatePaymentTerms 
        defaultValue={template.prefilledFields?.paymentTerm || "prepaid"}
        setValue={setValue}
      />
      
      <ProposalTemplateItems 
        items={items}
        onItemsChange={handleItemsChange}
      />
      
      <ProposalTemplateTerms 
        register={register}
        watch={watch}
        setValue={setValue}
      />
      
      <ProposalTemplateNotes 
        register={register}
      />

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="submit" className="w-full md:w-auto">
          Taslak Olarak Kaydet
        </Button>
      </div>
    </form>
  );
};

export default ProposalTemplateForm;
