import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, ArrowRight, AlertCircle, Info, Users, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import CustomerSelector from "../CustomerSelector";
import EmployeeSelector from "../EmployeeSelector";

interface ProposalBasicInfoTabProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  validationErrors: Record<string, string[]>;
  onNext: () => void;
}

const ProposalBasicInfoTab: React.FC<ProposalBasicInfoTabProps> = ({
  formData,
  onFieldChange,
  validationErrors,
  onNext
}) => {
  const [validUntilOpen, setValidUntilOpen] = useState(false);

  const handleValidUntilChange = (date: Date | undefined) => {
    if (date) {
      onFieldChange("valid_until", date.toISOString().split('T')[0]);
      setValidUntilOpen(false);
    }
  };

  const validUntilDate = formData.valid_until ? new Date(formData.valid_until) : undefined;

  const currencyOptions = [
    { value: "TRY", label: "Türk Lirası (₺)" },
    { value: "USD", label: "ABD Doları ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "İngiliz Sterlini (£)" }
  ];

  const statusOptions = [
    { value: "draft", label: "Taslak" },
    { value: "pending_approval", label: "Onay Bekliyor" },
    { value: "sent", label: "Gönderildi" },
    { value: "accepted", label: "Kabul Edildi" },
    { value: "rejected", label: "Reddedildi" }
  ];

  const isValid = !!(formData.title && formData.customer_id && formData.valid_until);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Temel Bilgiler
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Teklif başlığı, müşteri seçimi ve temel detayları girin
          </p>
        </div>
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Sonraki: Adres Bilgileri
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation Alert */}
      {(validationErrors.title || validationErrors.customer_id || validationErrors.valid_until) && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lütfen gerekli alanları doldurun: 
            {validationErrors.title && " Başlık"}
            {validationErrors.customer_id && " Müşteri"}
            {validationErrors.valid_until && " Geçerlilik Tarihi"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Primary Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Teklif Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  Teklif Başlığı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => onFieldChange("title", e.target.value)}
                  className={cn(
                    "transition-all duration-200",
                    validationErrors.title && "border-destructive ring-destructive/20"
                  )}
                  placeholder="Örn: ABC Şirketi - Web Sitesi Geliştirme Teklifi"
                />
                {validationErrors.title && (
                  <p className="text-destructive text-sm">{validationErrors.title[0]}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => onFieldChange("description", e.target.value)}
                  placeholder="Teklif hakkında kısa açıklama..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => onFieldChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Dates */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Müşteri & Tarih
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Müşteri <span className="text-red-500">*</span>
                </Label>
                <CustomerSelector
                  value={formData.customer_id}
                  onChange={(value) => onFieldChange("customer_id", value)}
                  error={validationErrors.customer_id?.[0]}
                />
                {validationErrors.customer_id && (
                  <p className="text-destructive text-sm">{validationErrors.customer_id[0]}</p>
                )}
              </div>

              {/* Employee Selection */}
              <div className="space-y-2">
                <Label>Sorumlu Çalışan</Label>
                <EmployeeSelector
                  value={formData.employee_id}
                  onChange={(value) => onFieldChange("employee_id", value)}
                />
              </div>

              {/* Valid Until Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Geçerlilik Tarihi <span className="text-red-500">*</span>
                </Label>
                <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !validUntilDate && "text-muted-foreground",
                        validationErrors.valid_until && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntilDate ? (
                        format(validUntilDate, "dd MMMM yyyy", { locale: tr })
                      ) : (
                        "Tarih seçin"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validUntilDate}
                      onSelect={handleValidUntilChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {validationErrors.valid_until && (
                  <p className="text-destructive text-sm">{validationErrors.valid_until[0]}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Para Birimi
                </Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => onFieldChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">Ipuçları</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Açıklayıcı bir başlık kullanın</li>
                    <li>• Geçerlilik tarihini 30-60 gün arası tutun</li>
                    <li>• Doğru müşteriyi seçtiğinizden emin olun</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProposalBasicInfoTab; 