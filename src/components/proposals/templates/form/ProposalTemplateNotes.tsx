
import React from "react";
import { UseFormRegister } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalTemplateNotesProps {
  register: UseFormRegister<ProposalFormData>;
}

const ProposalTemplateNotes: React.FC<ProposalTemplateNotesProps> = ({
  register,
}) => {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Ek Bilgiler</h2>
      <div>
        <Label htmlFor="internal_notes">İç Notlar</Label>
        <Textarea 
          id="internal_notes" 
          {...register("internalNotes")} 
          placeholder="Şirket içi notlar"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default ProposalTemplateNotes;
