/**
 * Payroll Calculation Test Suite
 * Tests different salary scenarios with 2026 Turkey tax rates
 */

import {
  calculateEmployeePayroll,
  calculateIncomeTax,
  PayrollYearParameters,
  TimesheetDay,
} from './payrollService';
import { logger } from '@/utils/logger';

// 2026 Turkey payroll parameters
const params2026: PayrollYearParameters = {
  id: 'test-2026',
  year: 2026,
  sgk_min_base: 33030, // 2026 minimum wage
  sgk_max_base: 165150, // 5x minimum wage
  sgk_employee_rate: 0.14,
  sgk_employer_rate: 0.205,
  unemployment_employee_rate: 0.01,
  unemployment_employer_rate: 0.02,
  accident_insurance_rate: 0.005,
  stamp_tax_rate: 0.00759,
  minimum_wage: 33030,
  income_tax_brackets: [
    { min: 0, max: 190000, rate: 0.15 },
    { min: 190000, max: 400000, rate: 0.20 },
    { min: 400000, max: 1500000, rate: 0.27 },
    { min: 1500000, max: 5300000, rate: 0.35 },
    { min: 5300000, max: -1, rate: 0.40 },
  ],
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
};

const printResult = (title: string, result: any) => {
  logger.debug(`\n${'='.repeat(60)}`);
  logger.debug(`TEST: ${title}`);
  logger.debug('='.repeat(60));
  logger.debug(`\n📊 BRÜT MAAŞ HESAPLAMASI:`);
  logger.debug(`  Aylık Maaş Tabanı: ${formatCurrency(result.base_salary)}`);
  if (result.overtime_pay > 0) {
    logger.debug(`  Fazla Mesai: ${formatCurrency(result.overtime_pay)}`);
  }
  if (result.bonus_premium > 0) {
    logger.debug(`  Prim/İkramiye: ${formatCurrency(result.bonus_premium)}`);
  }
  if (result.allowances_cash > 0 || result.allowances_in_kind > 0) {
    logger.debug(`  Yan Ödemeler: ${formatCurrency(result.allowances_cash + result.allowances_in_kind)}`);
  }
  logger.debug(`  TOPLAM BRÜT: ${formatCurrency(result.gross_salary)}`);

  logger.debug(`\n💰 SGK KESİNTİLERİ:`);
  logger.debug(`  SGK Matrah Tabanı: ${formatCurrency(result.sgk_base)}`);
  logger.debug(`  SGK Primi (%14): -${formatCurrency(result.sgk_employee_share)}`);
  logger.debug(`  İşsizlik Primi (%1): -${formatCurrency(result.unemployment_employee)}`);
  logger.debug(`  Toplam: -${formatCurrency(result.sgk_employee_share + result.unemployment_employee)}`);

  logger.debug(`\n📋 VERGİ KESİNTİLERİ:`);
  logger.debug(`  Gelir Vergisi Matrahı: ${formatCurrency(result.income_tax_base)}`);
  logger.debug(`  Gelir Vergisi: -${formatCurrency(result.income_tax_amount)}`);
  if (result.income_tax_exemption > 0) {
    logger.debug(`    (Muafiyet: ${formatCurrency(result.income_tax_exemption)})`);
  }
  logger.debug(`  Damga Vergisi: -${formatCurrency(result.stamp_tax_amount)}`);
  if (result.stamp_tax_exemption > 0) {
    logger.debug(`    (Muafiyet: ${formatCurrency(result.stamp_tax_exemption)})`);
  }
  logger.debug(`  Toplam: -${formatCurrency(result.income_tax_amount + result.stamp_tax_amount)}`);

  if (result.advances > 0 || result.garnishments > 0) {
    logger.debug(`\n💳 DİĞER KESİNTİLER:`);
    if (result.advances > 0) {
      logger.debug(`  Avanslar: -${formatCurrency(result.advances)}`);
    }
    if (result.garnishments > 0) {
      logger.debug(`  Hacizler: -${formatCurrency(result.garnishments)}`);
    }
  }

  logger.debug(`\n📊 ÖZET:`);
  logger.debug(`  Toplam Brüt: ${formatCurrency(result.gross_salary)}`);
  logger.debug(`  Toplam Kesintiler: -${formatCurrency(result.total_deductions)}`);
  logger.debug(`  ✅ NET MAAŞ: ${formatCurrency(result.net_salary)}`);
  
  logger.debug(`\n🏢 İŞVEREN MALİYETİ:`);
  logger.debug(`  İşveren SGK: +${formatCurrency(result.sgk_employer_share)}`);
  logger.debug(`  İşveren İşsizlik: +${formatCurrency(result.unemployment_employer)}`);
  logger.debug(`  İş Kazası: +${formatCurrency(result.accident_insurance)}`);
  logger.debug(`  TOPLAM MALİYET: ${formatCurrency(result.total_employer_cost)}`);
  
  logger.debug(`\n💡 ORANLAR:`);
  logger.debug(`  Net/Brüt: %${((result.net_salary / result.gross_salary) * 100).toFixed(2)}`);
  logger.debug(`  Kesinti Oranı: %${((result.total_deductions / result.gross_salary) * 100).toFixed(2)}`);
  logger.debug(`  İşveren Maliyet Farkı: %${(((result.total_employer_cost - result.gross_salary) / result.gross_salary) * 100).toFixed(2)}`);

  if (result.is_minimum_wage_exemption_applied) {
    logger.debug(`\n🎉 Asgari ücret muafiyeti uygulandı!`);
  }

  if (result.warnings.length > 0) {
    logger.debug(`\n⚠️  UYARILAR:`);
    result.warnings.forEach((w: string) => logger.debug(`  - ${w}`));
  }
};

// Test 1: Minimum Wage (with exemption)
logger.debug('\n\n🧪 BORDRO HESAPLAMA TESTLERİ - 2026\n');

const test1 = calculateEmployeePayroll(
  'emp-001',
  33030, // Minimum wage
  [] as TimesheetDay[],
  params2026
);
printResult('Asgari Ücret Çalışanı (Muafiyet Testi)', test1);

// Test 2: Middle Salary (50,000 TL)
const test2 = calculateEmployeePayroll(
  'emp-002',
  50000,
  [] as TimesheetDay[],
  params2026
);
printResult('Orta Gelir Çalışanı (50.000 TL)', test2);

// Test 3: High Salary (200,000 TL - Above SGK ceiling)
const test3 = calculateEmployeePayroll(
  'emp-003',
  200000,
  [] as TimesheetDay[],
  params2026
);
printResult('Yüksek Gelir Çalışanı (200.000 TL - SGK Tavanı Üstü)', test3);

// Test 4: With Overtime
const overtimeTimesheets: TimesheetDay[] = Array(5).fill(null).map((_, i) => ({
  id: `ts-${i}`,
  employee_id: 'emp-004',
  work_date: `2026-01-${i + 1}`,
  net_working_minutes: 480, // 8 hours
  overtime_minutes: 120, // 2 hours overtime
  status: 'completed',
  approval_status: 'manager_approved',
}));

const test4 = calculateEmployeePayroll(
  'emp-004',
  50000,
  overtimeTimesheets,
  params2026,
  { overtimeRate: 1.5 }
);
printResult('Fazla Mesai ile (50.000 TL + 10 saat FM)', test4);

// Test 5: With Allowances and Advances
const test5 = calculateEmployeePayroll(
  'emp-005',
  60000,
  [] as TimesheetDay[],
  params2026,
  {
    allowances: [
      { type: 'meal', description: 'Yemek yardımı', amount: 3000, is_taxable: true },
      { type: 'transportation', description: 'Yol yardımı', amount: 2000, is_taxable: false },
    ],
    advances: [
      { description: 'Ocak ayı avansı', amount: 5000 },
    ],
    bonusPremium: 10000,
  }
);
printResult('Kompleks Hesaplama (Yan Ödeme + Prim + Avans)', test5);

// Test 6: Very High Salary (500,000 TL - Multiple tax brackets)
const test6 = calculateEmployeePayroll(
  'emp-006',
  500000,
  [] as TimesheetDay[],
  params2026
);
printResult('Çok Yüksek Gelir (500.000 TL - Çoklu Vergi Dilimi)', test6);

// Income tax bracket test
logger.debug(`\n\n${'='.repeat(60)}`);
logger.debug('GELİR VERGİSİ DİLİM TESTLERİ');
logger.debug('='.repeat(60));

const testBrackets = [10000, 100000, 200000, 500000, 1000000, 2000000];
testBrackets.forEach(amount => {
  const tax = calculateIncomeTax(amount, params2026.income_tax_brackets);
  const effectiveRate = (tax / amount) * 100;
  logger.debug(`\nMatrah: ${formatCurrency(amount)}`);
  logger.debug(`  Vergi: ${formatCurrency(tax)}`);
  logger.debug(`  Efektif Oran: %${effectiveRate.toFixed(2)}`);
});

logger.debug('\n\n✅ TÜM TESTLER TAMAMLANDI!\n');

export {};
