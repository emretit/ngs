
import React from "react";
import { UseFormRegister } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalFormData } from "@/types/proposal-form";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";

interface ProposalTemplateCustomerSelectProps {
  register: UseFormRegister<ProposalFormData>;
}

const ProposalTemplateCustomerSelect: React.FC<ProposalTemplateCustomerSelectProps> = ({
  register,
}) => {
  const { customers } = useCustomerSelect();

  return (
    <div>
      <Label htmlFor="customer_id">Müşteri</Label>
      <Select onValueChange={(value) => register("customer_id").onChange({ target: { value } })}>
        <SelectTrigger id="customer_id">
          <SelectValue placeholder="Müşteri seçin" />
        </SelectTrigger>
        <SelectContent>
          {customers?.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name} {customer.company ? `(${customer.company})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProposalTemplateCustomerSelect;
