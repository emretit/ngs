
import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalTemplateFormDetailsProps {
  register: UseFormRegister<ProposalFormData>;
  errors: FieldErrors<ProposalFormData>;
  validUntil: Date | undefined;
  setValidUntil: (date: Date | undefined) => void;
}

const ProposalTemplateFormDetails: React.FC<ProposalTemplateFormDetailsProps> = ({
  register,
  errors,
  validUntil,
  setValidUntil,
}) => {
  const generateProposalNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKL${year}${month}${day}${random}`;
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="proposal_number">Teklif Numarası</Label>
          <Input 
            id="proposal_number"
            defaultValue={generateProposalNumber()}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div>
          <Label htmlFor="title">Teklif Başlığı</Label>
          <Input 
            id="title" 
            {...register("title", { required: "Teklif başlığı gereklidir" })} 
            placeholder="Teklif başlığını girin"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="proposal_date">Teklif Tarihi</Label>
          <Input 
            id="proposal_date"
            value={format(new Date(), "dd.MM.yyyy", { locale: tr })}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div>
          <Label htmlFor="valid_until">Geçerlilik Tarihi</Label>
          <EnhancedDatePicker
            date={validUntil}
            onSelect={setValidUntil}
            placeholder="Tarih seçin"
            disabled={(date) => date < new Date()}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ProposalTemplateFormDetails;
