import React, { useEffect } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { CalendarDays, Globe, Calendar, RefreshCcw, GitBranch } from "lucide-react";
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
  const { exchangeRates, lastUpdate, loading: isLoadingRates, refreshExchangeRates } = useExchangeRates();

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
      if (currentRate) {
        handleFieldChange('exchange_rate', currentRate);
      }
    } else if (formData.currency === "TRY") {
      handleFieldChange('exchange_rate', 1.0);
    }
  }, [formData.currency, exchangeRates]);

  const currentRate = getCurrentExchangeRate();

  const getLastUpdateText = () => {
    if (!lastUpdate) return "Güncelleme bilgisi yok";
    
    try {
      const date = new Date(lastUpdate);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      logger.error('Date parsing error:', error);
      return 'Geçersiz tarih';
    }
  };

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

        {/* Para Birimi ve Döviz Kuru - Modern Tek Satır Tasarım */}
        <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-3">
            {/* Para Birimi Seçimi */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-amber-900 whitespace-nowrap">Para Birimi:</Label>
              <Select value={formData.currency || "TRY"} onValueChange={(value) => handleFieldChange('currency', value)}>
                <SelectTrigger className="h-8 w-24 text-xs bg-white border-amber-300">
                  <SelectValue placeholder="Para birimi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Döviz Kuru - Sadece TRY değilse */}
            {formData.currency && formData.currency !== "TRY" && (
              <>
                <div className="h-5 w-px bg-amber-300" />
                
                <div className="flex items-center justify-between gap-2 flex-1">
                  {/* Sol: Kur Bilgisi */}
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-amber-900 whitespace-nowrap">
                        1 {formData.currency} =
                      </span>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={formData.exchange_rate || 1}
                        onChange={(e) => handleFieldChange('exchange_rate', parseFloat(e.target.value) || 1)}
                        className="h-7 w-24 text-xs font-medium text-amber-900 bg-white border-amber-300 text-right"
                      />
                      <span className="text-xs font-semibold text-amber-900">TRY</span>
                    </div>
                  </div>
                  
                  {/* Orta: Güncel Kur */}
                  {currentRate && (
                    <div className="text-[10px] text-amber-600 whitespace-nowrap">
                      Güncel: {currentRate.toFixed(4)} TRY
                    </div>
                  )}
                  
                  {/* Sağ: Tarih ve Yenile */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-amber-600">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>{getLastUpdateText()}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-amber-100 shrink-0"
                      onClick={refreshExchangeRates}
                      disabled={isLoadingRates}
                      title="Kurları Yenile"
                    >
                      <RefreshCcw className={`h-3 w-3 text-amber-700 ${isLoadingRates ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </>
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
