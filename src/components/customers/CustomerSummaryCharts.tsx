
import { Customer } from "@/types/customer";
import { Users, CreditCard, AlertCircle } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";

interface CustomerSummaryChartsProps {
  customers: Customer[] | undefined;
}

const CustomerSummaryCharts = ({ customers = [] }: CustomerSummaryChartsProps) => {
  if (!customers.length) {
    return null;
  }

  // Calculate total number of customers
  const totalCustomers = customers.length;
  
  // Calculate total balance
  const totalBalance = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
  
  // Calculate overdue balance (for this example, let's consider all negative balances as overdue)
  // In a real application, you might have a specific field for overdue amounts
  const overdueBalance = customers.reduce((sum, customer) => {
    // This is a simplified example - in reality, you would check against due dates
    // For now, we'll consider customers with 'pasif' status and positive balance as having overdue balance
    if (customer.status === 'pasif' && customer.balance > 0) {
      return sum + customer.balance;
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <DashboardCard
        title="Toplam Müşteri Sayısı"
        value={totalCustomers.toString()}
        icon={Users}
        color="blue"
      />
      
      <DashboardCard
        title="Toplam Bakiye"
        value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalBalance)}
        icon={CreditCard}
        color="green"
      />
      
      <DashboardCard
        title="Vadesi Geçen Bakiye"
        value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(overdueBalance)}
        icon={AlertCircle}
        color="red"
      />
    </div>
  );
};

export default CustomerSummaryCharts;
