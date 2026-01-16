import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { toast } from "sonner";

export const useDeletePayment = (supplier: Supplier, companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Payment) => {
      if (!companyId) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const balanceChange = payment.payment_direction === 'incoming' 
        ? -Number(payment.amount)
        : Number(payment.amount);

      // Hesap bakiyesini geri al
      if (payment.account_id && (payment as any).account_type) {
        const accountType = (payment as any).account_type;
        const accountBalanceChange = payment.payment_direction === 'incoming' ? -Number(payment.amount) : Number(payment.amount);

        if (accountType === 'bank') {
          const { data: bankAccount } = await supabase
            .from("bank_accounts")
            .select("current_balance, available_balance")
            .eq("id", payment.account_id)
            .single();

          if (bankAccount) {
            const newCurrentBalance = bankAccount.current_balance - accountBalanceChange;
            const newAvailableBalance = bankAccount.available_balance - accountBalanceChange;
            await supabase
              .from("bank_accounts")
              .update({
                current_balance: newCurrentBalance,
                available_balance: newAvailableBalance,
              })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'cash') {
          const { data: cashAccount } = await supabase
            .from("cash_accounts")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (cashAccount) {
            const newCurrentBalance = cashAccount.current_balance - accountBalanceChange;
            await supabase
              .from("cash_accounts")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'credit_card') {
          const { data: cardAccount } = await supabase
            .from("credit_cards")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (cardAccount) {
            const newCurrentBalance = cardAccount.current_balance - accountBalanceChange;
            await supabase
              .from("credit_cards")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        } else if (accountType === 'partner') {
          const { data: partnerAccount } = await supabase
            .from("partner_accounts")
            .select("current_balance")
            .eq("id", payment.account_id)
            .single();

          if (partnerAccount) {
            const newCurrentBalance = partnerAccount.current_balance - accountBalanceChange;
            await supabase
              .from("partner_accounts")
              .update({ current_balance: newCurrentBalance })
              .eq("id", payment.account_id);
          }
        }
      }

      // Tedarikçi bakiyesini güncelle
      const { data: supplierData } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", supplier.id)
        .single();

      if (supplierData) {
        const newBalance = (supplierData.balance || 0) + balanceChange;
        const { error: updateError } = await supabase
          .from("suppliers")
          .update({ balance: newBalance })
          .eq("id", supplier.id);

        if (updateError) throw updateError;
      }

      // Payment'ı sil
      const { error: deleteError } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success("Ödeme başarıyla silindi");

      if (supplier.id) {
        queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplier.id, companyId] });
        queryClient.invalidateQueries({ queryKey: ["supplier", supplier.id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-purchase-invoices", supplier.id, companyId] });
        queryClient.invalidateQueries({ queryKey: ["supplier-sales-invoices", supplier.id, companyId] });
      }

      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ödeme silinirken bir hata oluştu");
    }
  });
};
