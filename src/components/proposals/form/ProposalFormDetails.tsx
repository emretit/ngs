
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalFormDetailsProps {
  formData: Pick<ProposalFormData, 'description' | 'payment_terms' | 'delivery_terms' | 'notes'>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ProposalFormDetails = ({
  formData,
  handleInputChange,
}: ProposalFormDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea 
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          placeholder="Teklif açıklaması girin"
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Ödeme Şartları</Label>
          <Textarea 
            id="payment_terms"
            name="payment_terms"
            value={formData.payment_terms || ""}
            onChange={handleInputChange}
            placeholder="Ödeme şartlarını belirtin"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="delivery_terms">Teslimat Şartları</Label>
          <Textarea 
            id="delivery_terms"
            name="delivery_terms"
            value={formData.delivery_terms || ""}
            onChange={handleInputChange}
            placeholder="Teslimat şartlarını belirtin"
            rows={3}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea 
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleInputChange}
          placeholder="Ek notlar girin"
          rows={4}
        />
      </div>
    </div>
  );
};

export default ProposalFormDetails;
