import { useMemo } from 'react';
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Payment } from "@/types/payment";

interface UseSupplierPaymentsFilters {
  supplierId: string;
}

export const useSupplierPaymentsInfiniteScroll = (filters: UseSupplierPaymentsFilters) => {
  const { userData } = useCurrentUser();

  const fetchPayments = async (page: number, pageSize: number) => {
    if (!userData?.company_id || !filters.supplierId) {
      return {
        data: [] as Payment[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('supplier_id', filters.supplierId)
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching supplier payments:', error);
      throw error;
    }

    // Her ödeme için hesap ve check bilgisini al
    const paymentsWithAccounts = await Promise.all(
      (data || []).map(async (payment: any) => {
        let accountName = "Bilinmeyen Hesap";
        let bankName = null;
        let checkData = null;
        
        try {
          // Hesap bilgisini çek
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
          
          // Check bilgisini çek (eğer check_id varsa)
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
          console.error('Error fetching account/check:', err);
        }
        
        const result: any = {
          ...payment,
        };
        
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

    return {
      data: paymentsWithAccounts as Payment[],
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize
    };
  };

  return useInfiniteScroll(
    ["supplier-payments", filters.supplierId, userData?.company_id],
    fetchPayments,
    {
      pageSize: 20,
      enabled: !!filters.supplierId && !!userData?.company_id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
};

