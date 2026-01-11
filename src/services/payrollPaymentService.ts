/**
 * Payroll Payment Service
 * 
 * Bordro ödeme işlemleri servisi.
 * Bordro ödemelerini bank/cash transactions ile ilişkilendirir.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProcessPayrollPaymentOptions {
  payrollFinanceEntryId: string;
  accountId: string;
  accountType: 'bank' | 'cash' | 'credit_card' | 'partner';
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  userId?: string;
}

export interface BulkPayrollPaymentOptions {
  payrollFinanceEntryIds: string[];
  accountId: string;
  accountType: 'bank' | 'cash';
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  userId?: string;
}

/**
 * Tekil bordro ödemesi işle
 */
export async function processPayrollPayment(
  options: ProcessPayrollPaymentOptions
) {
  const {
    payrollFinanceEntryId,
    accountId,
    accountType,
    paymentDate,
    paymentMethod = 'banka_havalesi',
    notes,
    userId,
  } = options;

  try {
    // 1. Finance entry bilgisini al
    const { data: financeEntry, error: entryError } = await supabase
      .from('payroll_finance_entries')
      .select('*, employees(first_name, last_name), company_id')
      .eq('id', payrollFinanceEntryId)
      .single();

    if (entryError || !financeEntry) {
      throw new Error(`Finance entry bulunamadı: ${entryError?.message || 'Bilinmeyen hata'}`);
    }

    if (financeEntry.payment_status === 'paid') {
      throw new Error('Bu bordro zaten ödenmiş');
    }

    const employee = financeEntry.employees as any;
    const description = `Maaş Ödemesi: ${employee?.first_name} ${employee?.last_name}`;
    const reference = `PAYROLL-${financeEntry.id.substring(0, 8)}`;

    // 2. Bank/Cash transaction oluştur
    let transactionId: string | null = null;

    if (accountType === 'bank') {
      const { data: transaction, error: transactionError } = await supabase
        .from('bank_transactions')
        .insert({
          account_id: accountId,
          type: 'expense',
          amount: financeEntry.net_salary_payable,
          description,
          reference,
          transaction_date: paymentDate.toISOString().split('T')[0],
          company_id: financeEntry.company_id,
          category: 'maas_odemesi',
        })
        .select('id')
        .single();

      if (transactionError) {
        throw new Error(`Bank transaction oluşturulamadı: ${transactionError.message}`);
      }

      transactionId = transaction.id;

      // Banka hesap bakiyesini güncelle (RPC function kullanılabilir)
      const { data: bankAccount, error: accountFetchError } = await supabase
        .from('bank_accounts')
        .select('current_balance, available_balance')
        .eq('id', accountId)
        .single();

      if (!accountFetchError && bankAccount) {
        const newBalance = bankAccount.current_balance - financeEntry.net_salary_payable;
        await supabase
          .from('bank_accounts')
          .update({
            current_balance: newBalance,
            available_balance: newBalance,
          })
          .eq('id', accountId);
      }
    } else if (accountType === 'cash') {
      const { data: transaction, error: transactionError } = await supabase
        .from('cash_transactions')
        .insert({
          account_id: accountId,
          type: 'expense',
          amount: financeEntry.net_salary_payable,
          description,
          reference,
          transaction_date: paymentDate.toISOString().split('T')[0],
          company_id: financeEntry.company_id,
          category: 'maas_odemesi',
        })
        .select('id')
        .single();

      if (transactionError) {
        throw new Error(`Cash transaction oluşturulamadı: ${transactionError.message}`);
      }

      transactionId = transaction.id;

      // Kasa bakiyesini güncelle
      const { data: cashAccount, error: accountFetchError } = await supabase
        .from('cash_accounts')
        .select('current_balance')
        .eq('id', accountId)
        .single();

      if (!accountFetchError && cashAccount) {
        const newBalance = cashAccount.current_balance - financeEntry.net_salary_payable;
        await supabase
          .from('cash_accounts')
          .update({ current_balance: newBalance })
          .eq('id', accountId);
      }
    }

    // 3. Finance entry'yi güncelle
    const { error: updateError } = await supabase
      .from('payroll_finance_entries')
      .update({
        payment_status: 'paid',
        payment_date: paymentDate.toISOString().split('T')[0],
        payment_method: paymentMethod,
        bank_transaction_id: accountType === 'bank' ? transactionId : null,
        cash_transaction_id: accountType === 'cash' ? transactionId : null,
        notes: notes || financeEntry.notes,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payrollFinanceEntryId);

    if (updateError) {
      throw new Error(`Finance entry güncellenemedi: ${updateError.message}`);
    }

    console.log(`✓ Bordro ödemesi tamamlandı: ${financeEntry.id}`);

    return {
      success: true,
      transactionId,
      financeEntryId: financeEntry.id,
    };
  } catch (error: any) {
    console.error('❌ processPayrollPayment error:', error);
    throw error;
  }
}

/**
 * Toplu bordro ödemesi
 */
export async function processBulkPayrollPayment(
  options: BulkPayrollPaymentOptions
) {
  const {
    payrollFinanceEntryIds,
    accountId,
    accountType,
    paymentDate,
    paymentMethod = 'banka_havalesi',
    notes,
    userId,
  } = options;

  const results = {
    success: true,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    failedEntries: [] as Array<{ entryId: string; error: string }>,
    totalAmount: 0,
  };

  for (const entryId of payrollFinanceEntryIds) {
    results.processedCount++;

    try {
      const result = await processPayrollPayment({
        payrollFinanceEntryId: entryId,
        accountId,
        accountType,
        paymentDate,
        paymentMethod,
        notes,
        userId,
      });

      results.successCount++;
      
      // Toplam tutarı hesapla (finance entry'den al)
      const { data: entry } = await supabase
        .from('payroll_finance_entries')
        .select('net_salary_payable')
        .eq('id', entryId)
        .single();
      
      if (entry) {
        results.totalAmount += entry.net_salary_payable;
      }
    } catch (error: any) {
      console.error(`❌ Entry ${entryId} ödeme hatası:`, error);
      results.failedCount++;
      results.failedEntries.push({
        entryId,
        error: error.message,
      });
    }
  }

  results.success = results.failedCount === 0;

  return results;
}

/**
 * Ödeme iptal et
 */
export async function cancelPayrollPayment(
  payrollFinanceEntryId: string,
  reason: string,
  userId?: string
) {
  try {
    const { data: entry, error: entryError } = await supabase
      .from('payroll_finance_entries')
      .select('payment_status, bank_transaction_id, cash_transaction_id')
      .eq('id', payrollFinanceEntryId)
      .single();

    if (entryError || !entry) {
      throw new Error('Finance entry bulunamadı');
    }

    if (entry.payment_status !== 'paid') {
      throw new Error('Bu bordro ödenmiş değil, iptal edilemez');
    }

    // Transaction'ı da iptal et (veya sil)
    if (entry.bank_transaction_id) {
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', entry.bank_transaction_id);
    }

    if (entry.cash_transaction_id) {
      await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', entry.cash_transaction_id);
    }

    // Finance entry'yi cancelled yap
    const { error: updateError } = await supabase
      .from('payroll_finance_entries')
      .update({
        payment_status: 'cancelled',
        notes: `İptal Edildi: ${reason}`,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payrollFinanceEntryId);

    if (updateError) {
      throw new Error(`İptal işlemi başarısız: ${updateError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ cancelPayrollPayment error:', error);
    throw error;
  }
}
