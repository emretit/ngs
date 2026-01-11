import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface CategoryDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: any;
  filters: BudgetFiltersState;
}

const CategoryDetailSheet = ({
  isOpen,
  onClose,
  category,
  filters,
}: CategoryDetailSheetProps) => {
  if (!category) return null;

  // Mock transaction data
  const transactions = [
    {
      id: "1",
      date: "2024-01-15",
      description: "Ocak Maaşları",
      amount: 450000,
      department: "Satış",
    },
    {
      id: "2",
      date: "2024-02-15",
      description: "Şubat Maaşları",
      amount: 450000,
      department: "Satış",
    },
    {
      id: "3",
      date: "2024-03-15",
      description: "Mart Maaşları",
      amount: 400000,
      department: "Pazarlama",
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{category.category}</SheetTitle>
          <SheetDescription>
            Kategori detayları ve son işlemler
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Yıllık Bütçe</p>
              <p className="text-lg font-semibold">{formatAmount(category.annualBudget)}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Gerçekleşen</p>
              <p className="text-lg font-semibold">{formatAmount(category.realized)}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Varyans</p>
              <p className={`text-lg font-semibold ${category.variance < 0 ? "text-green-600" : "text-red-600"}`}>
                {formatAmount(category.variance)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Kullanım %</p>
              <p className="text-lg font-semibold">{category.utilization}%</p>
            </div>
          </div>

          {/* Notes */}
          {category.notes && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Notlar</p>
              <p className="text-sm text-foreground">{category.notes}</p>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Son İşlemler</h3>
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-xs h-8 py-2">Tarih</TableHead>
                  <TableHead className="text-xs h-8 py-2">Açıklama</TableHead>
                  <TableHead className="text-xs h-8 py-2">Departman</TableHead>
                  <TableHead className="text-xs text-right h-8 py-2">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="h-8">
                    <TableCell className="text-xs py-2">
                      {new Date(tx.date).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-xs py-2">{tx.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">{tx.department}</TableCell>
                    <TableCell className="text-xs text-right font-medium py-2">
                      {formatAmount(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryDetailSheet;

