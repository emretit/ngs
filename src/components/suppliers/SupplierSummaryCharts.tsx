import { Card } from "@/components/ui/card";
import { Supplier } from "@/types/supplier";
import { Factory, CreditCard, AlertCircle } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import { formatCurrency } from "@/utils/formatters";

interface SupplierSummaryChartsProps {
  suppliers: Supplier[] | undefined;
}

const SupplierSummaryCharts = ({ suppliers = [] }: SupplierSummaryChartsProps) => {
  if (!suppliers.length) {
    return null;
  }

  // Calculate total number of suppliers
  const totalSuppliers = suppliers.length;
  
  // Calculate total balance
  const totalBalance = suppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0);
  
  // Calculate overdue balance (for this example, let's consider all negative balances as overdue)
  // In a real application, you might have a specific field for overdue amounts
  const overdueBalance = suppliers.reduce((sum, supplier) => {
    // This is a simplified example - in reality, you would check against due dates
    // For now, we'll consider suppliers with 'pasif' status and positive balance as having overdue balance
    if (supplier.status === 'pasif' && supplier.balance > 0) {
      return sum + supplier.balance;
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <DashboardCard
        title="Toplam Tedarikçi Sayısı"
        value={totalSuppliers.toString()}
        icon={<Factory className="h-6 w-6" />}
      />
      
      <DashboardCard
        title="Toplam Bakiye"
        value={formatCurrency(totalBalance)}
        icon={<CreditCard className="h-6 w-6" />}
      />
      
      <DashboardCard
        title="Vadesi Geçen Bakiye"
        value={formatCurrency(overdueBalance)}
        icon={<AlertCircle className="h-6 w-6" />}
      />
    </div>
  );
};

export default SupplierSummaryCharts;