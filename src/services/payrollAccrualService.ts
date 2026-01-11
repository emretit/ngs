/**
 * Payroll Accrual Service (Hakediş Sistemi)
 * 
 * Bordro hesaplandıktan sonra çalışanlara hakediş (tahakkuk) oluşturur.
 * payroll_records tablosuna status='tahakkuk_edildi' ile kayıt atar.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

export interface CreatePayrollAccrualOptions {
  payrollRunId: string;
  companyId: string;
  userId?: string;
}

export interface PayrollAccrualResult {
  success: boolean;
  accrualCount: number;
  failedCount: number;
  accrualRecords: Array<{
    employeeId: string;
    recordId: string;
    netSalary: number;
  }>;
}

/**
 * Bordro hesaplandıktan sonra çalışanlara hakediş oluştur
 * payroll_items'dan payroll_records'a dönüştürür
 */
export async function createPayrollAccruals(
  options: CreatePayrollAccrualOptions
): Promise<PayrollAccrualResult> {
  const { payrollRunId, companyId, userId } = options;

  const result: PayrollAccrualResult = {
    success: false,
    accrualCount: 0,
    failedCount: 0,
    accrualRecords: [],
  };

  try {
    logger.debug(`📝 Hakediş oluşturma başlatıldı: ${payrollRunId}`);

    // 1. Payroll run bilgisini al
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .select('*, payroll_period_year, payroll_period_month')
      .eq('id', payrollRunId)
      .single();

    if (runError || !payrollRun) {
      throw new Error(`Payroll run bulunamadı: ${runError?.message || 'Bilinmeyen hata'}`);
    }

    // 2. Payroll items'ları al
    const { data: payrollItems, error: itemsError } = await supabase
      .from('payroll_items')
      .select('*')
      .eq('payroll_run_id', payrollRunId);

    if (itemsError || !payrollItems || payrollItems.length === 0) {
      throw new Error(`Payroll items bulunamadı: ${itemsError?.message || 'Bilinmeyen hata'}`);
    }

    logger.debug(`✓ ${payrollItems.length} payroll item için hakediş oluşturulacak`);

    // 3. Hakediş tarihi (ayın son günü)
    const year = payrollRun.payroll_period_year;
    const month = payrollRun.payroll_period_month;
    const lastDay = new Date(year, month, 0).getDate();
    const accrualDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 4. Her payroll_item için payroll_record oluştur
    const accrualRecords = payrollItems.map((item: any) => ({
      employee_id: item.employee_id,
      payroll_date: accrualDate,
      gross_salary: item.gross_salary,
      net_salary: item.net_salary,
      total_cost: item.total_employer_cost,
      status: 'tahakkuk_edildi' as const, // Hakediş durumu
      notes: `${year}/${month} Dönemi Maaş Hakkedişi - Payroll Run: ${payrollRunId}`,
      processed_at: new Date().toISOString(),
    }));

    // 5. Toplu insert
    const { data: insertedRecords, error: insertError } = await supabase
      .from('payroll_records')
      .insert(accrualRecords)
      .select('id, employee_id, net_salary');

    if (insertError) {
      logger.error('Hakediş kayıtları oluşturulamadı:', insertError);
      throw new Error(`Hakediş kayıtları oluşturulamadı: ${insertError.message}`);
    }

    if (!insertedRecords || insertedRecords.length === 0) {
      throw new Error('Hakediş kayıtları oluşturulamadı');
    }

    result.accrualCount = insertedRecords.length;
    result.accrualRecords = insertedRecords.map((record: any) => ({
      employeeId: record.employee_id,
      recordId: record.id,
      netSalary: record.net_salary,
    }));

    logger.debug(`✓ ${result.accrualCount} hakediş kaydı oluşturuldu`);

    // 6. Payroll run'a hakediş durumunu işaretle (opsiyonel metadata)
    await supabase
      .from('payroll_runs')
      .update({
        status: 'accrued', // Hakediş edildi durumu
        updated_at: new Date().toISOString(),
      })
      .eq('id', payrollRunId);

    result.success = true;
    return result;
  } catch (error: any) {
    logger.error('❌ createPayrollAccruals error:', error);
    throw error;
  }
}

/**
 * Hakediş ödemesi yap
 * payroll_records status'unu 'tahakkuk_edildi' -> 'odendi' değiştirir
 */
export async function payAccrual(
  accrualRecordId: string,
  accountId: string,
  accountType: 'bank' | 'cash',
  paymentDate: Date,
  userId?: string
) {
  try {
    // 1. Hakediş kaydını al
    const { data: accrual, error: accrualError } = await supabase
      .from('payroll_records')
      .select('*, employees(first_name, last_name)')
      .eq('id', accrualRecordId)
      .single();

    if (accrualError || !accrual) {
      throw new Error('Hakediş kaydı bulunamadı');
    }

    if (accrual.status === 'odendi') {
      throw new Error('Bu hakediş zaten ödenmiş');
    }

    const employee = accrual.employees as any;
    const description = `Hakediş Ödemesi: ${employee?.first_name} ${employee?.last_name}`;

    // 2. Payment transaction oluştur
    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert({
        employee_id: accrual.employee_id,
        payroll_record_id: accrual.id,
        amount: accrual.net_salary,
        payment_date: paymentDate.toISOString().split('T')[0],
        payment_method: accountType === 'bank' ? 'banka_havalesi' : 'nakit',
        description,
        status: 'tamamlandi',
      })
      .select('id')
      .single();

    if (paymentError) {
      throw new Error(`Payment transaction oluşturulamadı: ${paymentError.message}`);
    }

    // 3. Hakediş status'unu güncelle
    const { error: updateError } = await supabase
      .from('payroll_records')
      .update({
        status: 'odendi',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accrualRecordId);

    if (updateError) {
      throw new Error(`Hakediş durumu güncellenemedi: ${updateError.message}`);
    }

    logger.debug(`✓ Hakediş ödemesi tamamlandı: ${accrualRecordId}`);

    return {
      success: true,
      paymentId: payment.id,
    };
  } catch (error: any) {
    logger.error('❌ payAccrual error:', error);
    throw error;
  }
}

/**
 * Çalışanın bekleyen hakediş kayıtlarını getir
 */
export async function getPendingAccruals(
  companyId: string,
  employeeId?: string
) {
  let query = supabase
    .from('payroll_records')
    .select(`
      *,
      employees!inner(id, first_name, last_name, department, company_id)
    `)
    .eq('status', 'tahakkuk_edildi')
    .eq('employees.company_id', companyId)
    .order('payroll_date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Bekleyen hakediş kayıtları alınamadı:', error);
    throw error;
  }

  return data || [];
}
