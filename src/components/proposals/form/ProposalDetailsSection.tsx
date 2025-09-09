
import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ProposalDetailsSection = () => {
  const { register, setValue, watch } = useFormContext();
  
  const proposalDate = watch("proposalDate");
  const expirationDate = watch("expirationDate");
  const proposalNumber = watch("proposalNumber");
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-base font-medium">Teklif Başlığı</Label>
        <Input
          id="title"
          {...register("title", { required: true })}
          placeholder="Teklif başlığını girin"
          className="mt-1"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="proposalNumber" className="text-base font-medium">Teklif Numarası</Label>
          <Input
            id="proposalNumber"
            value={proposalNumber ? `TEK-${proposalNumber}` : "Otomatik Oluşturulacak"}
            disabled
            className="mt-1 bg-muted"
          />
        </div>
        
        <div>
          <Label className="text-base font-medium">Teklif Tarihi</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !proposalDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {proposalDate ? format(proposalDate, "PPP", { locale: tr }) : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={proposalDate}
                onSelect={(date) => setValue("proposalDate", date)}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-base font-medium">Son Geçerlilik Tarihi</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !expirationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expirationDate ? format(expirationDate, "PPP", { locale: tr }) : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expirationDate}
                onSelect={(date) => setValue("expirationDate", date)}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label htmlFor="paymentTerm" className="text-base font-medium">Ödeme Koşulları</Label>
          <Select 
            defaultValue={watch("paymentTerm")} 
            onValueChange={(value) => setValue("paymentTerm", value)}
          >
            <SelectTrigger id="paymentTerm" className="mt-1">
              <SelectValue placeholder="Ödeme koşulu seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prepaid">Peşin Ödeme</SelectItem>
              <SelectItem value="net15">15 Gün Vade</SelectItem>
              <SelectItem value="net30">30 Gün Vade</SelectItem>
              <SelectItem value="net60">60 Gün Vade</SelectItem>
              <SelectItem value="custom">Özel Vade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="internalNotes" className="text-base font-medium">Notlar</Label>
        <Textarea
          id="internalNotes"
          {...register("internalNotes")}
          placeholder="Teklif ile ilgili notlar (sadece dahili olarak görüntülenir)"
          className="mt-1 min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default ProposalDetailsSection;
