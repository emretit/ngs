import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";

interface TermsConditionsCardProps {
  paymentTerms: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  priceTerms?: string;
  otherTerms?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  selectedPaymentTerms?: string[];
  selectedDeliveryTerms?: string[];
  selectedWarrantyTerms?: string[];
  selectedPricingTerms?: string[];
  selectedOtherTerms?: string[];
  onSelectedTermsChange?: (category: string, termIds: string[]) => void;
  // Invoice mode props
  invoiceMode?: boolean;
  aciklama?: string;
  notlar?: string;
  banka_bilgileri?: string;
  onFieldChange?: (field: string, value: any) => void;
}

const TermsConditionsCard: React.FC<TermsConditionsCardProps> = ({
  paymentTerms,
  deliveryTerms = "",
  warrantyTerms = "",
  priceTerms = "",
  otherTerms = "",
  onInputChange,
  selectedPaymentTerms = [],
  selectedDeliveryTerms = [],
  selectedWarrantyTerms = [],
  selectedPricingTerms = [],
  selectedOtherTerms = [],
  onSelectedTermsChange,
  invoiceMode = false,
  aciklama = "",
  notlar = "",
  banka_bilgileri = "",
  onFieldChange
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
        {invoiceMode ? (
          <div className="space-y-4">
            {/* Açıklama */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Açıklama</Label>
              <Textarea
                value={aciklama || ""}
                onChange={(e) => onFieldChange?.("aciklama", e.target.value)}
                placeholder="Fatura açıklaması..."
                className="mt-1.5 resize-none h-20 text-sm"
              />
            </div>

            {/* Ödeme Şartları ve Ödeme Şekli - ProposalFormTerms içinde birleştirildi */}
            <ProposalFormTerms
              paymentTerms={paymentTerms}
              deliveryTerms=""
              warrantyTerms=""
              priceTerms=""
              otherTerms=""
              onInputChange={onInputChange}
              selectedPaymentTerms={selectedPaymentTerms}
              selectedDeliveryTerms={[]}
              selectedWarrantyTerms={[]}
              selectedPricingTerms={[]}
              selectedOtherTerms={[]}
              onSelectedTermsChange={onSelectedTermsChange}
              showOnlyPayment={true}
            />

            {/* Notlar ve Banka Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <Label className="text-sm font-medium text-gray-700">Notlar</Label>
                <Textarea
                  value={notlar || ""}
                  onChange={(e) => onFieldChange?.("notlar", e.target.value)}
                  placeholder="Ek notlar..."
                  className="mt-1.5 resize-none h-20 text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Banka Bilgileri</Label>
                <Textarea
                  value={banka_bilgileri || ""}
                  onChange={(e) => onFieldChange?.("banka_bilgileri", e.target.value)}
                  placeholder="Banka adı, IBAN..."
                  className="mt-1.5 resize-none h-20 text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};

export default TermsConditionsCard;
