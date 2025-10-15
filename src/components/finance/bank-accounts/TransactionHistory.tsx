import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Download } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface TransactionHistoryProps {
  accountId: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  status: string;
  transaction_type?: string;
  payment_type?: string;
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
}

const TransactionHistory = ({ accountId }: TransactionHistoryProps) => {
  const [selectedType, setSelectedType] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", accountId],
    queryFn: async () => {
      const [bankTransactions, payments] = await Promise.all([
        supabase
          .from("bank_transactions")
          .select("*")
          .eq("account_id", accountId)
          .order("transaction_date", { ascending: false }),
        
        supabase
          .from("payments")
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq("bank_account_id", accountId)
          .order("payment_date", { ascending: false })
      ]);

      if (bankTransactions.error) throw bankTransactions.error;
      if (payments.error) throw payments.error;

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        status: "completed",
        payment_type: payment.payment_type,
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction
      }));

      const allTransactions = [
        ...bankTransactions.data,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions;
    },
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }


  const formatTransactionType = (transaction: Transaction) => {
    if (transaction.payment_type) {
      switch (transaction.payment_type) {
        case "havale":
          return "Havale";
        case "eft":
          return "EFT";
        case "kredi_karti":
          return "Kredi Kartı";
        case "nakit":
          return "Nakit";
        default:
          return transaction.payment_type;
      }
    } else if (transaction.transaction_type) {
      switch (transaction.transaction_type) {
        case "giris":
          return "Giriş";
        case "cikis":
          return "Çıkış";
        case "havale":
          return "Havale";
        case "eft":
          return "EFT";
        case "swift":
          return "SWIFT";
        default:
          return transaction.transaction_type;
      }
    }
    return "Diğer";
  };

  const getDescription = (transaction: any) => {
    if (transaction.customer_name) {
      return `${transaction.payment_direction === 'incoming' ? 'Müşteri Ödemesi' : 'Müşteri İadesi'}: ${transaction.customer_name}`;
    }
    if (transaction.supplier_name) {
      return `${transaction.payment_direction === 'outgoing' ? 'Tedarikçi Ödemesi' : 'Tedarikçi İadesi'}: ${transaction.supplier_name}`;
    }
    return transaction.description || "-";
  };

  const isPositiveAmount = (transaction: any) => {
    if (transaction.payment_direction) {
      return transaction.payment_direction === 'incoming';
    }
    return transaction.amount >= 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Son İşlemler</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Bu Ay: {transactions?.length || 0} İşlem
          </span>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm İşlemler</SelectItem>
              <SelectItem value="incoming">Gelen</SelectItem>
              <SelectItem value="outgoing">Giden</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Ekstre İndir</span>
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>İşlem</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Bakiye</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.transaction_date), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>{formatTransactionType(transaction)}</TableCell>
              <TableCell>{getDescription(transaction)}</TableCell>
              <TableCell className="text-right">
                <span className={isPositiveAmount(transaction) ? "text-green-600" : "text-red-600"}>
                  {transaction.amount.toLocaleString("tr-TR", {
                    style: "currency",
                    currency: transaction.currency,
                    signDisplay: "always"
                  })}
                </span>
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Tamamlandı
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionHistory;
