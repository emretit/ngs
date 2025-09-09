
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { ProposalStatus, proposalStatusLabels } from "@/types/proposal";
import { ProposalFormData } from "@/types/proposal-form";

interface ProposalFormBasicInfoProps {
  formData: Pick<ProposalFormData, 'title' | 'status' | 'valid_until'>;
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
        <Label htmlFor="status">Durum</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => handleSelectChange("status", value as ProposalStatus)}
        >
          <SelectTrigger>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-full justify-start text-left font-normal ${
                formErrors.valid_until ? "border-red-500 text-red-500" : ""
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.valid_until ? formatDate(formData.valid_until) : "Tarih seçin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.valid_until ? new Date(formData.valid_until) : undefined}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {formErrors.valid_until && (
          <p className="text-red-500 text-sm mt-1">{formErrors.valid_until}</p>
        )}
      </div>
    </div>
  );
};

export default ProposalFormBasicInfo;
