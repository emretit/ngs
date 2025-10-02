import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface ThreeWayMatchData {
  po_line_id?: string;
  description: string;
  ordered_qty: number;
  received_qty: number;
  invoiced_qty: number;
  po_unit_price: number;
  invoice_unit_price: number;
  po_line_total: number;
  invoice_line_total: number;
  match_status: 'matched' | 'under_received' | 'over_received' | 'over_invoiced' | 'price_variance' | 'partial';
}

interface ThreeWayMatchWidgetProps {
  data: ThreeWayMatchData[];
}

const getStatusBadge = (status: string) => {
  const configs = {
    matched: { 
      label: "Eşleşti", 
      variant: "default" as const, 
      icon: CheckCircle,
      color: "text-green-600"
    },
    partial: { 
      label: "Kısmi", 
      variant: "secondary" as const, 
      icon: AlertTriangle,
      color: "text-yellow-600"
    },
    under_received: { 
      label: "Az Teslim", 
      variant: "secondary" as const, 
      icon: AlertTriangle,
      color: "text-yellow-600"
    },
    over_received: { 
      label: "Fazla Teslim", 
      variant: "destructive" as const, 
      icon: AlertCircle,
      color: "text-red-600"
    },
    over_invoiced: { 
      label: "Fazla Fatura", 
      variant: "destructive" as const, 
      icon: AlertCircle,
      color: "text-red-600"
    },
    price_variance: { 
      label: "Fiyat Farkı", 
      variant: "secondary" as const, 
      icon: AlertTriangle,
      color: "text-orange-600"
    },
  };
  
  const config = configs[status as keyof typeof configs] || configs.matched;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default function ThreeWayMatchWidget({ data }: ThreeWayMatchWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">3 Yönlü Eşleştirme</h3>
        <p className="text-sm text-muted-foreground">
          Bu fatura için PO bağlantısı yok.
        </p>
      </Card>
    );
  }

  const allMatched = data.every(line => line.match_status === 'matched');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">3 Yönlü Eşleştirme</h3>
        {allMatched ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Tümü Eşleşti
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Uyuşmazlık Var
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead className="text-right">Sipariş</TableHead>
              <TableHead className="text-right">Teslim</TableHead>
              <TableHead className="text-right">Fatura</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((line, index) => (
              <TableRow key={line.po_line_id || index}>
                <TableCell className="font-medium text-sm">
                  {line.description}
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm">{line.ordered_qty}</div>
                  <div className="text-xs text-muted-foreground">
                    {line.po_unit_price.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`text-sm ${
                    line.received_qty < line.ordered_qty 
                      ? 'text-yellow-600' 
                      : line.received_qty > line.ordered_qty 
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {line.received_qty}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`text-sm ${
                    line.invoiced_qty > line.received_qty 
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {line.invoiced_qty}
                  </div>
                  <div className={`text-xs ${
                    Math.abs(line.invoice_unit_price - line.po_unit_price) > 0.01
                      ? 'text-orange-600'
                      : 'text-muted-foreground'
                  }`}>
                    {line.invoice_unit_price.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(line.match_status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Legend:</strong></p>
          <p>• Sipariş: Sipariş edilen miktar ve fiyat</p>
          <p>• Teslim: GRN'de teslim alınan miktar</p>
          <p>• Fatura: Faturada yer alan miktar ve fiyat</p>
        </div>
      </div>
    </Card>
  );
}
