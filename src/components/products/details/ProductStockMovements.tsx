import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRightLeft, ArrowDown, ArrowUp, Package, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductStockMovementsProps {
  productId: string;
}

interface StockMovement {
  id: string;
  transaction_type: 'giris' | 'cikis' | 'transfer' | 'sayim';
  status: 'pending' | 'approved' | 'completed';
  transaction_date: string;
  transaction_number?: string;
  warehouse_name?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  quantity: number;
  unit: string;
  reference_number?: string;
  notes?: string;
}

export const ProductStockMovements = ({ productId }: ProductStockMovementsProps) => {
  const navigate = useNavigate();
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['product-stock-movements', productId],
    queryFn: async () => {
      // Kullanıcının company_id'sini al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Bu ürün için stok hareketlerini çek
      const { data: transactionItems, error: itemsError } = await supabase
        .from('inventory_transaction_items')
        .select('transaction_id, quantity, unit')
        .eq('product_id', productId);

      if (itemsError) throw itemsError;
      if (!transactionItems || transactionItems.length === 0) return [];

      const transactionIds = transactionItems.map(item => item.transaction_id);

      // Transaction'ları çek ve warehouse bilgilerini join et
      const { data: transactions, error: transactionsError } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          transaction_type,
          status,
          transaction_date,
          transaction_number,
          warehouse_id,
          from_warehouse_id,
          to_warehouse_id,
          reference_number,
          notes
        `)
        .in('id', transactionIds)
        
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      if (!transactions || transactions.length === 0) return [];

      // Warehouse ID'lerini topla
      const warehouseIds = new Set<string>();
      transactions.forEach((t: any) => {
        if (t.warehouse_id) warehouseIds.add(t.warehouse_id);
        if (t.from_warehouse_id) warehouseIds.add(t.from_warehouse_id);
        if (t.to_warehouse_id) warehouseIds.add(t.to_warehouse_id);
      });

      // Warehouse bilgilerini çek
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name')
        .in('id', Array.from(warehouseIds));

      const warehouseMap = new Map(
        (warehouses || []).map((w: any) => [w.id, w.name])
      );

      // Transaction'ları item'larla birleştir
      const movements: StockMovement[] = transactions.map((transaction: any) => {
        const item = transactionItems.find((ti: any) => ti.transaction_id === transaction.id);
        return {
          id: transaction.id,
          transaction_type: transaction.transaction_type,
          status: transaction.status,
          transaction_date: transaction.transaction_date,
          transaction_number: transaction.transaction_number,
          warehouse_name: transaction.warehouse_id ? warehouseMap.get(transaction.warehouse_id) : undefined,
          from_warehouse_name: transaction.from_warehouse_id ? warehouseMap.get(transaction.from_warehouse_id) : undefined,
          to_warehouse_name: transaction.to_warehouse_id ? warehouseMap.get(transaction.to_warehouse_id) : undefined,
          quantity: Number(item?.quantity || 0),
          unit: item?.unit || 'adet',
          reference_number: transaction.reference_number,
          notes: transaction.notes,
        };
      });

      return movements;
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-lg border border-gray-200">
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
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (movements.length === 0) {
    return (
      <Card className="rounded-lg border border-gray-200">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              Stok Hareketleri
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => navigate(`/inventory/transactions?product_id=${productId}`)}
            >
              Tümünü Gör
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-500">Stok hareketi kaydı bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border border-gray-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            Stok Hareketleri
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => navigate(`/inventory/transactions?product_id=${productId}`)}
          >
            Tümünü Gör
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">Tarih</TableHead>
                <TableHead className="text-xs h-8">Tip</TableHead>
                <TableHead className="text-xs h-8">Miktar</TableHead>
                <TableHead className="text-xs h-8">Depo</TableHead>
                <TableHead className="text-xs h-8">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id} className="h-8">
                  <TableCell className="text-xs py-1.5">
                    <div className="flex flex-col">
                      <span>{format(new Date(movement.transaction_date), 'dd MMM yyyy', { locale: tr })}</span>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(movement.transaction_date), 'HH:mm', { locale: tr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      {movement.transaction_type === 'giris' && (
                        <ArrowDown className="h-3 w-3 text-green-600" />
                      )}
                      {movement.transaction_type === 'cikis' && (
                        <ArrowUp className="h-3 w-3 text-red-600" />
                      )}
                      {movement.transaction_type === 'transfer' && (
                        <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                      )}
                      {movement.transaction_type === 'sayim' && (
                        <Package className="h-3 w-3 text-purple-600" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          movement.transaction_type === 'giris' ? 'border-green-200 text-green-700' :
                          movement.transaction_type === 'cikis' ? 'border-red-200 text-red-700' :
                          movement.transaction_type === 'transfer' ? 'border-blue-200 text-blue-700' :
                          'border-purple-200 text-purple-700'
                        }`}
                      >
                        {movement.transaction_type === 'giris' ? 'Giriş' :
                         movement.transaction_type === 'cikis' ? 'Çıkış' :
                         movement.transaction_type === 'transfer' ? 'Transfer' :
                         movement.transaction_type === 'sayim' ? 'Sayım' : movement.transaction_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 font-medium">
                    {movement.quantity} {movement.unit}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {movement.transaction_type === 'transfer' ? (
                      <div className="flex flex-col">
                        <span className="text-red-600">← {movement.from_warehouse_name || '-'}</span>
                        <span className="text-green-600">→ {movement.to_warehouse_name || '-'}</span>
                      </div>
                    ) : (
                      <span>{movement.warehouse_name || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5">
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
        </div>
      </CardContent>
    </Card>
  );
};

