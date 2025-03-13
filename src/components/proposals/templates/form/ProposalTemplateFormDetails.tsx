
import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      
      <div>
        <Label htmlFor="valid_until">Geçerlilik Tarihi</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left font-normal"
            >
              {validUntil ? (
                format(validUntil, "PPP", { locale: tr })
              ) : (
                <span className="text-gray-500">Tarih seçin</span>
              )}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={validUntil}
              onSelect={(date) => setValidUntil(date)}
              disabled={(date) => date < new Date()}
              initialFocus
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ProposalTemplateFormDetails;
