
import { useState } from "react";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentsList } from "./PaymentsList";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { Customer } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentsTabProps {
  customer: Customer;
}

export const PaymentsTab = ({ customer }: PaymentsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"hesap" | "cek" | "senet" | null>(null);

  // Fetch payment statistics
  const { data: paymentStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['customer-payment-stats', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_direction, status')
        .eq('customer_id', customer.id);

      if (error) throw error;

      const stats = {
        totalIncoming: 0,
        totalOutgoing: 0,
        pendingCount: 0,
        completedCount: 0,
      };

      data?.forEach(payment => {
        if (payment.payment_direction === 'incoming') {
          stats.totalIncoming += Number(payment.amount);
        } else if (payment.payment_direction === 'outgoing') {
          stats.totalOutgoing += Number(payment.amount);
        }

        if (payment.status === 'pending') {
          stats.pendingCount++;
        } else if (payment.status === 'completed') {
          stats.completedCount++;
        }
      });

      return stats;
    },
  });

  return (
    <div className="space-y-6">
      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bakiye</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.balance?.toLocaleString('tr-TR', { 
                style: 'currency', 
                currency: 'TRY' 
              }) || '₺0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Mevcut bakiye durumu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelen Ödemeler</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? (
                <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                paymentStats?.totalIncoming?.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                }) || '₺0,00'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam alınan tutar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giden Ödemeler</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingStats ? (
                <div className="w-16 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                paymentStats?.totalOutgoing?.toLocaleString('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                }) || '₺0,00'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam ödenen tutar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlem Sayısı</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="w-8 h-6 bg-gray-200 animate-pulse rounded" />
              ) : (
                (paymentStats?.pendingCount || 0) + (paymentStats?.completedCount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <div className="w-20 h-3 bg-gray-200 animate-pulse rounded" />
              ) : (
                `${paymentStats?.completedCount || 0} tamamlandı, ${paymentStats?.pendingCount || 0} bekliyor`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Ödeme Geçmişi</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {customer.name} ile yapılan tüm finansal işlemler
              </p>
            </div>
            <PaymentMethodSelector 
              onMethodSelect={(method) => {
                setSelectedPaymentType(method.type);
                setIsDialogOpen(true);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <PaymentsList customer={customer} />
        </CardContent>
      </Card>
      
      <PaymentDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPaymentType(null);
        }}
        customer={customer}
        defaultPaymentType={selectedPaymentType}
      />
    </div>
  );
};
