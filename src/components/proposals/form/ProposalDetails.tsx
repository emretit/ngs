
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalDetailsProps {
  title: string;
  onTitleChange: (value: string) => void;
  proposalDate: Date;
  onProposalDateChange: (date: Date | undefined) => void;
  expirationDate: Date | null;
  onExpirationDateChange: (date: Date | null) => void;
  status: string;
  onStatusChange: (value: string) => void;
  className?: string;
}

const ProposalDetails = ({
  title,
  onTitleChange,
  proposalDate,
  onProposalDateChange,
  expirationDate,
  onExpirationDateChange,
  status,
  onStatusChange,
  className,
}: ProposalDetailsProps) => {
  const [isProposalDateOpen, setIsProposalDateOpen] = useState(false);
  const [isExpirationDateOpen, setIsExpirationDateOpen] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="title">Teklif Başlığı</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Teklif başlığını girin"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Teklif Tarihi</Label>
          <Popover open={isProposalDateOpen} onOpenChange={setIsProposalDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !proposalDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {proposalDate ? format(proposalDate, "PPP") : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={proposalDate}
                onSelect={onProposalDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Geçerlilik Tarihi</Label>
          <Popover
            open={isExpirationDateOpen}
            onOpenChange={setIsExpirationDateOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expirationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expirationDate ? format(expirationDate, "PPP") : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expirationDate}
                onSelect={onExpirationDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Durum</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="new">Yeni</SelectItem>
              <SelectItem value="review">İncelemede</SelectItem>
              <SelectItem value="negotiation">Görüşme</SelectItem>
              <SelectItem value="accepted">Onaylandı</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
