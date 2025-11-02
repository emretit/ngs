import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList, MoreHorizontal } from "lucide-react";
import { InventoryTransaction, TransactionType, TransactionStatus } from "@/types/inventory";

interface InventoryTransactionsTableProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  onSelectTransaction: (transaction: InventoryTransaction) => void;
  searchQuery?: string;
  typeFilter?: string;
  statusFilter?: string;
}

const InventoryTransactionsTable = ({
  transactions,
  isLoading,
  onSelectTransaction,
  searchQuery,
  typeFilter,
  statusFilter
}: InventoryTransactionsTableProps) => {
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.transaction_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = typeFilter === "all" || !typeFilter || transaction.transaction_type === typeFilter;
    const matchesStatus = statusFilter === "all" || !statusFilter || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'giris':
        return <Badge variant="outline" className="border-green-500 text-green-700">⬇️ Giriş</Badge>;
      case 'cikis':
        return <Badge variant="outline" className="border-red-500 text-red-700">⬆️ Çıkış</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">↔️ Transfer</Badge>;
      case 'sayim':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">📋 Sayım</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'giris':
        return <ArrowDownToLine className="h-4 w-4" />;
      case 'cikis':
        return <ArrowUpFromLine className="h-4 w-4" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'sayim':
        return <ClipboardList className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">⏳ Bekleyen</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">✅ Onaylı</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">İşlem No</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Tip</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Tarih</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Depo</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ürün Sayısı</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Henüz işlem kaydı bulunmuyor</p>
        <p className="text-sm mt-2">Yeni işlem oluşturmak için üstteki butonları kullanın</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">İşlem No</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Tip</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Tarih</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Depo</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ürün Sayısı</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTransactions.map((transaction) => (
          <TableRow 
            key={transaction.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectTransaction(transaction)}
          >
            <TableCell className="font-medium">
              {transaction.transaction_number || 'N/A'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getTypeIcon(transaction.transaction_type)}
                {getTypeBadge(transaction.transaction_type)}
              </div>
            </TableCell>
            <TableCell>
              {transaction.transaction_date 
                ? format(new Date(transaction.transaction_date), "dd MMM yyyy", { locale: tr })
                : '-'}
            </TableCell>
            <TableCell>
              {transaction.warehouse_name || transaction.warehouse?.name || '-'}
            </TableCell>
            <TableCell>
              {transaction.items?.length || 0} ürün
            </TableCell>
            <TableCell>
              {getStatusBadge(transaction.status)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTransaction(transaction);
                }}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InventoryTransactionsTable;

