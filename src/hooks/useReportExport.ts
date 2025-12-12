import { useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ExportOptions {
  startDate?: string;
  endDate?: string;
  currency?: string;
}

export function useReportExport() {
  const fetchReportData = useCallback(async (options: ExportOptions) => {
    const { startDate, endDate, currency } = options;
    
    // Fetch all report data in parallel
    const [
      salesData,
      purchaseData,
      inventoryData,
      financeData,
      hrData,
      vehicleData
    ] = await Promise.all([
      // Sales data
      supabase
        .from("opportunities")
        .select("*")
        .gte("created_at", startDate || "2020-01-01")
        .lte("created_at", endDate || new Date().toISOString()),
      
      // Purchase data
      supabase
        .from("purchase_invoices")
        .select("*")
        .gte("invoice_date", startDate || "2020-01-01")
        .lte("invoice_date", endDate || new Date().toISOString()),
      
      // Inventory data
      supabase
        .from("products")
        .select("*, product_stocks(*)"),
      
      // Finance data - bank accounts
      supabase
        .from("bank_accounts")
        .select("*"),
      
      // HR data
      supabase
        .from("employees")
        .select("*, departments(name)"),
      
      // Vehicle data
      supabase
        .from("vehicles")
        .select("*")
    ]);

    return {
      sales: salesData.data || [],
      purchases: purchaseData.data || [],
      inventory: inventoryData.data || [],
      finance: financeData.data || [],
      hr: hrData.data || [],
      vehicles: vehicleData.data || []
    };
  }, []);

  const exportToExcel = useCallback(async (options: ExportOptions) => {
    try {
      toast.loading("Excel raporu hazırlanıyor...");
      
      const data = await fetchReportData(options);
      const workbook = XLSX.utils.book_new();

      // Sales Sheet
      if (data.sales.length > 0) {
        const salesSheet = XLSX.utils.json_to_sheet(data.sales.map((s: any) => ({
          "Fırsat Adı": s.name,
          "Müşteri": s.customer_name,
          "Aşama": s.stage,
          "Değer": s.value,
          "Para Birimi": s.currency,
          "Olasılık": `${s.probability}%`,
          "Beklenen Kapanış": s.expected_close_date,
          "Oluşturulma": format(new Date(s.created_at), "dd.MM.yyyy", { locale: tr })
        })));
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Satış Fırsatları");
      }

      // Purchases Sheet
      if (data.purchases.length > 0) {
        const purchaseSheet = XLSX.utils.json_to_sheet(data.purchases.map((p: any) => ({
          "Fatura No": p.invoice_number,
          "Tedarikçi ID": p.supplier_id,
          "Tutar": p.total_amount,
          "Para Birimi": p.currency,
          "Durum": p.status,
          "Fatura Tarihi": format(new Date(p.invoice_date), "dd.MM.yyyy", { locale: tr }),
          "Vade Tarihi": p.due_date ? format(new Date(p.due_date), "dd.MM.yyyy", { locale: tr }) : "-"
        })));
        XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Satın Alma Faturaları");
      }

      // Inventory Sheet
      if (data.inventory.length > 0) {
        const inventorySheet = XLSX.utils.json_to_sheet(data.inventory.map((i: any) => ({
          "Ürün Kodu": i.code,
          "Ürün Adı": i.name,
          "Kategori": i.category,
          "Birim": i.unit,
          "Stok Miktarı": i.stock_quantity,
          "Min Stok": i.min_stock_level,
          "Alış Fiyatı": i.purchase_price,
          "Satış Fiyatı": i.sale_price,
          "Durum": i.is_active ? "Aktif" : "Pasif"
        })));
        XLSX.utils.book_append_sheet(workbook, inventorySheet, "Envanter");
      }

      // Finance Sheet
      if (data.finance.length > 0) {
        const financeSheet = XLSX.utils.json_to_sheet(data.finance.map((f: any) => ({
          "Hesap Adı": f.account_name,
          "Banka": f.bank_name,
          "Hesap Tipi": f.account_type,
          "IBAN": f.iban,
          "Bakiye": f.current_balance,
          "Para Birimi": f.currency,
          "Durum": f.is_active ? "Aktif" : "Pasif"
        })));
        XLSX.utils.book_append_sheet(workbook, financeSheet, "Finans");
      }

      // HR Sheet
      if (data.hr.length > 0) {
        const hrSheet = XLSX.utils.json_to_sheet(data.hr.map((h: any) => ({
          "Ad Soyad": `${h.first_name} ${h.last_name}`,
          "Departman": (h.departments as any)?.name || h.department,
          "Pozisyon": h.position,
          "E-posta": h.email,
          "Telefon": h.phone,
          "İşe Başlama": h.hire_date ? format(new Date(h.hire_date), "dd.MM.yyyy", { locale: tr }) : "-",
          "Durum": h.status
        })));
        XLSX.utils.book_append_sheet(workbook, hrSheet, "İnsan Kaynakları");
      }

      // Vehicles Sheet
      if (data.vehicles.length > 0) {
        const vehicleSheet = XLSX.utils.json_to_sheet(data.vehicles.map((v: any) => ({
          "Plaka": v.plate_number,
          "Marka": v.brand,
          "Model": v.model,
          "Yıl": v.year,
          "Yakıt Tipi": v.fuel_type,
          "Kilometre": v.current_km,
          "Durum": v.status
        })));
        XLSX.utils.book_append_sheet(workbook, vehicleSheet, "Araç Filosu");
      }

      // Generate filename
      const fileName = `Rapor_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      
      // Download
      XLSX.writeFile(workbook, fileName);
      
      toast.dismiss();
      toast.success("Excel raporu indirildi!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.dismiss();
      toast.error("Excel raporu oluşturulamadı");
    }
  }, [fetchReportData]);

  const exportToPDF = useCallback(async (options: ExportOptions) => {
    try {
      toast.loading("PDF raporu hazırlanıyor...");
      
      const data = await fetchReportData(options);
      
      // Create a new window for PDF content
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.dismiss();
        toast.error("Pop-up engelleyici aktif olabilir");
        return;
      }

      const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr });
      const dateRange = options.startDate && options.endDate 
        ? `${format(new Date(options.startDate), "dd.MM.yyyy", { locale: tr })} - ${format(new Date(options.endDate), "dd.MM.yyyy", { locale: tr })}`
        : "Tüm Zamanlar";

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>İş Raporu - ${currentDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 { color: #1e40af; font-size: 28px; }
            .header p { color: #6b7280; margin-top: 8px; }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .section h2 { 
              color: #1e40af; 
              font-size: 18px;
              margin-bottom: 15px;
              padding: 10px;
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 12px;
            }
            th, td { 
              padding: 10px 8px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background: #f1f5f9; 
              font-weight: 600;
              color: #475569;
            }
            tr:hover { background: #f8fafc; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 İş Raporları</h1>
            <p>Rapor Tarihi: ${currentDate} | Dönem: ${dateRange}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.sales.length}</div>
              <div class="stat-label">Toplam Fırsat</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.purchases.length}</div>
              <div class="stat-label">Satın Alma</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.inventory.length}</div>
              <div class="stat-label">Ürün</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.hr.length}</div>
              <div class="stat-label">Çalışan</div>
            </div>
          </div>

          ${data.sales.length > 0 ? `
          <div class="section">
            <h2>💼 Satış Fırsatları (Son 10)</h2>
            <table>
              <thead>
                <tr>
                  <th>Fırsat Adı</th>
                  <th>Müşteri</th>
                  <th>Aşama</th>
                  <th>Değer</th>
                  <th>Olasılık</th>
                </tr>
              </thead>
              <tbody>
                ${data.sales.slice(0, 10).map((s: any) => `
                  <tr>
                    <td>${s.name || '-'}</td>
                    <td>${s.customer_name || '-'}</td>
                    <td>${s.stage || '-'}</td>
                    <td>${s.value?.toLocaleString('tr-TR') || 0} ${s.currency || 'TRY'}</td>
                    <td>${s.probability || 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${data.purchases.length > 0 ? `
          <div class="section">
            <h2>🛒 Satın Alma Faturaları (Son 10)</h2>
            <table>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Fatura Tarihi</th>
                </tr>
              </thead>
              <tbody>
                ${data.purchases.slice(0, 10).map((p: any) => `
                  <tr>
                    <td>${p.invoice_number || '-'}</td>
                    <td>${p.total_amount?.toLocaleString('tr-TR') || 0} ${p.currency || 'TRY'}</td>
                    <td>${p.status || '-'}</td>
                    <td>${p.invoice_date ? format(new Date(p.invoice_date), "dd.MM.yyyy") : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${data.inventory.length > 0 ? `
          <div class="section">
            <h2>📦 Envanter Özeti (Son 10)</h2>
            <table>
              <thead>
                <tr>
                  <th>Ürün Kodu</th>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Fiyat</th>
                </tr>
              </thead>
              <tbody>
                ${data.inventory.slice(0, 10).map((i: any) => `
                  <tr>
                    <td>${i.code || '-'}</td>
                    <td>${i.name || '-'}</td>
                    <td>${i.category || '-'}</td>
                    <td>${i.stock_quantity || 0} ${i.unit || ''}</td>
                    <td>${i.sale_price?.toLocaleString('tr-TR') || 0} TRY</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${data.hr.length > 0 ? `
          <div class="section">
            <h2>👥 Çalışanlar (Son 10)</h2>
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Departman</th>
                  <th>Pozisyon</th>
                  <th>E-posta</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                ${data.hr.slice(0, 10).map((h: any) => `
                  <tr>
                    <td>${h.first_name || ''} ${h.last_name || ''}</td>
                    <td>${(h.departments as any)?.name || h.department || '-'}</td>
                    <td>${h.position || '-'}</td>
                    <td>${h.email || '-'}</td>
                    <td>${h.status || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
      
      toast.dismiss();
      toast.success("PDF raporu hazır!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.dismiss();
      toast.error("PDF raporu oluşturulamadı");
    }
  }, [fetchReportData]);

  return {
    exportToExcel,
    exportToPDF
  };
}
