import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { InventoryTransaction } from "@/types/inventory";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";

interface InventoryTransactionsGridProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  onSelectTransaction?: (transaction: InventoryTransaction) => void;
  onTransactionSelect?: (transaction: InventoryTransaction) => void;
  selectedTransactions?: InventoryTransaction[];
}

const InventoryTransactionsGrid = ({
  transactions,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  onSelectTransaction,
  onTransactionSelect,
  selectedTransactions = []
}: InventoryTransactionsGridProps) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'giris':
        return <ArrowDownToLine className="h-5 w-5 text-green-600" />;
      case 'cikis':
        return <ArrowUpFromLine className="h-5 w-5 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      case 'sayim':
        return <ClipboardList className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'giris':
        return 'Giriş';
      case 'cikis':
        return 'Çıkış';
      case 'transfer':
        return 'Transfer';
      case 'sayim':
        return 'Sayım';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">⏳ Bekleyen</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">✅ Onaylı</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300">❌ İptal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-[200px] w-full rounded-md mb-4" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        İşlem bulunamadı
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {transactions.map((transaction) => (
        <Card 
          key={transaction.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectTransaction?.(transaction)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(transaction.transaction_type)}
                <h3 className="font-medium text-sm">{getTypeLabel(transaction.transaction_type)}</h3>
              </div>
              {getStatusBadge(transaction.status)}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium">İşlem No:</span> {transaction.transaction_number || 'N/A'}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Tarih:</span> {transaction.transaction_date 
                  ? format(new Date(transaction.transaction_date), "dd MMM yyyy", { locale: tr })
                  : '-'}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Depo:</span> {transaction.warehouse_name || transaction.warehouse?.name || '-'}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">Ürün Sayısı:</span> {transaction.items?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Infinite Scroll Trigger */}
      <InfiniteScroll
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        className="col-span-full mt-4"
      >
        <div />
      </InfiniteScroll>
    </div>
  );
};

export default InventoryTransactionsGrid;

