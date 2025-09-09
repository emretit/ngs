
import React from "react";
import { Building, User, CreditCard } from "lucide-react";
import { Proposal } from "@/types/proposal";
import { formatCurrency } from "@/components/products/utils/priceUtils";

interface ProposalFormCustomerInfoProps {
  proposal: Proposal | null;
  isNew: boolean;
}

const ProposalFormCustomerInfo = ({ proposal, isNew }: ProposalFormCustomerInfoProps) => {
  if (isNew) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            Teklif oluşturulduktan sonra müşteri ve ürün bilgileri burada görüntülenecek.
          </p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="text-sm text-muted-foreground flex items-center mb-2">
          <Building className="h-4 w-4 mr-2" />
          Müşteri
        </div>
        <div className="font-medium">
          {proposal.customer?.name || proposal.customer_name || "Müşteri belirtilmemiş"}
        </div>
        
        {proposal.customer?.company && (
          <div className="text-sm text-muted-foreground">
            {proposal.customer.company}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="text-sm text-muted-foreground flex items-center mb-2">
          <User className="h-4 w-4 mr-2" />
          Satış Temsilcisi
        </div>
        <div className="font-medium">
          {proposal.employee 
            ? `${proposal.employee.first_name} ${proposal.employee.last_name}` 
            : proposal.employee_name || "Belirtilmemiş"}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="text-sm text-muted-foreground flex items-center mb-2">
          <CreditCard className="h-4 w-4 mr-2" />
          Toplam Tutar
        </div>
        <div className="font-medium text-lg">
          {formatCurrency(proposal.total_amount || 0, proposal.currency || "TRY")}
        </div>
      </div>
    </div>
  );
};

export default ProposalFormCustomerInfo;
