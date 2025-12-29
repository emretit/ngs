import { useMemo } from "react";
import { Payment } from "@/types/payment";

export const usePaymentStats = (payments: Payment[], currentBalance: number) => {
  return useMemo(() => {
    const totalIncoming = payments
      .filter(p => p.payment_direction === 'incoming')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalOutgoing = payments
      .filter(p => p.payment_direction === 'outgoing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      currentBalance: currentBalance || 0,
      totalIncoming,
      totalOutgoing,
    };
  }, [payments, currentBalance]);
};

