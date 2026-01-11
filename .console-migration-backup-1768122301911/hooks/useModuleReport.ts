import { useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export type ModuleType = 
  | "customers"
  | "suppliers"
  | "employees"
  | "products"
  | "vehicles"
  | "sales_invoices"
  | "purchase_invoices"
  | "opportunities"
  | "service_records"
  | "bank_accounts";

interface ModuleReportOptions {
  module: ModuleType;
  startDate?: string;
  endDate?: string;
}

const moduleConfig: Record<ModuleType, {
  tableName: string;
  displayName: string;
  icon: string;
  columns: Record<string, string>;
  relations?: string;
}> = {
  customers: {
    tableName: "customers",
    displayName: "Müşteriler",
    icon: "👥",
    columns: {
      "name": "Müşteri Adı",
      "email": "E-posta",
      "phone": "Telefon",
      "address": "Adres",
      "tax_number": "Vergi No",
      "created_at": "Kayıt Tarihi"
    }
  },
  suppliers: {
    tableName: "suppliers",
    displayName: "Tedarikçiler",
    icon: "🏭",
    columns: {
      "name": "Tedarikçi Adı",
      "email": "E-posta",
      "phone": "Telefon",
      "address": "Adres",
      "tax_number": "Vergi No",
      "created_at": "Kayıt Tarihi"
    }
  },
  employees: {
    tableName: "employees",
    displayName: "Çalışanlar",
    icon: "👔",
    relations: "*, departments(name)",
    columns: {
      "first_name": "Ad",
      "last_name": "Soyad",
      "email": "E-posta",
      "phone": "Telefon",
      "position": "Pozisyon",
      "hire_date": "İşe Başlama",
      "status": "Durum"
    }
  },
  products: {
    tableName: "products",
    displayName: "Ürünler",
    icon: "📦",
    columns: {
      "code": "Ürün Kodu",
      "name": "Ürün Adı",
      "category": "Kategori",
      "unit": "Birim",
      "stock_quantity": "Stok",
      "purchase_price": "Alış Fiyatı",
      "sale_price": "Satış Fiyatı"
    }
  },
  vehicles: {
    tableName: "vehicles",
    displayName: "Araçlar",
    icon: "🚗",
    columns: {
      "plate_number": "Plaka",
      "brand": "Marka",
      "model": "Model",
      "year": "Yıl",
      "fuel_type": "Yakıt Tipi",
      "current_km": "Kilometre",
      "status": "Durum"
    }
  },
  sales_invoices: {
    tableName: "sales_invoices",
    displayName: "Satış Faturaları",
    icon: "💰",
    relations: "*, customers(name)",
    columns: {
      "invoice_number": "Fatura No",
      "invoice_date": "Fatura Tarihi",
      "total_amount": "Tutar",
      "currency": "Para Birimi",
      "status": "Durum",
      "due_date": "Vade Tarihi"
    }
  },
  purchase_invoices: {
    tableName: "purchase_invoices",
    displayName: "Alış Faturaları",
    icon: "🛒",
    relations: "*, suppliers(name)",
    columns: {
      "invoice_number": "Fatura No",
      "invoice_date": "Fatura Tarihi",
      "total_amount": "Tutar",
      "currency": "Para Birimi",
      "status": "Durum",
      "due_date": "Vade Tarihi"
    }
  },
  opportunities: {
    tableName: "opportunities",
    displayName: "Satış Fırsatları",
    icon: "🎯",
    columns: {
      "name": "Fırsat Adı",
      "customer_name": "Müşteri",
      "stage": "Aşama",
      "value": "Değer",
      "currency": "Para Birimi",
      "probability": "Olasılık",
      "expected_close_date": "Beklenen Kapanış"
    }
  },
  service_records: {
    tableName: "service_records",
    displayName: "Servis Kayıtları",
    icon: "🔧",
    relations: "*, vehicles(plate_number, brand, model)",
    columns: {
      "service_type": "Servis Tipi",
      "description": "Açıklama",
      "cost": "Maliyet",
      "service_date": "Servis Tarihi",
      "next_service_km": "Sonraki Servis KM",
      "status": "Durum"
    }
  },
  bank_accounts: {
    tableName: "bank_accounts",
    displayName: "Banka Hesapları",
    icon: "🏦",
    columns: {
      "account_name": "Hesap Adı",
      "bank_name": "Banka",
      "account_type": "Hesap Tipi",
      "iban": "IBAN",
      "current_balance": "Bakiye",
      "currency": "Para Birimi"
    }
  }
};

export function useModuleReport() {
  const fetchModuleData = useCallback(async (options: ModuleReportOptions) => {
    const { module, startDate, endDate } = options;
    const config = moduleConfig[module];

    let query = supabase
      .from(config.tableName)
      .select(config.relations || "*");

    // Date filter için uygun alanı belirle
    const dateFields = ["created_at", "invoice_date", "service_date", "hire_date"];
    const hasDateFilter = startDate && endDate;
    
    if (hasDateFilter) {
      // Tabloda hangi tarih alanı varsa ona göre filtrele
      for (const field of dateFields) {
        if (Object.keys(config.columns).includes(field) || field === "created_at") {
          query = query
            .gte(field, startDate)
            .lte(field, endDate);
          break;
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${module} data:`, error);
      return [];
    }

    return data || [];
  }, []);

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
      console.error("Excel export error:", error);
      toast.dismiss();
      toast.error("Excel raporu oluşturulamadı");
    }
  }, [fetchModuleData]);

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
      console.error("PDF export error:", error);
      toast.dismiss();
      toast.error("PDF raporu oluşturulamadı");
    }
  }, [fetchModuleData]);

  const getRecordCount = useCallback(async (module: ModuleType): Promise<number> => {
    const config = moduleConfig[module];
    const { count, error } = await supabase
      .from(config.tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`Error getting count for ${module}:`, error);
      return 0;
    }

    return count || 0;
  }, []);

  return {
    exportToExcel,
    exportToPDF,
    getRecordCount,
    moduleConfig
  };
}

