import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { Sparkline } from "./Sparkline";

interface CapexItem {
  id: string;
  assetName: string;
  budget: number;
  realized: number;
  remaining: number;
  status: "Planned" | "Ordered" | "Delivered";
  amortization: number[];
}

interface CapexTabProps {
  filters: BudgetFiltersState;
}

const CapexTab = ({ filters }: CapexTabProps) => {
  // Mock data
  const capexData: CapexItem[] = [
    {
      id: "1",
      assetName: "Sunucu Altyapısı",
      budget: 500000,
      realized: 450000,
      remaining: 50000,
      status: "Ordered",
      amortization: [100000, 100000, 100000, 100000, 100000],
    },
    {
      id: "2",
      assetName: "Ofis Mobilyaları",
      budget: 300000,
      realized: 300000,
      remaining: 0,
      status: "Delivered",
      amortization: [60000, 60000, 60000, 60000, 60000],
    },
    {
      id: "3",
      assetName: "Yazılım Lisansları",
      budget: 200000,
      realized: 0,
      remaining: 200000,
      status: "Planned",
      amortization: [40000, 40000, 40000, 40000, 40000],
    },
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
    return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planned":
        return "bg-gray-100 text-gray-700";
      case "Ordered":
        return "bg-yellow-100 text-yellow-700";
      case "Delivered":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Planned":
        return "Planlandı";
      case "Ordered":
        return "Sipariş Edildi";
      case "Delivered":
        return "Teslim Edildi";
      default:
        return status;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="text-xs font-semibold h-8 py-2">Varlık Adı</TableHead>
            <TableHead className="text-xs font-semibold text-right h-8 py-2">Bütçe</TableHead>
            <TableHead className="text-xs font-semibold text-right h-8 py-2">Gerçekleşen</TableHead>
            <TableHead className="text-xs font-semibold text-right h-8 py-2">Kalan</TableHead>
            <TableHead className="text-xs font-semibold h-8 py-2">Durum</TableHead>
            <TableHead className="text-xs font-semibold h-8 py-2">Amortisman Özeti</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {capexData.map((item) => (
            <TableRow key={item.id} className="h-8">
              <TableCell className="font-medium text-sm py-2">{item.assetName}</TableCell>
              <TableCell className="text-right text-sm py-2">{formatAmount(item.budget)}</TableCell>
              <TableCell className="text-right text-sm py-2">{formatAmount(item.realized)}</TableCell>
              <TableCell className="text-right text-sm py-2">{formatAmount(item.remaining)}</TableCell>
              <TableCell className="py-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <div className="w-24 h-8">
                  <Sparkline data={item.amortization} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CapexTab;

