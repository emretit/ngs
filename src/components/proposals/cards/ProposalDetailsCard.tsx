import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDays, ArrowRightLeft, RefreshCcw, GitBranch } from "lucide-react";
import { ProposalStatus, proposalStatusLabels, proposalStatusColors } from "@/types/proposal";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface ProposalDetailsCardProps {
  formData: {
    subject?: string;
    offer_date?: Date;
    validity_date?: Date;
    offer_number?: string;
    revision_number?: number | null;
    status: ProposalStatus;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
  };
  handleFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ProposalDetailsCard: React.FC<ProposalDetailsCardProps> = ({
  formData,
  handleFieldChange,
  errors = {}
}) => {
  // Exchange rates management
  const { exchangeRates, loading: isLoadingRates, refreshExchangeRates } = useExchangeRates();
  const [localExchangeRate, setLocalExchangeRate] = React.useState<string>(
    formData.exchange_rate?.toString() || ""
  );
  
  // Sync localExchangeRate with formData.exchange_rate
  React.useEffect(() => {
    if (formData.exchange_rate !== undefined) {
      setLocalExchangeRate(formData.exchange_rate.toString());
    }
  }, [formData.exchange_rate]);

  // Get exchange rate for selected currency
  const getCurrentExchangeRate = (): number | null => {
    if (!formData.currency || formData.currency === "TRY") {
      return 1.0; // TRY için 1.0 döndür
    }

    const rate = exchangeRates.find(r => r.currency_code === formData.currency);
    return rate?.forex_selling || null;
  };

  // Auto-update exchange rate when currency changes
  useEffect(() => {
    if (formData.currency && formData.currency !== "TRY") {
      const currentRate = getCurrentExchangeRate();
      if (currentRate && (!formData.exchange_rate || formData.exchange_rate === 1)) {
        handleFieldChange('exchange_rate', currentRate);
      }
    } else if (formData.currency === "TRY") {
      // TRY seçili olduğunda döviz kurunu 1.0000 olarak ayarla
      handleFieldChange('exchange_rate', 1.0);
    }
  }, [formData.currency, exchangeRates]);

  const currentRate = getCurrentExchangeRate();

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <CalendarDays className="h-4 w-4 text-green-600" />
          </div>
          Teklif Detayları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        {/* Teklif Konusu ve Teklif Durumu - Yan Yana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-medium text-gray-700">
              Teklif Konusu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject || ""}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              placeholder="Teklif konusunu girin"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-medium text-gray-700">Teklif Durumu</Label>
            <Select value={formData.status} onValueChange={(value: ProposalStatus) => handleFieldChange('status', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(proposalStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${proposalStatusColors[value as ProposalStatus]}`}></span>
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tarih Alanları - Yan Yana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="offer_date" className="text-xs font-medium text-gray-700">Teklif Tarihi</Label>
            <DatePicker
              date={formData.offer_date}
              onSelect={(date) => handleFieldChange('offer_date', date)}
              placeholder="Teklif tarihi seçin"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validity_date" className="text-xs font-medium text-gray-700">
              Geçerlilik Tarihi <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              date={formData.validity_date}
              onSelect={(date) => handleFieldChange('validity_date', date)}
              placeholder="Geçerlilik tarihi seçin"
            />
          </div>
        </div>

        {/* Teklif No ve Revizyon No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="offer_number" className="text-xs font-medium text-gray-700 flex items-center min-h-[20px]">
              Teklif No
            </Label>
            <Input
              id="offer_number"
              value={formData.offer_number}
              onChange={(e) => handleFieldChange('offer_number', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revision_number" className="text-xs font-medium text-gray-700 flex items-center gap-1.5 min-h-[20px]">
              <GitBranch className="h-3.5 w-3.5 text-orange-500" />
              Revizyon No
            </Label>
            <Input
              id="revision_number"
              value={`R${formData.revision_number ?? 0}`}
              readOnly
              disabled
              className={`h-8 text-xs font-medium ${
                formData.revision_number 
                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            />
          </div>
        </div>

        {/* Para Birimi ve Döviz Kuru - Yan Yana, Her Zaman Görünür */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-xs font-medium text-gray-700 flex items-center min-h-[20px]">Para Birimi</Label>
            <Select value={formData.currency || "TRY"} onValueChange={(value) => handleFieldChange('currency', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Para birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">₺ TRY</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
                <SelectItem value="GBP">£ GBP</SelectItem>
              </SelectContent>
            </Select>
            {isLoadingRates && formData.currency !== "TRY" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <RefreshCcw className="h-3 w-3 animate-spin" />
                <span>Kurlar yükleniyor...</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="exchange_rate" className="text-xs font-medium text-gray-700 flex items-center">
                Döviz Kuru
              </Label>
              {currentRate && formData.currency !== "TRY" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground h-5">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Güncel: {currentRate.toFixed(4)} TRY</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.currency === "TRY" ? "1.0000" : localExchangeRate}
                  onChange={(e) => {
                    if (formData.currency !== "TRY") {
                      const value = e.target.value;
                      setLocalExchangeRate(value);
                      // Only trigger handleFieldChange if value is valid
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        handleFieldChange('exchange_rate', numValue);
                      }
                    }
                  }}
                  disabled={formData.currency === "TRY"}
                  placeholder={formData.currency === "TRY" ? "1.0000" : (currentRate ? currentRate.toFixed(4) : "Örn: 32.50")}
                  className="h-8 text-xs pr-24"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none flex items-center h-full">
                  1 {formData.currency || "TRY"} = ? TRY
                </div>
              </div>
              {currentRate && formData.currency !== "TRY" && (
                <button
                  type="button"
                  onClick={() => {
                    // Just update the input value without triggering conversion dialog
                    const newRate = currentRate;
                    setLocalExchangeRate(newRate.toFixed(4));
                    // Update formData directly without showing dialog
                    // We'll use a special flag or just update if the change is minimal
                    handleFieldChange('exchange_rate', newRate);
                  }}
                  className="px-3 h-8 text-xs border rounded-md hover:bg-muted whitespace-nowrap flex items-center justify-center gap-1"
                  title="Güncel kuru uygula"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Uygula</span>
                </button>
              )}
            </div>
            {formData.exchange_rate && currentRate && formData.currency !== "TRY" && Math.abs(formData.exchange_rate - currentRate) > 0.01 && (
              <p className="text-xs text-orange-600 mt-1">
                Güncel kurdan {formData.exchange_rate > currentRate ? '+' : ''}{((formData.exchange_rate - currentRate) / currentRate * 100).toFixed(2)}% farklı
              </p>
            )}
          </div>
        </div>

        {/* Notlar Alanı */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Teklif hakkında notlarınızı yazın..."
            className="resize-none min-h-[80px] text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalDetailsCard;
