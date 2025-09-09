
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentTerm, ProposalFormData } from "@/types/proposal-form";
import { UseFormSetValue } from "react-hook-form";

interface ProposalTemplatePaymentTermsProps {
  defaultValue: string;
  setValue: UseFormSetValue<ProposalFormData>;
}

const ProposalTemplatePaymentTerms: React.FC<ProposalTemplatePaymentTermsProps> = ({
  defaultValue,
  setValue,
}) => {
  return (
    <div>
      <Label htmlFor="payment_term">Ödeme Koşulları</Label>
      <Select 
        onValueChange={(value: PaymentTerm) => setValue("paymentTerm", value)}
        defaultValue={defaultValue}
      >
        <SelectTrigger id="payment_term">
          <SelectValue placeholder="Ödeme koşulu seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="prepaid">Peşin</SelectItem>
          <SelectItem value="net30">30 Gün</SelectItem>
          <SelectItem value="net60">60 Gün</SelectItem>
          <SelectItem value="custom">Özel</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProposalTemplatePaymentTerms;
