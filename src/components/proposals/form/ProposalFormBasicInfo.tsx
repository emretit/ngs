
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { ProposalStatus, proposalStatusLabels } from "@/types/proposal";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalFormBasicInfoProps {
  formData: Pick<ProposalFormData, 'title' | 'subject' | 'status' | 'valid_until'>;
  formErrors: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDateChange: (date: Date | undefined) => void;
  formatDate: (dateString?: string | null) => string;
}

const ProposalFormBasicInfo = ({
  formData,
  formErrors,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  formatDate,
}: ProposalFormBasicInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className={formErrors.title ? "text-red-500" : ""}>
          Teklif Başlığı <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Teklif başlığını girin"
          className={formErrors.title ? "border-red-500 focus:ring-red-500" : ""}
        />
        {formErrors.title && (
          <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Teklif Konusu</Label>
        <Input 
          id="subject"
          name="subject"
          value={formData.subject || ""}
          onChange={handleInputChange}
          placeholder="Teklif konusunu girin"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Durum</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => handleSelectChange("status", value as ProposalStatus)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{proposalStatusLabels.draft}</SelectItem>
            <SelectItem value="pending_approval">{proposalStatusLabels.pending_approval}</SelectItem>
            <SelectItem value="sent">{proposalStatusLabels.sent}</SelectItem>
            <SelectItem value="accepted">{proposalStatusLabels.accepted}</SelectItem>
            <SelectItem value="rejected">{proposalStatusLabels.rejected}</SelectItem>
            <SelectItem value="expired">{proposalStatusLabels.expired}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="valid_until" className={formErrors.valid_until ? "text-red-500" : ""}>
          Geçerlilik Tarihi <span className="text-red-500">*</span>
        </Label>
        <EnhancedDatePicker
          date={formData.valid_until ? new Date(formData.valid_until) : undefined}
          onSelect={handleDateChange}
          placeholder="Tarih seçin"
          className={`w-full ${
            formErrors.valid_until ? "border-red-500" : ""
          }`}
        />
        {formErrors.valid_until && (
          <p className="text-red-500 text-sm mt-1">{formErrors.valid_until}</p>
        )}
      </div>
    </div>
  );
};

export default ProposalFormBasicInfo;
