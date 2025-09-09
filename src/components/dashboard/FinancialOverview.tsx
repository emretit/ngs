import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CreditCard,
  PieChart,
  Calculator
} from "lucide-react";

interface FinancialMetricProps {
  title: string;
  amount: string;
  percentage: number;
  trend: "up" | "down" | "stable";
  color: string;
}

const FinancialMetric: React.FC<FinancialMetricProps> = ({
  title,
  amount,
  percentage,
  trend,
  color
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Badge 
          variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} {percentage}%
        </Badge>
      </div>
      <div className="text-xl font-bold text-gray-900">{amount}</div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
};

export const FinancialOverview: React.FC = () => {
  const financialData = [
    {
      title: "Aylık Gelir",
      amount: "₺ 2,847,250",
      percentage: 85,
      trend: "up" as const,
      color: "bg-green-500"
    },
    {
      title: "Aylık Gider",
      amount: "₺ 1,923,180",
      percentage: 65,
      trend: "down" as const,
      color: "bg-red-500"
    },
    {
      title: "Net Kâr",
      amount: "₺ 924,070",
      percentage: 75,
      trend: "up" as const,
      color: "bg-blue-500"
    },
    {
      title: "Nakit Akışı",
      amount: "₺ 1,456,320",
      percentage: 90,
      trend: "stable" as const,
      color: "bg-purple-500"
    }
  ];

  const budgetComparison = [
    { category: "Satış", budget: 3000000, actual: 2847250, variance: -5.1 },
    { category: "Pazarlama", budget: 450000, actual: 523000, variance: 16.2 },
    { category: "Operasyon", budget: 1800000, actual: 1654000, variance: -8.1 },
    { category: "İK", budget: 650000, actual: 598000, variance: -8.0 }
  ];

  const cashflowData = [
    { month: "Oca", income: 2100000, expense: 1800000 },
    { month: "Şub", income: 2350000, expense: 1900000 },
    { month: "Mar", income: 2600000, expense: 1950000 },
    { month: "Nis", income: 2847250, expense: 1923180 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Financial Metrics */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Mali Durum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {financialData.map((metric, index) => (
            <FinancialMetric key={index} {...metric} />
          ))}
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Bütçe vs Gerçekleşen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetComparison.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.category}</span>
                  <Badge 
                    variant={item.variance > 0 ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {item.variance > 0 ? "+" : ""}{item.variance.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  Bütçe: ₺ {item.budget.toLocaleString()} / 
                  Gerçekleşen: ₺ {item.actual.toLocaleString()}
                </div>
                <Progress 
                  value={(item.actual / item.budget) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Nakit Akış Trendi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cashflowData.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{data.month}</div>
                  <div className="text-xs text-gray-600">
                    Net: ₺ {(data.income - data.expense).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">
                    +₺ {data.income.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-600">
                    -₺ {data.expense.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialOverview;