/**
 * Automatic Payroll Service
 * 
 * Toplu bordro oluşturma ve otomatik hesaplama servisi.
 * Her ay sonu için veya manuel tetiklemeyle tüm çalışanlar için bordro oluşturur.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { 
  calculateEmployeePayroll,
  getPayrollYearParameters,
  type PayrollCalculationResult 
} from "./payrollService";
import { savePayrollRun, syncPayrollToFinance } from "./payrollFinanceService";
import { createPayrollAccruals } from "./payrollAccrualService";

export interface BulkPayrollOptions {
  companyId: string;
  year: number;
  month: number;
  departmentFilter?: string | null;
  employeeIds?: string[]; // Belirli çalışanlar için
  requireApprovedTimesheets?: boolean;
  autoSync?: boolean; // Finance'e otomatik sync
  createAccruals?: boolean; // Hakediş oluştur (default: true)
  defaultWorkingDays?: number; // Default puantaj gün sayısı (default: 30)
  userId?: string;
}

export interface BulkPayrollResult {
  success: boolean;
  payrollRunId?: string;
  processedCount: number;
  successCount: number;
  failedCount: number;
  failedEmployees: Array<{
    employeeId: string;
    employeeName: string;
    error: string;
  }>;
  warnings: string[];
}

/**
 * Toplu bordro oluşturma (Tüm aktif çalışanlar için)
 */
export async function generateBulkPayroll(
  options: BulkPayrollOptions
): Promise<BulkPayrollResult> {
  const {
    companyId,
    year,
    month,
    departmentFilter,
    employeeIds,
    requireApprovedTimesheets = true,
    autoSync = false,
    createAccruals = true,
    defaultWorkingDays = 30,
    userId,
  } = options;

  const result: BulkPayrollResult = {
    success: false,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    failedEmployees: [],
    warnings: [],
  };

  try {
    logger.debug('🚀 Toplu bordro oluşturma başlatıldı:', { companyId, year, month, defaultWorkingDays });

    // 1. Yıl parametrelerini al
    const yearParams = await getPayrollYearParameters(companyId, year);
    if (!yearParams) {
      throw new Error(`${year} yılı için bordro parametreleri bulunamadı. Lütfen ayarlardan parametreleri tanımlayın.`);
    }

    // 2. Aktif çalışanları al
    let employeesQuery = supabase
      .from('employees')
      .select('id, first_name, last_name, department, gross_salary, salary_amount')
      
      .eq('status', 'aktif');

    if (departmentFilter) {
      employeesQuery = employeesQuery.eq('department', departmentFilter);
    }

    if (employeeIds && employeeIds.length > 0) {
      employeesQuery = employeesQuery.in('id', employeeIds);
    }

    const { data: employees, error: employeesError } = await employeesQuery;

    if (employeesError || !employees) {
      throw new Error(`Çalışanlar alınamadı: ${employeesError?.message || 'Bilinmeyen hata'}`);
    }

    if (employees.length === 0) {
      result.warnings.push('Seçilen kriterlere uygun aktif çalışan bulunamadı');
      return result;
    }

      logger.debug(`✓ ${employees.length} aktif çalışan bulundu`);

    // 3. Puantaj verilerini al (tüm çalışanlar için toplu)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: timesheetDays, error: timesheetError } = await supabase
      .from('timesheet_days')
      .select('*')
      
      .in('employee_id', employees.map(e => e.id))
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (timesheetError) {
      logger.error('Puantaj verileri alınamadı:', timesheetError);
      result.warnings.push('Puantaj verileri alınamadı, otomatik puantaj oluşturulacak');
    }

    logger.debug(`✓ Puantaj verileri alındı. Default ${defaultWorkingDays} gün üzerinden hesaplanacak (puantaj yoksa)`);

    // 4. Her çalışan için bordro hesapla
    const employeeCalculations: Array<{
      employeeId: string;
      calculation: PayrollCalculationResult;
    }> = [];

    for (const employee of employees) {
      result.processedCount++;

      try {
        // Çalışanın puantajlarını filtrele
        const employeeTimesheets = timesheetDays?.filter(
          ts => ts.employee_id === employee.id
        ) || [];

        // **PUANTAJ YOKSA 30 GÜN VARSAY**
        let timesheetsToUse = employeeTimesheets;
        
        if (employeeTimesheets.length === 0) {
          logger.debug(`⚠️ ${employee.first_name} ${employee.last_name} - Puantaj yok, ${defaultWorkingDays} gün varsayılacak`);
          
          // Otomatik puantaj oluştur (30 gün * 8 saat = 240 saat = 14400 dakika)
          const daysInMonth = lastDay;
          const workingDaysToAssume = Math.min(defaultWorkingDays, daysInMonth);
          const totalMinutes = workingDaysToAssume * 8 * 60; // 8 saat/gün
          
          // Simule edilmiş puantaj (tek kayıt olarak - toplam)
          timesheetsToUse = [{
            employee_id: employee.id,
            work_date: endDate,
            net_working_minutes: totalMinutes,
            overtime_minutes: 0,
            approval_status: 'auto_approved',
          } as any];
          
          result.warnings.push(`${employee.first_name} ${employee.last_name}: ${defaultWorkingDays} gün otomatik puantaj`);
        }

        // Onaylı puantaj kontrolü (eğer gerekliyse)
        if (requireApprovedTimesheets && employeeTimesheets.length > 0) {
          const hasUnapprovedTimesheets = employeeTimesheets.some(
            ts => ts.approval_status !== 'manager_approved' && 
                  ts.approval_status !== 'hr_locked' &&
                  ts.approval_status !== 'auto_approved'
          );

          if (hasUnapprovedTimesheets) {
            result.failedCount++;
            result.failedEmployees.push({
              employeeId: employee.id,
              employeeName: `${employee.first_name} ${employee.last_name}`,
              error: 'Onaylanmamış puantajlar var',
            });
            continue;
          }
        }

        // Bordro hesapla
        const baseSalary = employee.gross_salary || employee.salary_amount || 0;
        
        if (baseSalary <= 0) {
          result.failedCount++;
          result.failedEmployees.push({
            employeeId: employee.id,
            employeeName: `${employee.first_name} ${employee.last_name}`,
            error: 'Maaş bilgisi tanımlı değil',
          });
          continue;
        }

        const calculation = calculateEmployeePayroll(
          employee.id,
          baseSalary,
          timesheetsToUse, // Otomatik puantaj veya gerçek puantaj
          yearParams,
          {
            allowances: [],
            advances: [],
            bonusPremium: 0,
            garnishments: 0,
          }
        );

        employeeCalculations.push({
          employeeId: employee.id,
          calculation,
        });

        result.successCount++;
      } catch (error: any) {
        logger.error(`❌ ${employee.first_name} ${employee.last_name} bordro hatası:`, error);
        result.failedCount++;
        result.failedEmployees.push({
          employeeId: employee.id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          error: error.message || 'Bilinmeyen hata',
        });
      }
    }

    logger.debug(`✓ ${result.successCount}/${result.processedCount} çalışan hesaplandı`);

    // 5. Bordroları kaydet
    if (employeeCalculations.length > 0) {
      const saveResult = await savePayrollRun({
        companyId,
        year,
        month,
        employeeCalculations,
        autoGenerated: true,
        userId,
      });

      if (saveResult.success) {
        result.payrollRunId = saveResult.payrollRunId;
        logger.debug(`✓ Bordro run kaydedildi: ${saveResult.payrollRunId}`);

        // 6. Hakediş oluştur (opsiyonel)
        if (createAccruals) {
          try {
            const accrualResult = await createPayrollAccruals({
              payrollRunId: saveResult.payrollRunId!,
              companyId,
              userId,
            });
            logger.debug(`✓ ${accrualResult.accrualCount} hakediş kaydı oluşturuldu`);
          } catch (accrualError: any) {
            logger.error('Hakediş oluşturma hatası:', accrualError);
            result.warnings.push(`Hakediş oluşturulamadı: ${accrualError.message}`);
          }
        }

        // 7. Finance sync (opsiyonel)
        if (autoSync) {
          try {
            await syncPayrollToFinance(saveResult.payrollRunId!, userId);
            logger.debug(`✓ Finance sync tamamlandı`);
          } catch (syncError: any) {
            logger.error('Finance sync hatası:', syncError);
            result.warnings.push(`Finance sync başarısız: ${syncError.message}`);
          }
        }
      }
    } else {
      throw new Error('Hiçbir çalışan için bordro hesaplanamadı');
    }

    result.success = true;
    return result;
  } catch (error: any) {
    logger.error('❌ generateBulkPayroll error:', error);
    result.warnings.push(error.message);
    return result;
  }
}

/**
 * Aylık otomatik bordro oluşturma (Cron job için)
 * Her ay sonu otomatik olarak çalıştırılabilir
 * Hakediş oluşturma DAHİL
 */
export async function generateMonthlyPayrollForCompany(
  companyId: string,
  targetMonth?: { year: number; month: number }
): Promise<BulkPayrollResult> {
  const now = new Date();
  const year = targetMonth?.year || now.getFullYear();
  const month = targetMonth?.month || now.getMonth() + 1; // JavaScript 0-based

  logger.debug(`📅 Otomatik aylık bordro: ${companyId} için ${year}/${month}`);

  return generateBulkPayroll({
    companyId,
    year,
    month,
    requireApprovedTimesheets: false, // Ay sonu otomatik olduğu için onay beklemeden
    autoSync: false, // Manuel onay gerektir
    createAccruals: true, // Hakediş OLUŞTUR
    defaultWorkingDays: 30, // 30 gün varsayılan
  });
}

/**
 * Tüm şirketler için otomatik bordro (Edge function için)
 */
export async function generateMonthlyPayrollForAllCompanies(
  targetMonth?: { year: number; month: number }
): Promise<{ companyId: string; result: BulkPayrollResult }[]> {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true);

  if (error || !companies) {
    console.error('Şirketler alınamadı:', error);
    return [];
  }

  console.log(`🏢 ${companies.length} aktif şirket için bordro oluşturulacak`);

  const results: { companyId: string; result: BulkPayrollResult }[] = [];

  for (const company of companies) {
    console.log(`\n📊 İşleniyor: ${company.name} (${company.id})`);
    
    try {
      const result = await generateMonthlyPayrollForCompany(company.id, targetMonth);
      results.push({ companyId: company.id, result });
    } catch (error: any) {
      console.error(`❌ ${company.name} bordro hatası:`, error);
      results.push({
        companyId: company.id,
        result: {
          success: false,
          processedCount: 0,
          successCount: 0,
          failedCount: 0,
          failedEmployees: [],
          warnings: [error.message],
        },
      });
    }
  }

  return results;
}

/**
 * Bordro durumu kontrolü
 * Belirli bir dönem için bordro var mı kontrol eder
 */
export async function checkPayrollRunExists(
  companyId: string,
  year: number,
  month: number
): Promise<{
  exists: boolean;
  payrollRun?: any;
  itemCount?: number;
}> {
  const { data: payrollRun, error } = await supabase
    .from('payroll_runs')
    .select('*, payroll_items(count)')
    
    .eq('payroll_period_year', year)
    .eq('payroll_period_month', month)
    .maybeSingle();

  if (error) {
    console.error('Payroll run check error:', error);
    return { exists: false };
  }

  if (!payrollRun) {
    return { exists: false };
  }

  return {
    exists: true,
    payrollRun,
    itemCount: (payrollRun as any).payroll_items?.[0]?.count || 0,
  };
}
