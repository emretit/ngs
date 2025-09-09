
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, PieChart } from "lucide-react";
import { SalaryRecord } from "./types";

interface SalaryStatsProps {
  salaryHistory: SalaryRecord[];
}

export const SalaryStats = ({ salaryHistory }: SalaryStatsProps) => {
  const calculateNetSalary = (record: SalaryRecord) => {
    return record.base_salary + record.allowances + record.bonuses - record.deductions;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-primary" />
            Son Maaş
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-800">
            {salaryHistory.length > 0 ? 
              `₺${calculateNetSalary(salaryHistory[salaryHistory.length - 1]).toLocaleString('tr-TR')}` : 
              "₺0"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {salaryHistory.length > 0 ? 
              `${new Date(salaryHistory[salaryHistory.length - 1].payment_date).toLocaleDateString('tr-TR')}` : 
              "-"}
          </p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            Toplam Bonuslar (Yıllık)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-800">
            {`₺${salaryHistory.reduce((sum, record) => sum + record.bonuses, 0).toLocaleString('tr-TR')}`}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {salaryHistory.length > 1 ? 
              `${salaryHistory.length} ödeme` : 
              salaryHistory.length === 1 ? "1 ödeme" : "Ödeme yok"}
          </p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <PieChart className="h-4 w-4 mr-2 text-primary" />
            Ortalama Aylık Net
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-800">
            {salaryHistory.length > 0 ? 
              `₺${(salaryHistory.reduce((sum, record) => sum + calculateNetSalary(record), 0) / salaryHistory.length).toLocaleString('tr-TR')}` : 
              "₺0"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tüm ödemelerin ortalaması
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
