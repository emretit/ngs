import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingDown, Clock, CheckCircle, Building2, User } from "lucide-react";
import { ExpenseItem } from "../ExpensesManager";

interface ExpensesSummaryCardsProps {
  expenses: ExpenseItem[];
  totalAmount: number;
}

const ExpensesSummaryCards = memo(({ expenses, totalAmount }: ExpensesSummaryCardsProps) => {
  const paidExpenses = expenses.filter(e => e.is_paid);
  const pendingExpenses = expenses.filter(e => !e.is_paid);
  const companyExpenses = expenses.filter(e => e.expense_type === 'company');
  const employeeExpenses = expenses.filter(e => e.expense_type === 'employee');
  
  const paidAmount = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const companyAmount = companyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const employeeAmount = employeeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const summaryItems = [
    {
      title: "Toplam Masraf",
      value: totalAmount,
      count: expenses.length,
      icon: Wallet,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      title: "Ödenen",
      value: paidAmount,
      count: paidExpenses.length,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Bekleyen",
      value: pendingAmount,
      count: pendingExpenses.length,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600"
    },
    {
      title: "Şirket",
      value: companyAmount,
      count: companyExpenses.length,
      icon: Building2,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Çalışan",
      value: employeeAmount,
      count: employeeExpenses.length,
      icon: User,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {summaryItems.map((item, index) => (
        <Card 
          key={index}
          className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 bg-gradient-to-br ${item.color} rounded-lg shadow-sm`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
              <span className={`text-xs font-medium ${item.bgColor} ${item.textColor} px-2 py-0.5 rounded-full`}>
                {item.count} adet
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">{item.title}</p>
              <p className={`text-lg font-bold ${item.textColor}`}>
                ₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

ExpensesSummaryCards.displayName = 'ExpensesSummaryCards';

export default ExpensesSummaryCards;

