import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/payment";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

export const useDeletePayment = (customer: Customer) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  return useMutation({
    mutationFn: async (payment: Payment) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Payment direction'a göre bakiye değişikliğini tersine çevir
      // Müşteri için: incoming = bakiye azalır, outgoing = bakiye artar
      // Silme işleminde tersini yap
      const balanceChange = payment.payment_direction === 'incoming' 
        ? Number(payment.amount)  // Gelen ödeme silinirse bakiye artar
        : -Number(payment.amount); // Giden ödeme silinirse bakiye azalır

      // Hesap bakiyesini geri al (eğer hesap varsa)
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

      // Müşteri bakiyesini güncelle
      const { data: customerData } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customer.id)
        .single();

      if (customerData) {
        const newBalance = (customerData.balance || 0) + balanceChange;
        const { error: updateError } = await supabase
          .from("customers")
          .update({ balance: newBalance })
          .eq("id", customer.id);

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
      
      // Sadece ilgili customer için spesifik query'leri invalidate et
      if (customer.id) {
        queryClient.invalidateQueries({ queryKey: ["customer-payments", customer.id, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
        queryClient.invalidateQueries({ queryKey: ["customer-payment-stats", customer.id] });
      }
      
      // Genel query'leri invalidate et (customer.id olmadan)
      queryClient.invalidateQueries({ 
        queryKey: ["customers"],
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ödeme silinirken bir hata oluştu");
    }
  });
};

