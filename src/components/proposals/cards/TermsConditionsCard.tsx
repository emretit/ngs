import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";

interface TermsConditionsCardProps {
  data: {
    payment_terms?: string;
    delivery_terms?: string;
    warranty_terms?: string;
    price_terms?: string;
    other_terms?: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const TermsConditionsCard: React.FC<TermsConditionsCardProps> = ({
  data,
  onChange,
  errors = {}
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
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
          paymentTerms={data.payment_terms}
          deliveryTerms={data.delivery_terms}
          warrantyTerms={data.warranty_terms}
          priceTerms={data.price_terms}
          otherTerms={data.other_terms}
          onInputChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
};

export default TermsConditionsCard;
