import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmployerCostCardProps {
  grossSalary: number;
  sgkBase: number;
  sgkEmployerShare: number;
  unemploymentEmployer: number;
  accidentInsurance: number;
  totalEmployerCost: number;
}

export const EmployerCostCard = ({
  grossSalary,
  sgkBase,
  sgkEmployerShare,
  unemploymentEmployer,
  accidentInsurance,
  totalEmployerCost,
}: EmployerCostCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalEmployerPremiums = sgkEmployerShare + unemploymentEmployer + accidentInsurance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>İşveren Maliyeti</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gross Salary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Brüt Maaş</span>
          <span className="text-lg font-bold">{formatCurrency(grossSalary)}</span>
        </div>

        {/* Employer Premiums */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <span>İşveren Primleri</span>
          </div>
          
          <div className="space-y-2 ml-4">
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
                    <p>İşveren primleri bu tutar üzerinden hesaplanır</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">{formatCurrency(sgkBase)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İşveren SGK Primi (%20,5)</span>
              <span className="font-medium text-indigo-600">
                +{formatCurrency(sgkEmployerShare)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İşveren İşsizlik Primi (%2)</span>
              <span className="font-medium text-indigo-600">
                +{formatCurrency(unemploymentEmployer)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      İş Kazası Sigortası
                      <Info className="w-3 h-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İşyeri tehlike sınıfına göre değişkendir</p>
                    <p className="text-xs">Örnek: %0,5 (az tehlikeli)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium text-indigo-600">
                +{formatCurrency(accidentInsurance)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="font-medium">Toplam İşveren Primleri</span>
              <span className="font-bold text-indigo-600">
                +{formatCurrency(totalEmployerPremiums)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Employer Cost */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
            <div>
              <p className="text-sm opacity-90">Toplam İşveren Maliyeti</p>
              <p className="text-xs opacity-75 mt-1">
                Brüt maaş + İşveren primleri
              </p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalEmployerCost)}</p>
          </div>
        </div>

        {/* Cost Breakdown Percentage */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-muted-foreground">Brüt Maaş Oranı</p>
            <p className="font-bold text-lg">
              {((grossSalary / totalEmployerCost) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-indigo-50 rounded text-center">
            <p className="text-muted-foreground">Prim Oranı</p>
            <p className="font-bold text-lg text-indigo-600">
              {((totalEmployerPremiums / totalEmployerCost) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
