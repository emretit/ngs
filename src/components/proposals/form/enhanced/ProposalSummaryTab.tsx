import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Receipt, TrendingUp, DollarSign } from "lucide-react";

interface ProposalSummaryTabProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  validationErrors: Record<string, string[]>;
  onNext: () => void;
}

const ProposalSummaryTab: React.FC<ProposalSummaryTabProps> = ({
  formData,
  onFieldChange,
  validationErrors,
  onNext
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: formData.currency || 'TRY'
    }).format(amount);
  };

  const subtotal = formData.subtotal || 0;
  const totalTax = formData.total_tax || 0;
  const totalDiscount = formData.total_discount || 0;
  const totalAmount = formData.total_amount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Özet & Toplamlar
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Fiyat hesaplamaları ve teklif özetini görüntüleyin
          </p>
        </div>
        <Button onClick={onNext} className="gap-2">
          Sonraki: Notlar & Şartlar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Mali Özet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Ara Toplam</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Toplam İndirim</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(totalDiscount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">KDV Toplamı</span>
                <span className="font-medium">{formatCurrency(totalTax)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-primary/10 px-4 rounded-lg">
                <span className="font-semibold text-primary">Genel Toplam</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              İstatistikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {formData.items?.length || 0}
                </div>
                <div className="text-sm text-blue-600">Toplam Kalem</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {((totalDiscount / (subtotal + totalDiscount)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-green-600">İndirim Oranı</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {((totalTax / subtotal) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">Vergi Oranı</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">
                  {formData.currency || 'TRY'}
                </div>
                <div className="text-sm text-orange-600">Para Birimi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalSummaryTab; 