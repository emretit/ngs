import { useCallback } from "react";
import { logger } from '@/utils/logger';
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ModuleReportOptions } from './config';
import { moduleConfig } from './config';
import { useModuleReportData } from './useModuleReportData';

/**
 * Module Report - Excel Export
 * Excel raporu oluşturma ve indirme işlemleri
 */

export const useModuleReportExcel = () => {
  const { fetchModuleData } = useModuleReportData();

  const exportToExcel = useCallback(async (options: ModuleReportOptions) => {
    try {
      const toastId = toast.loading(`${moduleConfig[options.module].displayName} raporu hazırlanıyor...`);
      
      const data = await fetchModuleData(options);
      
      if (data.length === 0) {
        toast.dismiss(toastId);
        toast.error("Rapor için veri bulunamadı");
        return;
      }

      const config = moduleConfig[options.module];
      const workbook = XLSX.utils.book_new();

      // Format data according to column config
      const formattedData = data.map((item: any) => {
        const row: Record<string, any> = {};
        
        Object.entries(config.columns).forEach(([key, label]) => {
          let value = item[key];
          
          // Handle relations (e.g., departments, customers, suppliers)
          if (key.includes('.')) {
            const [relation, field] = key.split('.');
            value = item[relation]?.[field];
          } else if (item.departments && key === 'department') {
            value = item.departments.name;
          } else if (item.customers && key === 'customer_name') {
            value = item.customers.name;
          } else if (item.suppliers && key === 'supplier_name') {
            value = item.suppliers.name;
          } else if (item.vehicles && key === 'vehicle') {
            value = `${item.vehicles.plate_number} - ${item.vehicles.brand} ${item.vehicles.model}`;
          }
          
          // Format dates
          if (value && (key.includes('date') || key.includes('_at'))) {
            try {
              value = format(new Date(value), "dd.MM.yyyy", { locale: tr });
            } catch (e) {
              // Keep original value if date parsing fails
            }
          }
          
          // Format numbers
          if (typeof value === 'number' && (key.includes('amount') || key.includes('price') || key.includes('balance'))) {
            value = value.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
          }
          
          row[label] = value || '-';
        });
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Set column widths
      const columnWidths = Object.keys(config.columns).map(() => ({ wch: 20 }));
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, config.displayName);

      // Generate filename
      const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm");
      const fileName = `${config.displayName}_${dateStr}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      
      toast.dismiss(toastId);
      toast.success(`${config.displayName} raporu indirildi! (${data.length} kayıt)`);
    } catch (error) {
      logger.error("Excel export error:", error);
      toast.dismiss();
      toast.error("Excel raporu oluşturulamadı");
    }
  }, [fetchModuleData]);

  return {
    exportToExcel
  };
};
