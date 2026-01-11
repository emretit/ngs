import { useCallback } from "react";
import { logger } from '@/utils/logger';
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ModuleReportOptions } from './config';
import { moduleConfig } from './config';
import { useModuleReportData } from './useModuleReportData';

/**
 * Module Report - PDF Export
 * PDF raporu oluşturma işlemleri (print dialog ile)
 */

export const useModuleReportPDF = () => {
  const { fetchModuleData } = useModuleReportData();

  const exportToPDF = useCallback(async (options: ModuleReportOptions) => {
    try {
      const toastId = toast.loading(`${moduleConfig[options.module].displayName} raporu hazırlanıyor...`);
      
      const data = await fetchModuleData(options);
      
      if (data.length === 0) {
        toast.dismiss(toastId);
        toast.error("Rapor için veri bulunamadı");
        return;
      }

      const config = moduleConfig[options.module];
      const printWindow = window.open("", "_blank");
      
      if (!printWindow) {
        toast.dismiss(toastId);
        toast.error("Pop-up engelleyici aktif olabilir");
        return;
      }

      const currentDate = format(new Date(), "dd MMMM yyyy HH:mm", { locale: tr });
      const dateRange = options.startDate && options.endDate 
        ? `${format(new Date(options.startDate), "dd.MM.yyyy", { locale: tr })} - ${format(new Date(options.endDate), "dd.MM.yyyy", { locale: tr })}`
        : "Tüm Kayıtlar";

      // Generate table rows
      const tableRows = data.slice(0, 50).map((item: any) => {
        const cells = Object.entries(config.columns).map(([key, label]) => {
          let value = item[key];
          
          // Handle relations
          if (item.departments && key === 'department') value = item.departments.name;
          if (item.customers) value = item.customers.name;
          if (item.suppliers) value = item.suppliers.name;
          if (item.vehicles) value = `${item.vehicles.plate_number}`;
          
          // Format dates
          if (value && (key.includes('date') || key.includes('_at'))) {
            try {
              value = format(new Date(value), "dd.MM.yyyy", { locale: tr });
            } catch (e) {}
          }
          
          // Format numbers
          if (typeof value === 'number' && (key.includes('amount') || key.includes('price') || key.includes('balance'))) {
            value = value.toLocaleString('tr-TR');
          }
          
          return `<td>${value || '-'}</td>`;
        }).join('');
        
        return `<tr>${cells}</tr>`;
      }).join('');

      const tableHeaders = Object.values(config.columns)
        .map(label => `<th>${label}</th>`)
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${config.displayName} Raporu - ${currentDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 30px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .header h1 { 
              color: #1e40af; 
              font-size: 24px;
              margin-bottom: 8px;
            }
            .header .icon { font-size: 32px; margin-bottom: 10px; }
            .header p { color: #6b7280; font-size: 13px; margin-top: 4px; }
            .summary {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-around;
              align-items: center;
            }
            .summary-item {
              text-align: center;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 10px;
              margin-top: 20px;
            }
            th, td { 
              padding: 8px 6px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background: #f1f5f9; 
              font-weight: 600;
              color: #475569;
              position: sticky;
              top: 0;
            }
            tr:hover { background: #f8fafc; }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            .more-info {
              text-align: center;
              padding: 15px;
              font-style: italic;
              color: #6b7280;
              font-size: 11px;
            }
            @media print {
              body { padding: 15px; }
              .summary { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="icon">${config.icon}</div>
            <h1>${config.displayName} Raporu</h1>
            <p>Rapor Tarihi: ${currentDate}</p>
            <p>Dönem: ${dateRange}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${data.length}</div>
              <div class="summary-label">Toplam Kayıt</div>
            </div>
            ${data.length > 50 ? `
              <div class="summary-item">
                <div class="summary-value">50</div>
                <div class="summary-label">Gösterilen</div>
              </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          ${data.length > 50 ? `
            <div class="more-info">
              * Raporda ilk 50 kayıt gösterilmektedir. Tüm kayıtlar için Excel raporunu kullanın.
            </div>
          ` : ''}

          <div class="footer">
            <p>Bu rapor otomatik olarak oluşturulmuştur. | ${currentDate}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.dismiss(toastId);
      toast.success(`${config.displayName} raporu hazır!`);
    } catch (error) {
      logger.error("PDF export error:", error);
      toast.dismiss();
      toast.error("PDF raporu oluşturulamadı");
    }
  }, [fetchModuleData]);

  return {
    exportToPDF
  };
};
