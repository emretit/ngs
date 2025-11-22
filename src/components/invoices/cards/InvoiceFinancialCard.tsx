import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
            <Calculator className="h-4 w-4 text-orange-600" />
          </div>
          Finansal Özet
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span className="font-medium">
                {formatCurrency(totals.ara_toplam, currency)}
              </span>
            </div>
            {totals.indirim_tutari > 0 && (
              <div className="flex justify-between text-red-600">
                <span>İndirim:</span>
                <span className="font-medium">
                  -{formatCurrency(totals.indirim_tutari, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>KDV:</span>
              <span className="font-medium">
                {formatCurrency(totals.kdv_tutari, currency)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Toplam:</span>
              <span>
                {formatCurrency(totals.toplam_tutar, currency)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFinancialCard;

