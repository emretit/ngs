import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export type ReportType = 'customers' | 'sales' | 'invoices' | 'inventory' | 'suppliers' | 'payroll' | 'custom';

export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  customQuery?: string;
  limit?: number;
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface GeneratedFile {
  filename: string;
  blob: Blob;
  size: number;
  type: string;
}

/**
 * Get current user's company_id
 */
const getCurrentCompanyId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id || null;
  } catch {
    return null;
  }
};

/**
 * Query data based on report type
 */
const queryData = async (
  reportType: ReportType,
  filters: ReportFilters = {}
): Promise<any[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Şirket bilgisi bulunamadı');
  }

  let query = supabase.from(getTableName(reportType)).select('*').eq('company_id', companyId);

  // Apply date range filter
  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start.toISOString())
      .lte('created_at', filters.dateRange.end.toISOString());
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // Apply limit
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Query error:', error);
    throw new Error(`Veri sorgulanamadı: ${error.message}`);
  }

  return data || [];
};

/**
 * Get table name based on report type
 */
const getTableName = (reportType: ReportType): string => {
  const tableMap: Record<ReportType, string> = {
    customers: 'customers',
    sales: 'sales_invoices',
    invoices: 'sales_invoices',
    inventory: 'products',
    suppliers: 'suppliers',
    custom: 'customers' // fallback
  };

  return tableMap[reportType];
};

/**
 * Get columns based on report type
 */
const getColumns = (reportType: ReportType): ExcelColumn[] => {
  const columnMap: Record<ReportType, ExcelColumn[]> = {
    customers: [
      { header: 'Müşteri Adı', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefon', key: 'mobile_phone', width: 20 },
      { header: 'Şirket', key: 'company', width: 30 },
      { header: 'Tip', key: 'type', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Bakiye', key: 'balance', width: 15 },
      { header: 'Adres', key: 'address', width: 40 },
    ],
    sales: [
      { header: 'Fatura No', key: 'invoice_number', width: 20 },
      { header: 'Müşteri', key: 'customer_name', width: 30 },
      { header: 'Tarih', key: 'invoice_date', width: 15 },
      { header: 'Tutar', key: 'total_amount', width: 15 },
      { header: 'KDV', key: 'tax_amount', width: 15 },
      { header: 'Toplam', key: 'grand_total', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
    ],
    invoices: [
      { header: 'Fatura No', key: 'invoice_number', width: 20 },
      { header: 'Müşteri', key: 'customer_name', width: 30 },
      { header: 'Tarih', key: 'invoice_date', width: 15 },
      { header: 'Tutar', key: 'total_amount', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
    ],
    inventory: [
      { header: 'Ürün Kodu', key: 'code', width: 20 },
      { header: 'Ürün Adı', key: 'name', width: 30 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Stok', key: 'stock_quantity', width: 15 },
      { header: 'Birim', key: 'unit', width: 10 },
      { header: 'Fiyat', key: 'price', width: 15 },
      { header: 'KDV', key: 'tax_rate', width: 10 },
    ],
    suppliers: [
      { header: 'Tedarikçi Adı', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Adres', key: 'address', width: 40 },
      { header: 'Bakiye', key: 'balance', width: 15 },
    ],
    custom: [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Oluşturma', key: 'created_at', width: 20 },
    ]
  };

  return columnMap[reportType];
};

/**
 * Format data for Excel
 */
const formatData = (data: any[], reportType: ReportType): any[] => {
  return data.map(row => {
    const formatted: any = {};
    const columns = getColumns(reportType);

    columns.forEach(col => {
      let value = row[col.key];

      // Format dates
      if (value && typeof value === 'string' && value.includes('T')) {
        try {
          value = format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: tr });
        } catch {
          // Keep original value if date parsing fails
        }
      }

      // Format numbers
      if (typeof value === 'number') {
        value = value.toLocaleString('tr-TR', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        });
      }

      formatted[col.header] = value || '';
    });

    return formatted;
  });
};

/**
 * Create Excel workbook
 */
const createWorkbook = (data: any[], reportType: ReportType): XLSX.WorkBook => {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columns = getColumns(reportType);
  worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, getSheetName(reportType));

  return workbook;
};

/**
 * Get sheet name based on report type
 */
const getSheetName = (reportType: ReportType): string => {
  const sheetNameMap: Record<ReportType, string> = {
    customers: 'Müşteriler',
    sales: 'Satışlar',
    invoices: 'Faturalar',
    inventory: 'Ürünler',
    suppliers: 'Tedarikçiler',
    custom: 'Veri'
  };

  return sheetNameMap[reportType];
};

/**
 * Generate filename
 */
const generateFilename = (reportType: ReportType, fileFormat: 'xlsx' | 'csv' = 'xlsx'): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const baseName = getSheetName(reportType).toLowerCase().replace(/\s+/g, '_');
  return `${baseName}_${timestamp}.${fileFormat}`;
};

/**
 * Main function: Generate Excel/CSV report
 */
export const generateExcelReport = async (
  reportType: ReportType,
  filters: ReportFilters = {},
  format: 'xlsx' | 'csv' = 'xlsx'
): Promise<GeneratedFile> => {
  try {
    // 1. Query data
    console.log('Querying data for report:', reportType);
    const rawData = await queryData(reportType, filters);

    if (rawData.length === 0) {
      throw new Error('Rapor için veri bulunamadı');
    }

    // 2. Format data
    console.log('Formatting data...');
    const formattedData = formatData(rawData, reportType);

    // 3. Create workbook
    console.log('Creating workbook...');
    const workbook = createWorkbook(formattedData, reportType);

    // 4. Generate blob
    console.log('Generating file...');
    const fileBuffer = XLSX.write(workbook, { 
      bookType: format === 'csv' ? 'csv' : 'xlsx', 
      type: 'array' 
    });

    const blob = new Blob(
      [fileBuffer], 
      { type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const filename = generateFilename(reportType, format);

    return {
      filename,
      blob,
      size: blob.size,
      type: blob.type
    };
  } catch (error) {
    console.error('Excel generation error:', error);
    throw error;
  }
};

/**
 * Download file to user's device
 */
export const downloadFile = (file: GeneratedFile): void => {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Save generated file record to database
 */
export const saveGeneratedFileRecord = async (
  file: GeneratedFile,
  conversationId?: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const companyId = await getCurrentCompanyId();
    if (!companyId) return;

    await supabase.from('generated_files').insert({
      company_id: companyId,
      user_id: user.id,
      conversation_id: conversationId,
      file_name: file.filename,
      file_type: file.type,
      file_size: file.size,
      metadata: {
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving file record:', error);
    // Don't throw - file generation succeeded even if logging failed
  }
};

/**
 * Generate payroll Excel file from calculation result
 */
export const generatePayrollExcel = async (
  employee: {
    first_name: string;
    last_name: string;
    employee_number?: string;
    position?: string;
    department?: string;
  },
  period: {
    month: number;
    year: number;
  },
  calculation: any // PayrollCalculationResult type
): Promise<GeneratedFile> => {
  try {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' ₺';
    };

    // Create data arrays
    const headerData = [
      ['BORDRO FİŞİ'],
      [],
      ['Çalışan:', `${employee.first_name} ${employee.last_name}`],
      ['Pozisyon:', employee.position || '-'],
      ['Departman:', employee.department || '-'],
      ['Dönem:', `${months[period.month - 1]} ${period.year}`],
      [],
    ];

    const grossData = [
      ['BRÜT MAAŞ HESAPLAMASI', ''],
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

    grossData.push(
      [],
      ['TOPLAM BRÜT MAAŞ', formatCurrency(calculation.gross_salary)]
    );

    const deductionsData = [
      [],
      ['KESİNTİLER', ''],
      ['SGK Kesintileri', ''],
      ['  SGK Matrah Tabanı', formatCurrency(calculation.sgk_base)],
      ['  SGK Primi (%14)', `-${formatCurrency(calculation.sgk_employee_share)}`],
      ['  İşsizlik Primi (%1)', `-${formatCurrency(calculation.unemployment_employee)}`],
      [],
      ['Vergi Kesintileri', ''],
      ['  Gelir Vergisi Matrahı', formatCurrency(calculation.income_tax_base)],
      ['  Gelir Vergisi', `-${formatCurrency(calculation.income_tax_amount)}`],
      ['  Damga Vergisi (‰7,59)', `-${formatCurrency(calculation.stamp_tax_amount)}`],
    ];

    if (calculation.advances > 0 || calculation.garnishments > 0) {
      deductionsData.push([], ['Diğer Kesintiler', '']);
      
      if (calculation.advances > 0) {
        deductionsData.push(['  Avanslar', `-${formatCurrency(calculation.advances)}`]);
      }
      
      if (calculation.garnishments > 0) {
        deductionsData.push(['  Hacizler', `-${formatCurrency(calculation.garnishments)}`]);
      }
    }

    deductionsData.push(
      [],
      ['TOPLAM KESİNTİLER', `-${formatCurrency(calculation.total_deductions)}`],
      [],
      ['NET MAAŞ', formatCurrency(calculation.net_salary)]
    );

    const employerData = [
      [],
      ['İŞVEREN MALİYETİ', ''],
      ['Brüt Maaş', formatCurrency(calculation.gross_salary)],
      ['İşveren SGK Primi (%20,5)', `+${formatCurrency(calculation.sgk_employer_share)}`],
      ['İşveren İşsizlik Primi (%2)', `+${formatCurrency(calculation.unemployment_employer)}`],
      ['İş Kazası Sigortası', `+${formatCurrency(calculation.accident_insurance)}`],
      [],
      ['TOPLAM İŞVEREN MALİYETİ', formatCurrency(calculation.total_employer_cost)]
    ];

    // Combine all data
    const allData = [
      ...headerData,
      ...grossData,
      ...deductionsData,
      ...employerData,
    ];

    // Add warnings if any
    if (calculation.warnings && calculation.warnings.length > 0) {
      allData.push([]);
      allData.push(['Uyarılar:', '']);
      calculation.warnings.forEach((warning: string) => {
        allData.push([`  • ${warning}`, '']);
      });
    }

    // Add exemption notice
    if (calculation.is_minimum_wage_exemption_applied) {
      allData.push([]);
      allData.push(['ℹ Asgari ücret muafiyeti uygulanmıştır', '']);
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // Column A
      { wch: 25 }, // Column B
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bordro');

    // Generate blob
    const fileBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });

    const blob = new Blob(
      [fileBuffer], 
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `bordro_${employee.first_name}_${employee.last_name}_${months[period.month - 1]}_${period.year}_${timestamp}.xlsx`;

    return {
      filename,
      blob,
      size: blob.size,
      type: blob.type
    };
  } catch (error) {
    console.error('Payroll Excel generation error:', error);
    throw error;
  }
};

