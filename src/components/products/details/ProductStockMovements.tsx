import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ProductStockMovementsProps {
  productId: string;
}

export const ProductStockMovements = ({ productId }: ProductStockMovementsProps) => {
  // TODO: inventory_transactions tablosu hazır olduğunda gerçek verileri çek
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['product-stock-movements', productId],
    queryFn: async () => {
      // Şimdilik boş array döndür, gerçek implementasyon inventory_transactions hazır olduğunda yapılacak
      // const { data, error } = await supabase
      //   .from('inventory_transactions')
      //   .select(`
      //     *,
      //     inventory_transaction_items!inner(
      //       product_id,
      //       quantity,
      //       unit
      //     )
      //   `)
      //   .eq('inventory_transaction_items.product_id', productId)
      //   .order('transaction_date', { ascending: false })
      //   .limit(50);
      
      // if (error) throw error;
      // return data || [];
      return [];
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            Stok Hareketleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (movements.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            Stok Hareketleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Stok Hareketi Bulunamadı</h3>
            <p className="text-xs text-gray-600">Bu ürün için henüz stok hareketi kaydı bulunmuyor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          Stok Hareketleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tarih</TableHead>
              <TableHead className="text-xs">İşlem Tipi</TableHead>
              <TableHead className="text-xs">Miktar</TableHead>
              <TableHead className="text-xs">Depo</TableHead>
              <TableHead className="text-xs">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement: any) => (
              <TableRow key={movement.id}>
                <TableCell className="text-xs">
                  {format(new Date(movement.transaction_date), 'dd MMM yyyy', { locale: tr })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {movement.transaction_type === 'giris' ? 'Giriş' :
                     movement.transaction_type === 'cikis' ? 'Çıkış' :
                     movement.transaction_type === 'transfer' ? 'Transfer' :
                     movement.transaction_type === 'sayim' ? 'Sayım' : movement.transaction_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {movement.items?.[0]?.quantity || 0} {movement.items?.[0]?.unit || 'adet'}
                </TableCell>
                <TableCell className="text-xs">
                  {movement.warehouse_name || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      movement.status === 'completed' ? 'default' :
                      movement.status === 'approved' ? 'secondary' :
                      movement.status === 'pending' ? 'outline' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {movement.status === 'completed' ? 'Tamamlandı' :
                     movement.status === 'approved' ? 'Onaylı' :
                     movement.status === 'pending' ? 'Bekliyor' : movement.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

