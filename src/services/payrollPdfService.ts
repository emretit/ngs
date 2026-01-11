/**
 * PDF Payroll Slip Generation Service
 * Generates professional payroll slips in Turkish format
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollCalculationResult } from './payrollService';

interface PayrollPdfOptions {
  employee: {
    first_name: string;
    last_name: string;
    employee_number?: string;
    position?: string;
    department?: string;
    tc_identity_no?: string;
  };
  company: {
    name: string;
    address?: string;
    tax_number?: string;
    tax_office?: string;
  };
  period: {
    month: number;
    year: number;
  };
  calculation: PayrollCalculationResult;
}

const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const generatePayrollPdf = async (options: PayrollPdfOptions): Promise<void> => {
  const { employee, company, period, calculation } = options;
  const doc = new jsPDF();

  // Set font (using default Helvetica which supports basic Latin)
  doc.setFont('helvetica');
  
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BORDRO FİŞİ', 105, yPos, { align: 'center' });
  yPos += 10;

  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.name, 105, yPos, { align: 'center' });
  yPos += 5;
  
  if (company.address) {
    doc.setFontSize(8);
    doc.text(company.address, 105, yPos, { align: 'center' });
    yPos += 4;
  }
  
  if (company.tax_number && company.tax_office) {
    doc.text(`Vergi No: ${company.tax_number} - ${company.tax_office}`, 105, yPos, { align: 'center' });
    yPos += 8;
  } else {
    yPos += 8;
  }

  // Period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dönem: ${months[period.month - 1]} ${period.year}`, 105, yPos, { align: 'center' });
  yPos += 10;

  // Employee info box
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, 180, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, yPos, 180, 25);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Çalışan Bilgileri', 20, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Adı Soyadı: ${employee.first_name} ${employee.last_name}`, 20, yPos);
  
  if (employee.position) {
    doc.text(`Pozisyon: ${employee.position}`, 120, yPos);
  }
  
  yPos += 5;
  if (employee.department) {
    doc.text(`Departman: ${employee.department}`, 20, yPos);
  }
  
  if (employee.tc_identity_no) {
    doc.text(`TC: ${employee.tc_identity_no}`, 120, yPos);
  }
  
  yPos += 10;

  // Gross Salary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BRÜT MAAŞ HESAPLAMASI', 15, yPos);
  yPos += 5;

  const grossData = [
    ['Aylık Maaş Tabanı', formatCurrency(calculation.base_salary)],
  ];

  if (calculation.overtime_pay > 0) {
    grossData.push(['Fazla Mesai Ücreti', formatCurrency(calculation.overtime_pay)]);
  }

  if (calculation.bonus_premium > 0) {
    grossData.push(['Prim ve İkramiye', formatCurrency(calculation.bonus_premium)]);
  }

  if (calculation.allowances_cash > 0) {
    grossData.push(['Yan Ödemeler (Vergiye Tabi)', formatCurrency(calculation.allowances_cash)]);
  }

  if (calculation.allowances_in_kind > 0) {
    grossData.push(['Yan Ödemeler (Vergisiz)', formatCurrency(calculation.allowances_in_kind)]);
  }

  grossData.push([
    { content: 'TOPLAM BRÜT MAAŞ', styles: { fontStyle: 'bold' } },
    { content: formatCurrency(calculation.gross_salary), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } }
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: grossData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Deductions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KESİNTİLER', 15, yPos);
  yPos += 5;

  const deductionsData = [
    [{ content: 'SGK Kesintileri', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, ''],
    [`  SGK Matrah Tabanı`, formatCurrency(calculation.sgk_base)],
    [`  SGK Primi (%14)`, `-${formatCurrency(calculation.sgk_employee_share)}`],
    [`  İşsizlik Primi (%1)`, `-${formatCurrency(calculation.unemployment_employee)}`],
    [{ content: 'Vergi Kesintileri', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, ''],
    [`  Gelir Vergisi Matrahı`, formatCurrency(calculation.income_tax_base)],
  ];

  if (calculation.income_tax_exemption > 0) {
    deductionsData.push([
      `  Gelir Vergisi (Muaf: ${formatCurrency(calculation.income_tax_exemption)})`,
      `-${formatCurrency(calculation.income_tax_amount)}`
    ]);
  } else {
    deductionsData.push([`  Gelir Vergisi`, `-${formatCurrency(calculation.income_tax_amount)}`]);
  }

  if (calculation.stamp_tax_exemption > 0) {
    deductionsData.push([
      `  Damga Vergisi (Muaf: ${formatCurrency(calculation.stamp_tax_exemption)})`,
      `-${formatCurrency(calculation.stamp_tax_amount)}`
    ]);
  } else {
    deductionsData.push([`  Damga Vergisi (‰7,59)`, `-${formatCurrency(calculation.stamp_tax_amount)}`]);
  }

  if (calculation.advances > 0 || calculation.garnishments > 0) {
    deductionsData.push([{ content: 'Diğer Kesintiler', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, '']);
    
    if (calculation.advances > 0) {
      deductionsData.push([`  Avanslar`, `-${formatCurrency(calculation.advances)}`]);
    }
    
    if (calculation.garnishments > 0) {
      deductionsData.push([`  Hacizler`, `-${formatCurrency(calculation.garnishments)}`]);
    }
  }

  deductionsData.push([
    { content: 'TOPLAM KESİNTİLER', styles: { fontStyle: 'bold' } },
    { content: `-${formatCurrency(calculation.total_deductions)}`, styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: deductionsData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Net Salary Box
  doc.setFillColor(16, 185, 129);
  doc.rect(15, yPos, 180, 15, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.rect(15, yPos, 180, 15);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET MAAŞ', 20, yPos + 10);
  doc.text(formatCurrency(calculation.net_salary), 190, yPos + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  
  yPos += 20;

  // Employer Cost Table
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('İŞVEREN MALİYETİ', 15, yPos);
  yPos += 5;

  const employerData = [
    ['Brüt Maaş', formatCurrency(calculation.gross_salary)],
    ['İşveren SGK Primi (%20,5)', `+${formatCurrency(calculation.sgk_employer_share)}`],
    ['İşveren İşsizlik Primi (%2)', `+${formatCurrency(calculation.unemployment_employer)}`],
    ['İş Kazası Sigortası', `+${formatCurrency(calculation.accident_insurance)}`],
    [
      { content: 'TOPLAM İŞVEREN MALİYETİ', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(calculation.total_employer_cost), styles: { fontStyle: 'bold', fillColor: [224, 231, 255] } }
    ]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: employerData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Exemption notice
  if (calculation.is_minimum_wage_exemption_applied) {
    yPos += 5;
    doc.setFillColor(220, 252, 231);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setDrawColor(134, 239, 172);
    doc.rect(15, yPos, 180, 10);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(21, 128, 61);
    doc.text('ℹ Asgari ücret muafiyeti uygulanmıştır (Gelir vergisi ve damga vergisi muaftır)', 20, yPos + 7);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  }

  // Warnings
  if (calculation.warnings.length > 0) {
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Uyarılar:', 15, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    calculation.warnings.forEach(warning => {
      doc.text(`• ${warning}`, 20, yPos);
      yPos += 4;
    });
    yPos += 5;
  }

  // Footer with signatures
  const pageHeight = doc.internal.pageSize.height;
  yPos = pageHeight - 30;

  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, 195, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Çalışan İmzası', 40, yPos, { align: 'center' });
  doc.text('İşveren/Yetkili İmzası', 150, yPos, { align: 'center' });

  yPos += 3;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 105, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `bordro_${employee.first_name}_${employee.last_name}_${months[period.month - 1]}_${period.year}.pdf`;
  doc.save(fileName);
};

export default generatePayrollPdf;
