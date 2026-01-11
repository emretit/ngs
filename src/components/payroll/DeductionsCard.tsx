import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle,
  Shield,
  TrendingDown,
  FileText,
  DollarSign,
  Plus,
  Info
} from "lucide-react";
import { Advance } from "@/services/payrollService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeductionsCardProps {
  sgkBase: number;
  sgkEmployeeShare: number;
  unemploymentEmployee: number;
  incomeTaxBase: number;
  incomeTaxAmount: number;
  incomeTaxExemption: number;
  stampTaxAmount: number;
  stampTaxExemption: number;
  advances: Advance[];
  garnishments: number;
  totalDeductions: number;
  netSalary: number;
  isMinimumWageExemption: boolean;
  warnings: string[];
  onManageAdvances?: () => void;
  isEditable?: boolean;
}

export const DeductionsCard = ({
  sgkBase,
  sgkEmployeeShare,
  unemploymentEmployee,
  incomeTaxBase,
  incomeTaxAmount,
  incomeTaxExemption,
  stampTaxAmount,
  stampTaxExemption,
  advances,
  garnishments,
  totalDeductions,
  netSalary,
  isMinimumWageExemption,
  warnings,
  onManageAdvances,
  isEditable = true,
}: DeductionsCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <span>Kesintiler</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Minimum Wage Exemption Badge */}
        {isMinimumWageExemption && (
          <Badge variant="secondary" className="w-full justify-center py-2 bg-green-50 text-green-700 border-green-200">
            <Info className="w-4 h-4 mr-2" />
            Asgari Ücret Muafiyeti Uygulandı
          </Badge>
        )}

        {/* SGK Deductions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>SGK Kesintileri</span>
          </div>
          
          <div className="ml-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      SGK Matrah Tabanı
                      <Info className="w-3 h-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>2026: Min 33.030 TL - Max 165.150 TL</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">{formatCurrency(sgkBase)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">SGK Primi (%14)</span>
              <span className="font-medium text-red-600">-{formatCurrency(sgkEmployeeShare)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İşsizlik Primi (%1)</span>
              <span className="font-medium text-red-600">-{formatCurrency(unemploymentEmployee)}</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-1 border-t">
              <span className="font-medium">Toplam SGK Kesintisi</span>
              <span className="font-bold text-red-600">
                -{formatCurrency(sgkEmployeeShare + unemploymentEmployee)}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Deductions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Vergi Kesintileri</span>
          </div>
          
          <div className="ml-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gelir Vergisi Matrahı</span>
              <span className="font-medium">{formatCurrency(incomeTaxBase)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gelir Vergisi</span>
              <div className="flex items-center gap-2">
                {incomeTaxExemption > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Muaf: {formatCurrency(incomeTaxExemption)}
                  </Badge>
                )}
                <span className="font-medium text-red-600">
                  -{formatCurrency(incomeTaxAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Damga Vergisi (‰7,59)</span>
              <div className="flex items-center gap-2">
                {stampTaxExemption > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Muaf: {formatCurrency(stampTaxExemption)}
                  </Badge>
                )}
                <span className="font-medium text-red-600">
                  -{formatCurrency(stampTaxAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1 border-t">
              <span className="font-medium">Toplam Vergi Kesintisi</span>
              <span className="font-bold text-red-600">
                -{formatCurrency(incomeTaxAmount + stampTaxAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Other Deductions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span>Diğer Kesintiler</span>
            </div>
            {isEditable && onManageAdvances && (
              <Button
                size="sm"
                variant="outline"
                onClick={onManageAdvances}
                className="gap-1 h-7"
              >
                <Plus className="w-3 h-3" />
                Avans
              </Button>
            )}
          </div>
          
          <div className="ml-6 space-y-2">
            {advances.length > 0 ? (
              <>
                {advances.map((advance, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded"
                  >
                    <span className="text-muted-foreground">{advance.description}</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(advance.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Avans</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(totalAdvances)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Avans kesintisi yok</p>
            )}

            {garnishments > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Haciz</span>
                <span className="font-medium text-red-600">-{formatCurrency(garnishments)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-amber-50 rounded text-sm"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-amber-700">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total Deductions */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg mb-3">
            <span className="text-lg font-bold">Toplam Kesintiler</span>
            <span className="text-xl font-bold text-red-600">
              -{formatCurrency(totalDeductions)}
            </span>
          </div>

          {/* Net Salary */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
            <div>
              <p className="text-sm opacity-90">Net Maaş</p>
              <p className="text-3xl font-bold">{formatCurrency(netSalary)}</p>
            </div>
            {netSalary < 0 && (
              <Badge variant="destructive">Negatif Maaş!</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
