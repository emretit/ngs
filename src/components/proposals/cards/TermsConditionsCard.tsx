import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";

interface TermsConditionsCardProps {
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;
  priceTerms: string;
  otherTerms: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  selectedPaymentTerms?: string[];
  selectedDeliveryTerms?: string[];
  selectedWarrantyTerms?: string[];
  selectedPricingTerms?: string[];
  selectedOtherTerms?: string[];
  onSelectedTermsChange?: (category: string, termIds: string[]) => void;
}

const TermsConditionsCard: React.FC<TermsConditionsCardProps> = ({
  paymentTerms,
  deliveryTerms,
  warrantyTerms,
  priceTerms,
  otherTerms,
  onInputChange,
  selectedPaymentTerms = [],
  selectedDeliveryTerms = [],
  selectedWarrantyTerms = [],
  selectedPricingTerms = [],
  selectedOtherTerms = [],
  onSelectedTermsChange
}) => {
  return (
    <Card className="lg:col-span-2 shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
            <Check className="h-4 w-4 text-orange-600" />
          </div>
          Şartlar ve Koşullar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <ProposalFormTerms
          paymentTerms={paymentTerms}
          deliveryTerms={deliveryTerms}
          warrantyTerms={warrantyTerms}
          priceTerms={priceTerms}
          otherTerms={otherTerms}
          onInputChange={onInputChange}
          selectedPaymentTerms={selectedPaymentTerms}
          selectedDeliveryTerms={selectedDeliveryTerms}
          selectedWarrantyTerms={selectedWarrantyTerms}
          selectedPricingTerms={selectedPricingTerms}
          selectedOtherTerms={selectedOtherTerms}
          onSelectedTermsChange={onSelectedTermsChange}
        />
      </CardContent>
    </Card>
  );
};

export default TermsConditionsCard;
