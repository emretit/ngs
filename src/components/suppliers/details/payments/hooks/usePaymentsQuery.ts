import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { logger } from "@/utils/logger";

export const usePaymentsQuery = (supplier: Supplier, companyId: string | undefined, isEnabled: boolean) => {
  return useQuery({
    queryKey: ['supplier-payments', supplier.id, companyId],
    queryFn: async () => {
      if (!companyId) {
        logger.warn('No company_id available for payments');
        return [];
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('payment_date', { ascending: false });
      
      if (!data || data.length === 0) {
        logger.debug('Payments query returned empty. Supplier ID:', supplier.id, 'Company ID:', companyId);
      }

      if (error) {
        logger.error('Error fetching payments:', error);
        throw error;
      }
      
      // Her ödeme için hesap ve check bilgisini al
      const paymentsWithAccounts = await Promise.all(
        (data || []).map(async (payment: any) => {
          let accountName = "Bilinmeyen Hesap";
          let bankName = null;
          let checkData = null;
          
          try {
            if (payment.account_id && payment.account_type) {
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
            }
            
            if (payment.check_id) {
              const { data: check } = await supabase
                .from('checks')
                .select('id, check_number, bank, due_date, status')
                .eq('id', payment.check_id)
                .single();
              
              if (check) {
                checkData = {
                  id: check.id,
                  check_number: check.check_number,
                  bank: check.bank,
                  due_date: check.due_date,
                  status: check.status,
                };
              }
            }
          } catch (err) {
            logger.error('Error fetching account/check:', err);
          }
          
          const result: any = { ...payment };
          
          if (payment.account_id && payment.account_type) {
            result.accounts = {
              name: accountName,
              account_type: payment.account_type,
              bank_name: bankName
            };
          }
          
          if (checkData) {
            result.check = checkData;
          }
          
          return result;
        })
      );
      
      return paymentsWithAccounts as Payment[];
    },
    enabled: !!supplier.id && isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};
