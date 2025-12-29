import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/payment";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const usePaymentsQuery = (customer: Customer) => {
  const { userData, loading: userLoading } = useCurrentUser();

  return useQuery({
    queryKey: ['customer-payments', customer.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for payments');
        return [];
      }

      // RLS politikası zaten company_id kontrolü yapıyor
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });
      
      // Debug: Eğer data boşsa ve error yoksa, RLS sorunu olabilir
      if (!data || data.length === 0) {
        console.log('Payments query returned empty. Customer ID:', customer.id, 'Company ID:', userData.company_id);
      }

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      // Her ödeme için hesap bilgisini manuel olarak çek
      const paymentsWithAccounts = await Promise.all(
        (data || []).map(async (payment: any) => {
          if (payment.account_id && payment.account_type) {
            let accountName = "Bilinmeyen Hesap";
            let bankName = null;
            
            try {
              if (payment.account_type === 'bank') {
                const { data: bankAccount } = await supabase
                  .from('bank_accounts')
                  .select('account_name, bank_name')
                  .eq('id', payment.account_id)
                  .single();
                if (bankAccount) {
                  accountName = bankAccount.account_name;
                  bankName = bankAccount.bank_name;
                }
              } else if (payment.account_type === 'cash') {
                const { data: cashAccount } = await supabase
                  .from('cash_accounts')
                  .select('name')
                  .eq('id', payment.account_id)
                  .single();
                if (cashAccount) {
                  accountName = cashAccount.name;
                }
              } else if (payment.account_type === 'credit_card') {
                const { data: cardAccount } = await supabase
                  .from('credit_cards')
                  .select('card_name, bank_name')
                  .eq('id', payment.account_id)
                  .single();
                if (cardAccount) {
                  accountName = cardAccount.card_name;
                  bankName = cardAccount.bank_name;
                }
              } else if (payment.account_type === 'partner') {
                const { data: partnerAccount } = await supabase
                  .from('partner_accounts')
                  .select('partner_name')
                  .eq('id', payment.account_id)
                  .single();
                if (partnerAccount) {
                  accountName = partnerAccount.partner_name;
                }
              }
            } catch (err) {
              console.error('Error fetching account for payment:', err);
            }
            
            return {
              ...payment,
              accounts: {
                name: accountName,
                account_type: payment.account_type,
                bank_name: bankName
              }
            };
          }
          
          return payment;
        })
      );

      return paymentsWithAccounts as Payment[];
    },
    enabled: !!customer.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};

