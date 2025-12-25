import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface IncomingEInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  amount: number;
  date: string;
  currency: string;
}

interface IncomingEInvoicesWidgetProps {
  invoices: IncomingEInvoice[];
  isLoading?: boolean;
}

const IncomingEInvoicesWidget = ({ invoices, isLoading }: IncomingEInvoicesWidgetProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Gelen E-Faturalar
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Gelen E-Faturalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Yeni gelen e-fatura bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Gelen E-Faturalar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.slice(0, 5).map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
            onClick={() => navigate(`/einvoices/received/${invoice.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {invoice.supplierName}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(invoice.date), "d MMMM yyyy", { locale: tr })} • {invoice.invoiceNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                ₺{invoice.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {invoices.length > 5 && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/einvoices/received")}
          >
            Tümünü Gör ({invoices.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomingEInvoicesWidget;

