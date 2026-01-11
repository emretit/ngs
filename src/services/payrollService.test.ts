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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${title}`);
  console.log('='.repeat(60));
  console.log(`\n📊 BRÜT MAAŞ HESAPLAMASI:`);
  console.log(`  Aylık Maaş Tabanı: ${formatCurrency(result.base_salary)}`);
  if (result.overtime_pay > 0) {
    console.log(`  Fazla Mesai: ${formatCurrency(result.overtime_pay)}`);
  }
  if (result.bonus_premium > 0) {
    console.log(`  Prim/İkramiye: ${formatCurrency(result.bonus_premium)}`);
  }
  if (result.allowances_cash > 0 || result.allowances_in_kind > 0) {
    console.log(`  Yan Ödemeler: ${formatCurrency(result.allowances_cash + result.allowances_in_kind)}`);
  }
  console.log(`  TOPLAM BRÜT: ${formatCurrency(result.gross_salary)}`);

  console.log(`\n💰 SGK KESİNTİLERİ:`);
  console.log(`  SGK Matrah Tabanı: ${formatCurrency(result.sgk_base)}`);
  console.log(`  SGK Primi (%14): -${formatCurrency(result.sgk_employee_share)}`);
  console.log(`  İşsizlik Primi (%1): -${formatCurrency(result.unemployment_employee)}`);
  console.log(`  Toplam: -${formatCurrency(result.sgk_employee_share + result.unemployment_employee)}`);

  console.log(`\n📋 VERGİ KESİNTİLERİ:`);
  console.log(`  Gelir Vergisi Matrahı: ${formatCurrency(result.income_tax_base)}`);
  console.log(`  Gelir Vergisi: -${formatCurrency(result.income_tax_amount)}`);
  if (result.income_tax_exemption > 0) {
    console.log(`    (Muafiyet: ${formatCurrency(result.income_tax_exemption)})`);
  }
  console.log(`  Damga Vergisi: -${formatCurrency(result.stamp_tax_amount)}`);
  if (result.stamp_tax_exemption > 0) {
    console.log(`    (Muafiyet: ${formatCurrency(result.stamp_tax_exemption)})`);
  }
  console.log(`  Toplam: -${formatCurrency(result.income_tax_amount + result.stamp_tax_amount)}`);

  if (result.advances > 0 || result.garnishments > 0) {
    console.log(`\n💳 DİĞER KESİNTİLER:`);
    if (result.advances > 0) {
      console.log(`  Avanslar: -${formatCurrency(result.advances)}`);
    }
    if (result.garnishments > 0) {
      console.log(`  Hacizler: -${formatCurrency(result.garnishments)}`);
    }
  }

  console.log(`\n📊 ÖZET:`);
  console.log(`  Toplam Brüt: ${formatCurrency(result.gross_salary)}`);
  console.log(`  Toplam Kesintiler: -${formatCurrency(result.total_deductions)}`);
  console.log(`  ✅ NET MAAŞ: ${formatCurrency(result.net_salary)}`);
  
  console.log(`\n🏢 İŞVEREN MALİYETİ:`);
  console.log(`  İşveren SGK: +${formatCurrency(result.sgk_employer_share)}`);
  console.log(`  İşveren İşsizlik: +${formatCurrency(result.unemployment_employer)}`);
  console.log(`  İş Kazası: +${formatCurrency(result.accident_insurance)}`);
  console.log(`  TOPLAM MALİYET: ${formatCurrency(result.total_employer_cost)}`);
  
  console.log(`\n💡 ORANLAR:`);
  console.log(`  Net/Brüt: %${((result.net_salary / result.gross_salary) * 100).toFixed(2)}`);
  console.log(`  Kesinti Oranı: %${((result.total_deductions / result.gross_salary) * 100).toFixed(2)}`);
  console.log(`  İşveren Maliyet Farkı: %${(((result.total_employer_cost - result.gross_salary) / result.gross_salary) * 100).toFixed(2)}`);

  if (result.is_minimum_wage_exemption_applied) {
    console.log(`\n🎉 Asgari ücret muafiyeti uygulandı!`);
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  UYARILAR:`);
    result.warnings.forEach((w: string) => console.log(`  - ${w}`));
  }
};

// Test 1: Minimum Wage (with exemption)
console.log('\n\n🧪 BORDRO HESAPLAMA TESTLERİ - 2026\n');

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
console.log(`\n\n${'='.repeat(60)}`);
console.log('GELİR VERGİSİ DİLİM TESTLERİ');
console.log('='.repeat(60));

const testBrackets = [10000, 100000, 200000, 500000, 1000000, 2000000];
testBrackets.forEach(amount => {
  const tax = calculateIncomeTax(amount, params2026.income_tax_brackets);
  const effectiveRate = (tax / amount) * 100;
  console.log(`\nMatrah: ${formatCurrency(amount)}`);
  console.log(`  Vergi: ${formatCurrency(tax)}`);
  console.log(`  Efektif Oran: %${effectiveRate.toFixed(2)}`);
});

console.log('\n\n✅ TÜM TESTLER TAMAMLANDI!\n');

export {};
