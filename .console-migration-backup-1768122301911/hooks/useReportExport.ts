/**
 * useReportExport Hook
 * PDF, Excel ve CSV export işlemleri
 */

import { useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ExportFormat, ReportType } from "@/types/salesReports";

/**
 * Export data to Excel
 */
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = "Rapor"
) {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const maxWidth = 50;
    const columnWidths = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm");
    const fileName = `${filename}_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`${filename} Excel olarak indirildi`);
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Excel raporu oluşturulamadı");
  }
}

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: any[],
  filename: string
) {
  try {
    if (data.length === 0) {
      toast.error("Dışa aktarılacak veri yok");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm");
    link.setAttribute('download', `${filename}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filename} CSV olarak indirildi`);
  } catch (error) {
    console.error("CSV export error:", error);
    toast.error("CSV raporu oluşturulamadı");
  }
}

/**
 * Export data to PDF (using print)
 */
export function exportToPDF(
  title: string,
  content: HTMLElement | string
) {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup engelleyici nedeniyle PDF oluşturulamadı");
      return;
    }

    const htmlContent = typeof content === 'string' 
      ? content 
      : content.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #000;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .chart-container {
                page-break-inside: avoid;
                margin: 20px 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Oluşturulma Tarihi: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
          <hr>
          ${htmlContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      toast.success(`${title} PDF olarak hazırlandı`);
    }, 250);
  } catch (error) {
    console.error("PDF export error:", error);
    toast.error("PDF raporu oluşturulamadı");
  }
}

/**
 * Format data for export based on report type
 */
export function formatReportDataForExport(
  reportType: ReportType,
  data: any
): any[] {
  switch (reportType) {
    case 'sales_performance':
      return data.salesOverTime?.map((item: any) => ({
        Tarih: format(new Date(item.date), "dd.MM.yyyy", { locale: tr }),
        'Satış Tutarı': item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'İşlem Sayısı': item.count,
      })) || [];

    case 'sales_funnel':
      return data.stages?.map((stage: any) => ({
        Aşama: stage.label,
        'Fırsat Sayısı': stage.count,
        'Toplam Değer': stage.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'Dönüşüm Oranı': stage.conversionRate ? `${stage.conversionRate.toFixed(2)}%` : '-',
      })) || [];

    case 'sales_rep_performance':
      return data.reps?.map((rep: any) => ({
        'Satış Temsilcisi': rep.employeeName,
        'Toplam Satış': rep.totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'Kazanılan İşlem': rep.wonDeals,
        'Kaybedilen İşlem': rep.lostDeals,
        'Ortalama İşlem Büyüklüğü': rep.avgDealSize.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'Kazanma Oranı': `${rep.winRate.toFixed(2)}%`,
        'Ortalama Kapanış Süresi (Gün)': rep.avgClosingDuration.toFixed(1),
      })) || [];

    case 'proposal_analysis':
      return [
        ...data.statusDistribution?.map((status: any) => ({
          Durum: status.status === 'accepted' ? 'Kabul Edildi' : status.status === 'rejected' ? 'Reddedildi' : 'Beklemede',
          Sayı: status.count,
          'Toplam Değer': status.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        })) || [],
        ...data.volumeOverTime?.map((item: any) => ({
          Tarih: format(new Date(item.date), "dd.MM.yyyy", { locale: tr }),
          'Toplam Teklif': item.count,
          'Kabul Edilen': item.accepted,
          'Reddedilen': item.rejected,
        })) || [],
      ];

    case 'sales_forecast':
      return [
        ...data.pipelineValue?.map((stage: any) => ({
          Aşama: stage.stage,
          'Değer': stage.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
          'Fırsat Sayısı': stage.count,
        })) || [],
        ...data.expectedRevenue.monthly?.map((item: any) => ({
          Ay: item.month,
          'Tahmin': item.forecast.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
          'Gerçekleşen': item.actual?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '-',
        })) || [],
      ];

    case 'lost_sales':
      return data.reasons?.map((reason: any) => ({
        'Kayıp Nedeni': reason.label,
        'Fırsat Sayısı': reason.count,
        'Toplam Değer': reason.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'Yüzde': `${reason.percentage.toFixed(2)}%`,
      })) || [];

    case 'customer_sales':
      return data.customers?.map((customer: any) => ({
        'Müşteri': customer.customerName,
        'Toplam Gelir': customer.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'İşlem Sayısı': customer.dealCount,
        'Ortalama İşlem Büyüklüğü': customer.avgDealSize.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
        'Son İşlem Tarihi': format(new Date(customer.lastTransactionDate), "dd.MM.yyyy", { locale: tr }),
      })) || [];

    default:
      return [];
  }
}

/**
 * Main hook for report exports
 */
export function useReportExport() {
  const exportReport = useCallback((
    reportType: ReportType,
    data: any,
    format: ExportFormat,
    filename?: string
  ) => {
    const defaultFilename = `Satış_Raporu_${reportType}`;
    const exportFilename = filename || defaultFilename;

    const formattedData = formatReportDataForExport(reportType, data);

    switch (format) {
      case 'excel':
        exportToExcel(formattedData, exportFilename);
        break;
      case 'csv':
        exportToCSV(formattedData, exportFilename);
        break;
      case 'pdf':
        // For PDF, we need to create a printable HTML element
        // This will be handled by the component that calls this
        toast.info('PDF export için yazdırma penceresi açılıyor...');
        break;
    }
  }, []);

  return {
    exportReport,
    exportToExcel,
    exportToCSV,
    exportToPDF,
    formatReportDataForExport,
  };
}
