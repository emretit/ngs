import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";

interface ProductOrdersTabProps {
  productId: string;
}

export const ProductOrdersTab = ({ productId }: ProductOrdersTabProps) => {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['product-orders', productId],
    queryFn: async () => {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          quantity,
          unit_price,
          total_price,
          tax_rate,
          discount_rate,
          currency,
          created_at,
          orders (
            id,
            order_number,
            customer_id,
            status,
            order_date,
            total_amount,
            customers (
              id,
              name,
              company
            )
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orderItems || [];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Siparişler yükleniyor...</p>
        </div>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sipariş Bulunamadı</h3>
          <p className="text-gray-600">Bu ürün henüz hiçbir siparişte kullanılmamış.</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Taslak", variant: "outline" },
      pending: { label: "Beklemede", variant: "secondary" },
      confirmed: { label: "Onaylandı", variant: "default" },
      processing: { label: "İşleniyor", variant: "default" },
      shipped: { label: "Kargoda", variant: "default" },
      delivered: { label: "Teslim Edildi", variant: "secondary" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Siparişler ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-center">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((item: any) => {
              const order = item.orders;
              const customer = order?.customers;
              return (
                <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {order?.order_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {customer?.company || customer?.name || 'Müşteri Bilgisi Yok'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price, item.currency || 'TRY')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_price, item.currency || 'TRY')}
                  </TableCell>
                  <TableCell>
                    {order?.status ? getStatusBadge(order.status) : '-'}
                  </TableCell>
                  <TableCell>
                    {order?.order_date ? formatDate(order.order_date) : formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order?.id}`);
                        }}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

