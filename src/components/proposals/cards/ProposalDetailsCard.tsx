import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDays, ArrowRightLeft, RefreshCcw } from "lucide-react";
import { ProposalStatus, proposalStatusLabels, proposalStatusColors } from "@/types/proposal";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface ProposalDetailsCardProps {
  formData: {
    subject?: string;
    offer_date?: Date;
    validity_date?: Date;
    offer_number?: string;
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

  // Get exchange rate for selected currency
  const getCurrentExchangeRate = (): number | null => {
    if (!formData.currency || formData.currency === "TRY") {
      return null;
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
      handleFieldChange('exchange_rate', undefined);
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
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Teklif Konusu */}
        <div>
          <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
            Teklif Konusu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            value={formData.subject || ""}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
            placeholder="Teklif konusunu girin"
            className="mt-1 h-8 text-sm"
          />
        </div>

        {/* Tarih Alanları - Altlı Üstlü */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="offer_date" className="text-sm font-medium text-gray-700">Teklif Tarihi</Label>
              <DatePicker
                date={formData.offer_date}
                onSelect={(date) => handleFieldChange('offer_date', date)}
                placeholder="Teklif tarihi seçin"
              />
            </div>
            <div>
              <Label htmlFor="validity_date" className="text-sm font-medium text-gray-700">
                Geçerlilik Tarihi <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={formData.validity_date}
                onSelect={(date) => handleFieldChange('validity_date', date)}
                placeholder="Geçerlilik tarihi seçin"
              />
            </div>
          </div>
        </div>

        {/* Teklif No ve Durum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="offer_number" className="text-sm font-medium text-gray-700">Teklif No</Label>
            <Input
              id="offer_number"
              value={formData.offer_number}
              onChange={(e) => handleFieldChange('offer_number', e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">Teklif Durumu</Label>
            <Select value={formData.status} onValueChange={(value: ProposalStatus) => handleFieldChange('status', value)}>
              <SelectTrigger className="mt-1 h-8 text-sm">
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

        {/* Para Birimi ve Döviz Kuru - İki Sütunlu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Para Birimi</Label>
            <Select value={formData.currency || "TRY"} onValueChange={(value) => handleFieldChange('currency', value)}>
              <SelectTrigger className="mt-1 h-8">
                <SelectValue placeholder="Para birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">₺ TL</SelectItem>
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
          {/* Döviz Kuru - Sadece TRY dışındaki para birimleri için */}
          {formData.currency && formData.currency !== "TRY" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="exchange_rate" className="text-sm font-medium text-gray-700">
                  Döviz Kuru
                </Label>
                {currentRate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>Güncel: {currentRate.toFixed(4)} TL</span>
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
                    value={formData.exchange_rate || ""}
                    onChange={(e) => handleFieldChange('exchange_rate', parseFloat(e.target.value) || 1)}
                    placeholder={currentRate ? currentRate.toFixed(4) : "Örn: 32.50"}
                    className="h-8 text-sm pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    1 {formData.currency} = ? TL
                  </div>
                </div>
                {currentRate && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('exchange_rate', currentRate)}
                    className="px-3 py-2 text-xs border rounded-md hover:bg-muted whitespace-nowrap flex items-center gap-1 h-8"
                    title="Güncel kuru uygula"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>Uygula</span>
                  </button>
                )}
              </div>
              {formData.exchange_rate && currentRate && Math.abs(formData.exchange_rate - currentRate) > 0.01 && (
                <p className="text-xs text-orange-600 mt-1">
                  Güncel kurdan {formData.exchange_rate > currentRate ? '+' : ''}{((formData.exchange_rate - currentRate) / currentRate * 100).toFixed(2)}% farklı
                </p>
              )}
            </div>
          ) : (
            <div>
              {/* TRY seçildiğinde boş alan - layout'u korumak için */}
            </div>
          )}
        </div>

        {/* Notlar Alanı */}
        <div>
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Teklif hakkında notlarınızı yazın..."
            className="mt-1 resize-none h-8 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalDetailsCard;
