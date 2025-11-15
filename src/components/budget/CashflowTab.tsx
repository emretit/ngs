import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/BudgetManagement";

interface CashflowItem {
  month: string;
  cashIn: number;
  cashOut: number;
  cashBalance: number;
}

interface CashflowTabProps {
  filters: BudgetFiltersState;
}

const CashflowTab = ({ filters }: CashflowTabProps) => {
  // Mock data
  const cashflowData: CashflowItem[] = [
    { month: "Ocak", cashIn: 1200000, cashOut: 1100000, cashBalance: 100000 },
    { month: "Şubat", cashIn: 1300000, cashOut: 1250000, cashBalance: 50000 },
    { month: "Mart", cashIn: 1150000, cashOut: 1200000, cashBalance: -50000 },
    { month: "Nisan", cashIn: 1400000, cashOut: 1350000, cashBalance: 50000 },
    { month: "Mayıs", cashIn: 1450000, cashOut: 1400000, cashBalance: 50000 },
    { month: "Haziran", cashIn: 1500000, cashOut: 1480000, cashBalance: 20000 },
  ];

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${(amount / 1000).toFixed(0)}K`;
  };

  const chartData = cashflowData.map((item) => ({
    month: item.month,
    cashIn: item.cashIn,
    cashOut: item.cashOut,
    cashBalance: item.cashBalance,
  }));

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Nakit Giriş / Çıkış</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
              <Tooltip
                formatter={(value: number) => formatAmount(value)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="cashIn" fill="#10b981" name="Nakit Giriş" />
              <Bar dataKey="cashOut" fill="#ef4444" name="Nakit Çıkış" />
              <Line
                type="monotone"
                dataKey="cashBalance"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Nakit Bakiye"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="text-xs font-semibold h-8 py-2">Ay</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Nakit Giriş</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Nakit Çıkış</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Nakit Bakiye</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashflowData.map((item, index) => (
              <TableRow
                key={index}
                className={`h-8 ${item.cashBalance < 0 ? "bg-red-50" : ""}`}
              >
                <TableCell className="font-medium text-sm py-2">{item.month}</TableCell>
                <TableCell className="text-right text-sm text-green-600 py-2">
                  {formatAmount(item.cashIn)}
                </TableCell>
                <TableCell className="text-right text-sm text-red-600 py-2">
                  {formatAmount(item.cashOut)}
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-medium py-2 ${
                    item.cashBalance < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatAmount(item.cashBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CashflowTab;

