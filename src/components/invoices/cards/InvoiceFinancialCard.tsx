import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface InvoiceFinancialCardProps {
  totals: {
    ara_toplam: number;
    kdv_tutari: number;
    toplam_tutar: number;
    indirim_tutari: number;
  };
  currency: string;
  formatCurrency: (amount: number, currency: string) => string;
}

const InvoiceFinancialCard: React.FC<InvoiceFinancialCardProps> = ({
  totals,
  currency,
  formatCurrency,
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl relative z-10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200/50">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold">Finansal Özet</span>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Ara Toplam</span>
            <span className="font-medium">
              {formatCurrency(totals.ara_toplam, currency)}
            </span>
          </div>
          {totals.indirim_tutari > 0 && (
            <div className="flex justify-between text-red-600">
              <span>İndirim</span>
              <span className="font-medium">
                -{formatCurrency(totals.indirim_tutari, currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>KDV</span>
            <span className="font-medium">
              {formatCurrency(totals.kdv_tutari, currency)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold text-gray-900">
            <span>Toplam</span>
            <span>
              {formatCurrency(totals.toplam_tutar, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFinancialCard;
