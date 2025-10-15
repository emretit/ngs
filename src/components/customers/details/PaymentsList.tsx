
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface PaymentsListProps {
  customer: Customer;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed';
  payment_direction: 'incoming' | 'outgoing';
  payment_type: string;
  description: string;
  recipient_name: string;
  bank_account_id?: string;
  cash_account_id?: string;
  credit_card_id?: string;
  partner_account_id?: string;
  bank_accounts?: { account_name: string; bank_name: string };
  cash_accounts?: { account_name: string };
  credit_cards?: { card_name: string; bank_name: string };
  partner_accounts?: { name: string };
}

export const PaymentsList = ({ customer }: PaymentsListProps) => {
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['customer-payments', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bank_accounts(account_name, bank_name)
        `)
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const formatPaymentType = (paymentType: string) => {
    switch (paymentType) {
      case "havale":
        return "Havale";
      case "eft":
        return "EFT";
      case "kredi_karti":
        return "Kredi Kartı";
      case "nakit":
        return "Nakit";
      case "hesap":
        return "Hesap";
      case "cek":
        return "Çek";
      case "senet":
        return "Senet";
      default:
        return paymentType;
    }
  };

  const getAccountName = (payment: Payment) => {
    if (payment.bank_accounts) {
      return `${payment.bank_accounts.account_name} - ${payment.bank_accounts.bank_name}`;
    }
    return "Bilinmeyen Hesap";
  };


  const filteredPayments = payments.filter(payment => {
    const matchesDirection = directionFilter === 'all' || payment.payment_direction === directionFilter;
    return matchesDirection;
  });

  // Toplam bakiye hesapla
  const totalBalance = payments.reduce((total, payment) => {
    if (payment.payment_direction === 'incoming') {
      return total + Number(payment.amount);
    } else {
      return total - Number(payment.amount);
    }
  }, 0);

  // Her ödeme için kümülatif bakiye hesapla
  const calculateCumulativeBalance = (index: number) => {
    let balance = 0;
    for (let i = 0; i <= index; i++) {
      const payment = payments[i];
      if (payment.payment_direction === 'incoming') {
        balance += Number(payment.amount);
      } else {
        balance -= Number(payment.amount);
      }
    }
    return balance;
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Toplam: {payments?.length || 0} İşlem
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            totalBalance >= 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            Bakiye: {totalBalance.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY"
            })}
          </span>
        </div>
        <div className="flex gap-2">
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Yön" />
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
            <TableHead>Hesap</TableHead>
            <TableHead className="w-48">Açıklama</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead className="text-right">Toplam Bakiye</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments?.map((payment, index) => {
            const cumulativeBalance = calculateCumulativeBalance(index);
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.payment_date), "dd.MM.yyyy")}
                </TableCell>
                <TableCell>{formatPaymentType(payment.payment_type)}</TableCell>
                <TableCell className="font-medium">
                  {getAccountName(payment)}
                </TableCell>
                <TableCell className="w-48">
                  <div className="truncate" title={payment.description || 'Açıklama yok'}>
                    {payment.description || 'Açıklama yok'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={payment.payment_direction === 'incoming' ? "text-green-600" : "text-red-600"}>
                    {payment.amount.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: payment.currency || 'TRY',
                      signDisplay: "always"
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cumulativeBalance >= 0 ? "text-green-600" : "text-red-600"}>
                    {cumulativeBalance.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: payment.currency || 'TRY'
                    })}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
