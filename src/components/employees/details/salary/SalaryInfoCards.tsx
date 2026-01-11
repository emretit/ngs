import { Employee } from "@/types/employee";
import { DollarSign, Building, Utensils, TrendingUp } from "lucide-react";

interface SalaryInfoCardsProps {
  employee: Employee;
}

export const SalaryInfoCards = ({ employee }: SalaryInfoCardsProps) => {
  // Net Maaş
  const netSalary = employee.net_salary || 0;

  // SGK Maliyet (manuel employer SGK + işsizlik + kaza sigortası)
  const sgkCost = (employee.manual_employer_sgk_cost || 0) +
    (employee.unemployment_employer_amount || 0) +
    (employee.accident_insurance_amount || 0);

  // Yemek + Yol
  const allowances = (employee.meal_allowance || 0) + (employee.transport_allowance || 0);

  // Toplam Maliyet
  const totalCost = employee.total_employer_cost || (netSalary + sgkCost + allowances);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Net Maaş */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-500">Net Maaş</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {netSalary.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </div>

      {/* SGK Maliyet */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-500">SGK Maliyet</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {sgkCost.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </div>

      {/* Yemek + Yol */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Utensils className="h-4 w-4 text-orange-600" />
          </div>
          <span className="text-xs font-medium text-gray-500">Yemek + Yol</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {allowances.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </div>

      {/* Toplam Maliyet */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-500">Toplam Maliyet</span>
        </div>
        <div className="text-xl font-bold text-gray-900">
          {totalCost.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </div>
    </div>
  );
};
