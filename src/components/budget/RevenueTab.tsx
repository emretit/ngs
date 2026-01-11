import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface RevenueItem {
  month: string;
  targetRevenue: number;
  realizedRevenue: number;
  variance: number;
  salesNotes: string;
}

interface RevenueTabProps {
  filters: BudgetFiltersState;
}

const RevenueTab = ({ filters }: RevenueTabProps) => {
  // Mock data
  const revenueData: RevenueItem[] = [
    { month: "Ocak", targetRevenue: 1000000, realizedRevenue: 950000, variance: -50000, salesNotes: "Hedefin altında" },
    { month: "Şubat", targetRevenue: 1100000, realizedRevenue: 1200000, variance: 100000, salesNotes: "Hedefi aştı" },
    { month: "Mart", targetRevenue: 1200000, realizedRevenue: 1150000, variance: -50000, salesNotes: "Normal seviye" },
    { month: "Nisan", targetRevenue: 1300000, realizedRevenue: 1350000, variance: 50000, salesNotes: "İyi performans" },
    { month: "Mayıs", targetRevenue: 1400000, realizedRevenue: 1420000, variance: 20000, salesNotes: "Hedefi aştı" },
    { month: "Haziran", targetRevenue: 1500000, realizedRevenue: 1480000, variance: -20000, salesNotes: "Yakın hedef" },
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

  const chartData = revenueData.map((item) => ({
    month: item.month,
    target: item.targetRevenue,
    realized: item.realizedRevenue,
  }));

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Aylık Gelir Projeksiyonu</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="target"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Hedef Gelir"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="realized"
                stroke="#10b981"
                strokeWidth={2}
                name="Gerçekleşen Gelir"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="text-xs font-semibold h-8 py-2">Ay</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Hedef Gelir</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Gerçekleşen Gelir</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Varyans</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Satış Notları</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueData.map((item, index) => (
              <TableRow key={index} className="h-8">
                <TableCell className="font-medium text-sm py-2">{item.month}</TableCell>
                <TableCell className="text-right text-sm py-2">{formatAmount(item.targetRevenue)}</TableCell>
                <TableCell className="text-right text-sm py-2">{formatAmount(item.realizedRevenue)}</TableCell>
                <TableCell
                  className={`text-right text-sm font-medium py-2 ${
                    item.variance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatAmount(item.variance)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-2">{item.salesNotes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RevenueTab;

