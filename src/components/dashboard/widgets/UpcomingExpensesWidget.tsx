import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UpcomingExpense {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
}

interface UpcomingExpensesWidgetProps {
  expenses: UpcomingExpense[];
  isLoading?: boolean;
}

const UpcomingExpensesWidget = ({ expenses, isLoading }: UpcomingExpensesWidgetProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Yaklaşan Masraflar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Yaklaşan Masraflar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Yaklaşan masraf bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-600" />
          Yaklaşan Masraflar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.slice(0, 5).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
            onClick={() => navigate(`/expenses/${expense.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {expense.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(expense.date), "d MMMM yyyy", { locale: tr })} • {expense.category}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                ₺{expense.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {expenses.length > 5 && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/expenses")}
          >
            Tümünü Gör ({expenses.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingExpensesWidget;

