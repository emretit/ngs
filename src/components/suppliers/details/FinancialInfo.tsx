
import { Card } from "@/components/ui/card";
import { Supplier } from "@/types/supplier";

interface FinancialInfoProps {
  supplier: Supplier;
}

export const FinancialInfo = ({ supplier }: FinancialInfoProps) => {
  return (
    <Card className="p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Finansal Bilgiler</h2>
      <div className="p-4 rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Bakiye</span>
          <span className={`font-semibold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {supplier.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>
      </div>
    </Card>
  );
};
