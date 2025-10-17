import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface PaymentsListProps {
  supplier: Supplier;
}


export const PaymentsList = ({ supplier }: PaymentsListProps) => {
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['supplier-payments', supplier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bank_accounts(account_name, bank_name)
        `)
        .eq('supplier_id', supplier.id)
        .eq('company_id', supplier.company_id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 10 * 60 * 1000, // 10 dakika
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
    if (payment.description?.includes('Ortak Hesabı')) {
      return payment.description;
    }
    if (payment.description?.includes('Kredi Kartı')) {
      return payment.description;
    }
    return "Diğer Hesap";
  };


  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesDirection = directionFilter === 'all' || payment.payment_direction === directionFilter;
      return matchesDirection;
    });
  }, [payments, directionFilter]);

  // Toplam bakiye hesapla
  const totalBalance = useMemo(() => {
    return payments.reduce((total, payment) => {
      if (payment.payment_direction === 'incoming') {
        return total + Number(payment.amount);
      } else {
        return total - Number(payment.amount);
      }
    }, 0);
  }, [payments]);

  // Her ödeme için kümülatif bakiye hesapla
  const calculateCumulativeBalance = useMemo(() => {
    return (index: number) => {
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
  }, [payments]);

  if (error) {
    return <div className="text-red-500">Ödeme işlemleri yüklenirken hata oluştu.</div>;
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