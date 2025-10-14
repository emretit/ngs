import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface PaymentsListProps {
  supplier: Supplier;
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
}

export const PaymentsList = ({ supplier }: PaymentsListProps) => {
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['supplier-payments', supplier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('supplier_id', supplier.id)
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
      default:
        return paymentType;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Tamamlandı
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Bekliyor
          </span>
        );
      case 'failed':
        return (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            Başarısız
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesDirection = directionFilter === 'all' || payment.payment_direction === directionFilter;
    return matchesDirection;
  });

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
            <TableHead>Açıklama</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments?.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {format(new Date(payment.payment_date), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>{formatPaymentType(payment.payment_type)}</TableCell>
              <TableCell>
                {payment.payment_direction === 'incoming' ? 'Tedarikçi İadesi' : 'Tedarikçi Ödemesi'}: {supplier.name || supplier.company}
                {payment.description && ` - ${payment.description}`}
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
              <TableCell>
                {getStatusBadge(payment.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};