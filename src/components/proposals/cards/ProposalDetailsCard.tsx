import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDays } from "lucide-react";
import { ProposalStatus, proposalStatusLabels, proposalStatusColors } from "@/types/proposal";

interface ProposalDetailsCardProps {
  data: {
    subject?: string;
    offer_date?: Date;
    validity_date?: Date;
    offer_number?: string;
    status?: ProposalStatus;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ProposalDetailsCard: React.FC<ProposalDetailsCardProps> = ({
  data,
  onChange,
  errors = {}
}) => {
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
          <Label htmlFor="subject" className="text-xs font-medium text-gray-700">
            Teklif Konusu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            value={data.subject || ""}
            onChange={(e) => onChange('subject', e.target.value)}
            placeholder="Teklif konusunu girin"
            className="mt-1 h-7 text-xs"
          />
        </div>

        {/* Tarih Alanları - Altlı Üstlü */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="offer_date" className="text-xs font-medium text-gray-700">Teklif Tarihi</Label>
              <DatePicker
                date={data.offer_date}
                onSelect={(date) => onChange('offer_date', date)}
                placeholder="Teklif tarihi seçin"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="validity_date" className="text-xs font-medium text-gray-700">
                Geçerlilik Tarihi <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={data.validity_date}
                onSelect={(date) => onChange('validity_date', date)}
                placeholder="Geçerlilik tarihi seçin"
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Teklif No, Durum ve Para Birimi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="offer_number" className="text-xs font-medium text-gray-700">Teklif No</Label>
            <Input
              id="offer_number"
              value={data.offer_number}
              onChange={(e) => onChange('offer_number', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-xs font-medium text-gray-700">Teklif Durumu</Label>
            <Select value={data.status} onValueChange={(value: ProposalStatus) => onChange('status', value)}>
              <SelectTrigger className="mt-1 h-7 text-xs">
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
          <div>
            <Label htmlFor="currency" className="text-xs font-medium text-gray-700">Para Birimi</Label>
            <Select value={data.currency || "TRY"} onValueChange={(value) => onChange('currency', value)}>
              <SelectTrigger className="mt-1 h-7 text-xs">
                <SelectValue placeholder="Para birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">₺ TRY</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
                <SelectItem value="GBP">£ GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Döviz Kuru - Sadece TRY dışındaki para birimleri için */}
        {data.currency && data.currency !== "TRY" && (
          <div>
            <Label htmlFor="exchange_rate" className="text-xs font-medium text-gray-700">
              Döviz Kuru (1 {data.currency} = ? TRY)
            </Label>
            <Input
              id="exchange_rate"
              type="number"
              step="0.01"
              min="0"
              value={data.exchange_rate || ""}
              onChange={(e) => onChange('exchange_rate', parseFloat(e.target.value) || 1)}
              placeholder="Örn: 32.50"
              className="mt-1 h-7 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              1 {data.currency} = {data.exchange_rate || "1"} TRY
            </p>
          </div>
        )}

        {/* Notlar Alanı */}
        <div>
          <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Teklif hakkında notlarınızı yazın..."
            className="mt-1 min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalDetailsCard;
