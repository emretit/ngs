import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Plus, 
  Edit, 
  TrendingUp, 
  Gift,
  DollarSign 
} from "lucide-react";
import { Allowance } from "@/services/payrollService";

interface GrossSalaryCardProps {
  baseSalary: number;
  overtimePay: number;
  bonusPremium: number;
  allowances: Allowance[];
  grossSalary: number;
  onEditBaseSalary?: (value: number) => void;
  onEditOvertimePay?: (value: number) => void;
  onEditBonusPremium?: (value: number) => void;
  onManageAllowances?: () => void;
  isEditable?: boolean;
}

export const GrossSalaryCard = ({
  baseSalary,
  overtimePay,
  bonusPremium,
  allowances,
  grossSalary,
  onEditBaseSalary,
  onEditOvertimePay,
  onEditBonusPremium,
  onManageAllowances,
  isEditable = true,
}: GrossSalaryCardProps) => {
  const taxableAllowances = allowances.filter(a => a.is_taxable).reduce((sum, a) => sum + a.amount, 0);
  const nonTaxableAllowances = allowances.filter(a => !a.is_taxable).reduce((sum, a) => sum + a.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-600" />
          <span>Brüt Maaş Hesaplaması</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Salary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Aylık Maaş Tabanı</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditable && onEditBaseSalary ? (
              <Input
                type="number"
                value={baseSalary}
                onChange={(e) => onEditBaseSalary(parseFloat(e.target.value) || 0)}
                className="w-40 text-right"
              />
            ) : (
              <span className="text-lg font-bold">{formatCurrency(baseSalary)}</span>
            )}
          </div>
        </div>

        {/* Overtime Pay */}
        {overtimePay > 0 && (
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Fazla Mesai Ücreti</span>
            </div>
            <div className="flex items-center gap-2">
              {isEditable && onEditOvertimePay ? (
                <Input
                  type="number"
                  value={overtimePay}
                  onChange={(e) => onEditOvertimePay(parseFloat(e.target.value) || 0)}
                  className="w-40 text-right"
                />
              ) : (
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(overtimePay)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bonus Premium */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Prim ve İkramiye</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditable && onEditBonusPremium ? (
              <Input
                type="number"
                value={bonusPremium}
                onChange={(e) => onEditBonusPremium(parseFloat(e.target.value) || 0)}
                className="w-40 text-right"
              />
            ) : (
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(bonusPremium)}
              </span>
            )}
          </div>
        </div>

        {/* Allowances */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-muted-foreground">Yan Ödemeler</span>
            {isEditable && onManageAllowances && (
              <Button
                size="sm"
                variant="outline"
                onClick={onManageAllowances}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Ekle
              </Button>
            )}
          </div>

          {allowances.length > 0 ? (
            <div className="space-y-2">
              {allowances.map((allowance, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {allowance.type === 'meal' ? '🍽️ Yemek' :
                       allowance.type === 'transportation' ? '🚗 Yol' : '📦 Diğer'}
                    </Badge>
                    <span>{allowance.description}</span>
                    {!allowance.is_taxable && (
                      <Badge variant="outline" className="text-xs">Vergisiz</Badge>
                    )}
                  </div>
                  <span className="font-medium">{formatCurrency(allowance.amount)}</span>
                </div>
              ))}
              {taxableAllowances > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vergiye tabi toplam:</span>
                  <span className="font-medium">{formatCurrency(taxableAllowances)}</span>
                </div>
              )}
              {nonTaxableAllowances > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vergisiz toplam:</span>
                  <span className="font-medium">{formatCurrency(nonTaxableAllowances)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Yan ödeme bulunmuyor
            </p>
          )}
        </div>

        {/* Total Gross */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <span className="text-lg font-bold">Toplam Brüt Maaş</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(grossSalary)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
