import { useState, useCallback } from "react";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentsList } from "./PaymentsList";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { Supplier } from "@/types/supplier";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentsTabProps {
  supplier: Supplier;
}

export const PaymentsTab = ({ supplier }: PaymentsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"hesap" | "cek" | "senet" | null>(null);

  const handleMethodSelect = useCallback((method: { type: "hesap" | "cek" | "senet" }) => {
    setSelectedPaymentType(method.type);
    setIsDialogOpen(true);
  }, []);

  // Fetch payment statistics
  const { data: paymentStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['supplier-payment-stats', supplier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_direction, status')
        .eq('supplier_id', supplier.id);

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
              {supplier.balance?.toLocaleString('tr-TR', {
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
              Tedarikçiden alınan tutar
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
              Tedarikçiye ödenen tutar
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
                {supplier.name || supplier.company} ile yapılan tüm finansal işlemler
              </p>
            </div>
            <PaymentMethodSelector 
              onMethodSelect={handleMethodSelect}
            />
          </div>
        </CardHeader>
        <CardContent>
          <PaymentsList supplier={supplier} />
        </CardContent>
      </Card>

      <PaymentDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPaymentType(null);
        }}
        supplier={supplier}
        defaultPaymentType={selectedPaymentType}
      />
    </div>
  );
};