import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface FinancialSummaryCardProps {
  data: {
    gross_total: number;
    vat_percentage: number;
    discount_type: 'percentage' | 'amount';
    discount_value: number;
    net_total: number;
    vat_amount: number;
    total_amount: number;
    currency: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  data,
  onChange,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200/50">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
          Finansal Özet
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-3">
          {/* Brüt Toplam */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-700">Brüt Toplam:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(data.gross_total, data.currency)}
            </span>
          </div>

          {/* KDV Oranı */}
          <div className="flex items-center justify-between">
            <Label htmlFor="vat_percentage" className="text-xs font-medium text-gray-700">
              KDV Oranı
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="vat_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.vat_percentage}
                onChange={(e) => onChange('vat_percentage', parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-xs text-center"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          {/* Genel İndirim */}
          <div className="flex items-center justify-between">
            <Label htmlFor="discount" className="text-xs font-medium text-gray-700">
              Genel İndirim
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={data.discount_type}
                onValueChange={(value: 'percentage' | 'amount') => onChange('discount_type', value)}
              >
                <SelectTrigger className="w-16 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="amount">₺</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={data.discount_value}
                onChange={(e) => onChange('discount_value', parseFloat(e.target.value) || 0)}
                className="w-20 h-7 text-xs"
              />
            </div>
          </div>

          {/* Net Toplam */}
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Net Toplam:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(data.net_total, data.currency)}
            </span>
          </div>

          {/* KDV */}
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-gray-700">KDV:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(data.vat_amount, data.currency)}
            </span>
          </div>

          {/* Genel Toplam */}
          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 bg-gray-50 rounded-lg px-3">
            <span className="text-lg font-bold text-gray-900">GENEL TOPLAM:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(data.total_amount, data.currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
