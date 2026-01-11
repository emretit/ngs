import { useModuleReportData } from './module-report/useModuleReportData';
import { useModuleReportExcel } from './module-report/useModuleReportExcel';
import { useModuleReportPDF } from './module-report/useModuleReportPDF';

// Re-export types and config
export type { ModuleType, ModuleReportOptions, ModuleConfig } from './module-report/config';
export { moduleConfig } from './module-report/config';

/**
 * Module Report Hook (Facade)
 * 
 * Bu hook, modül rapor işlemlerini tek bir interface'de toplar:
 * - useModuleReportData: Veri çekme ve kayıt sayısı
 * - useModuleReportExcel: Excel export
 * - useModuleReportPDF: PDF export (print dialog)
 * 
 * @example
 * const { exportToExcel, exportToPDF, getRecordCount } = useModuleReport();
 * 
 * // Excel export
 * exportToExcel({ module: 'customers', startDate: '2024-01-01', endDate: '2024-12-31' });
 * 
 * // PDF export
 * exportToPDF({ module: 'sales_invoices' });
 * 
 * // Get count
 * const count = await getRecordCount('products');
 */
export function useModuleReport() {
  const data = useModuleReportData();
  const excel = useModuleReportExcel();
  const pdf = useModuleReportPDF();

  // Import moduleConfig for external usage
  const { moduleConfig: config } = require('./module-report/config');

  return {
    // Data operations
    fetchModuleData: data.fetchModuleData,
    getRecordCount: data.getRecordCount,
    
    // Export operations
    exportToExcel: excel.exportToExcel,
    exportToPDF: pdf.exportToPDF,
    
    // Config
    moduleConfig: config,
  };
}
