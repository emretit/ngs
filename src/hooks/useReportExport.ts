import { useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { ReportType } from "@/components/reports/ReportExportModal";

interface ExportOptions {
  startDate?: string;
  endDate?: string;
  currency?: string;
  reportTypes?: ReportType[];
}

interface ReportData {
  sales: any[];
  purchases: any[];
  inventory: any[];
  finance: any[];
  hr: any[];
  vehicles: any[];
  service: any[];
}

export function useReportExport() {
  const fetchReportData = useCallback(async (options: ExportOptions): Promise<ReportData> => {
    const { startDate, endDate, reportTypes = ["sales"] } = options;
    
    const result: ReportData = {
      sales: [],
      purchases: [],
      inventory: [],
      finance: [],
      hr: [],
      vehicles: [],
      service: []
    };

    const fetchPromises: Promise<void>[] = [];

    // Sales data
    if (reportTypes.includes("sales")) {
      fetchPromises.push(
        supabase
          .from("opportunities")
          .select("*")
          .gte("created_at", startDate || "2020-01-01")
          .lte("created_at", endDate || new Date().toISOString())
          .then(({ data }) => { result.sales = data || []; })
      );
    }

    // Purchase data
    if (reportTypes.includes("purchasing")) {
      fetchPromises.push(
        supabase
          .from("purchase_invoices")
          .select("*, suppliers(name)")
          .gte("invoice_date", startDate || "2020-01-01")
          .lte("invoice_date", endDate || new Date().toISOString())
          .then(({ data }) => { result.purchases = data || []; })
      );
    }

    // Inventory data
    if (reportTypes.includes("inventory")) {
      fetchPromises.push(
        supabase
          .from("products")
          .select("*, product_stocks(*)")
          .then(({ data }) => { result.inventory = data || []; })
      );
    }

    // Finance data
    if (reportTypes.includes("finance")) {
      fetchPromises.push(
        supabase
          .from("bank_accounts")
          .select("*")
          .then(({ data }) => { result.finance = data || []; })
      );
    }

    // HR data
    if (reportTypes.includes("hr")) {
      fetchPromises.push(
        supabase
          .from("employees")
          .select("*, departments(name)")
          .then(({ data }) => { result.hr = data || []; })
      );
    }

    // Vehicle data
    if (reportTypes.includes("vehicles")) {
      fetchPromises.push(
        supabase
          .from("vehicles")
          .select("*")
          .then(({ data }) => { result.vehicles = data || []; })
      );
    }

    // Service data
    if (reportTypes.includes("service")) {
      fetchPromises.push(
        supabase
          .from("service_records")
          .select("*, vehicles(plate_number, brand, model)")
          .gte("service_date", startDate || "2020-01-01")
          .lte("service_date", endDate || new Date().toISOString())
          .then(({ data }) => { result.service = data || []; })
      );
    }

    await Promise.all(fetchPromises);
    return result;
  }, []);

  const getReportLabel = (reportType: ReportType): string => {
    const labels: Record<ReportType, string> = {
      sales: "Satış Fırsatları",
      purchasing: "Satın Alma Faturaları",
      inventory: "Envanter",
      finance: "Finans",
      hr: "İnsan Kaynakları",
      vehicles: "Araç Filosu",
      service: "Servis Kayıtları"
    };
    return labels[reportType];
  };

  const exportToExcel = useCallback(async (options: ExportOptions) => {
    try {
      const toastId = toast.loading("Excel raporu hazırlanıyor...");
      
      const data = await fetchReportData(options);
      const workbook = XLSX.utils.book_new();
      let sheetCount = 0;

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
          "Oluşturulma": s.created_at ? format(new Date(s.created_at), "dd.MM.yyyy", { locale: tr }) : "-"
        })));
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Satış Fırsatları");
        sheetCount++;
      }

      // Purchases Sheet
      if (data.purchases.length > 0) {
        const purchaseSheet = XLSX.utils.json_to_sheet(data.purchases.map((p: any) => ({
          "Fatura No": p.invoice_number,
          "Tedarikçi": (p.suppliers as any)?.name || "-",
          "Tutar": p.total_amount,
          "Para Birimi": p.currency,
          "Durum": p.status,
          "Fatura Tarihi": p.invoice_date ? format(new Date(p.invoice_date), "dd.MM.yyyy", { locale: tr }) : "-",
          "Vade Tarihi": p.due_date ? format(new Date(p.due_date), "dd.MM.yyyy", { locale: tr }) : "-"
        })));
        XLSX.utils.book_append_sheet(workbook, purchaseSheet, "Satın Alma");
        sheetCount++;
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
        sheetCount++;
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
        sheetCount++;
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
        sheetCount++;
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
        sheetCount++;
      }

      // Service Sheet
      if (data.service.length > 0) {
        const serviceSheet = XLSX.utils.json_to_sheet(data.service.map((s: any) => ({
          "Araç": s.vehicles ? `${(s.vehicles as any).plate_number} - ${(s.vehicles as any).brand} ${(s.vehicles as any).model}` : "-",
          "Servis Tipi": s.service_type,
          "Açıklama": s.description,
          "Maliyet": s.cost,
          "Servis Tarihi": s.service_date ? format(new Date(s.service_date), "dd.MM.yyyy", { locale: tr }) : "-",
          "Sonraki Servis KM": s.next_service_km,
          "Durum": s.status
        })));
        XLSX.utils.book_append_sheet(workbook, serviceSheet, "Servis Kayıtları");
        sheetCount++;
      }

      if (sheetCount === 0) {
        toast.dismiss(toastId);
        toast.error("Seçilen raporlarda veri bulunamadı");
        return;
      }

      // Generate filename
      const reportNames = options.reportTypes?.map(getReportLabel).join("-") || "Tum-Raporlar";
      const fileName = `${reportNames}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      
      // Download
      XLSX.writeFile(workbook, fileName);
      
      toast.dismiss(toastId);
      toast.success(`Excel raporu indirildi! (${sheetCount} sayfa)`);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.dismiss();
      toast.error("Excel raporu oluşturulamadı");
    }
  }, [fetchReportData]);

  const exportToPDF = useCallback(async (options: ExportOptions) => {
    try {
      const toastId = toast.loading("PDF raporu hazırlanıyor...");
      
      const data = await fetchReportData(options);
      
      // Create a new window for PDF content
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.dismiss(toastId);
        toast.error("Pop-up engelleyici aktif olabilir");
        return;
      }

      const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr });
      const dateRange = options.startDate && options.endDate 
        ? `${format(new Date(options.startDate), "dd.MM.yyyy", { locale: tr })} - ${format(new Date(options.endDate), "dd.MM.yyyy", { locale: tr })}`
        : "Tüm Zamanlar";

      const selectedReports = options.reportTypes || ["sales"];
      const reportLabels = selectedReports.map(getReportLabel).join(", ");

      // Generate sections based on selected reports
      const generateSections = () => {
        let sections = "";

        if (selectedReports.includes("sales") && data.sales.length > 0) {
          sections += `
          <div class="section">
            <h2>💼 Satış Fırsatları (${data.sales.length} kayıt)</h2>
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
                ${data.sales.slice(0, 20).map((s: any) => `
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
            ${data.sales.length > 20 ? `<p class="more-info">... ve ${data.sales.length - 20} kayıt daha</p>` : ''}
          </div>`;
        }

        if (selectedReports.includes("purchasing") && data.purchases.length > 0) {
          sections += `
          <div class="section">
            <h2>🛒 Satın Alma Faturaları (${data.purchases.length} kayıt)</h2>
            <table>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Tedarikçi</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Fatura Tarihi</th>
                </tr>
              </thead>
              <tbody>
                ${data.purchases.slice(0, 20).map((p: any) => `
                  <tr>
                    <td>${p.invoice_number || '-'}</td>
                    <td>${(p.suppliers as any)?.name || '-'}</td>
                    <td>${p.total_amount?.toLocaleString('tr-TR') || 0} ${p.currency || 'TRY'}</td>
                    <td>${p.status || '-'}</td>
                    <td>${p.invoice_date ? format(new Date(p.invoice_date), "dd.MM.yyyy") : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${data.purchases.length > 20 ? `<p class="more-info">... ve ${data.purchases.length - 20} kayıt daha</p>` : ''}
          </div>`;
        }

        if (selectedReports.includes("inventory") && data.inventory.length > 0) {
          sections += `
          <div class="section">
            <h2>📦 Envanter Özeti (${data.inventory.length} ürün)</h2>
            <table>
              <thead>
                <tr>
                  <th>Ürün Kodu</th>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Satış Fiyatı</th>
                </tr>
              </thead>
              <tbody>
                ${data.inventory.slice(0, 20).map((i: any) => `
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
            ${data.inventory.length > 20 ? `<p class="more-info">... ve ${data.inventory.length - 20} ürün daha</p>` : ''}
          </div>`;
        }

        if (selectedReports.includes("finance") && data.finance.length > 0) {
          const totalBalance = data.finance.reduce((sum: number, f: any) => sum + (f.current_balance || 0), 0);
          sections += `
          <div class="section">
            <h2>💰 Finans Özeti (${data.finance.length} hesap)</h2>
            <div class="summary-box">
              <strong>Toplam Bakiye:</strong> ${totalBalance.toLocaleString('tr-TR')} TRY
            </div>
            <table>
              <thead>
                <tr>
                  <th>Hesap Adı</th>
                  <th>Banka</th>
                  <th>Hesap Tipi</th>
                  <th>Bakiye</th>
                  <th>Para Birimi</th>
                </tr>
              </thead>
              <tbody>
                ${data.finance.map((f: any) => `
                  <tr>
                    <td>${f.account_name || '-'}</td>
                    <td>${f.bank_name || '-'}</td>
                    <td>${f.account_type || '-'}</td>
                    <td>${f.current_balance?.toLocaleString('tr-TR') || 0}</td>
                    <td>${f.currency || 'TRY'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`;
        }

        if (selectedReports.includes("hr") && data.hr.length > 0) {
          sections += `
          <div class="section">
            <h2>👥 Çalışanlar (${data.hr.length} kişi)</h2>
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
                ${data.hr.slice(0, 20).map((h: any) => `
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
            ${data.hr.length > 20 ? `<p class="more-info">... ve ${data.hr.length - 20} çalışan daha</p>` : ''}
          </div>`;
        }

        if (selectedReports.includes("vehicles") && data.vehicles.length > 0) {
          sections += `
          <div class="section">
            <h2>🚗 Araç Filosu (${data.vehicles.length} araç)</h2>
            <table>
              <thead>
                <tr>
                  <th>Plaka</th>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Yıl</th>
                  <th>Kilometre</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                ${data.vehicles.map((v: any) => `
                  <tr>
                    <td>${v.plate_number || '-'}</td>
                    <td>${v.brand || '-'}</td>
                    <td>${v.model || '-'}</td>
                    <td>${v.year || '-'}</td>
                    <td>${v.current_km?.toLocaleString('tr-TR') || 0} km</td>
                    <td>${v.status || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`;
        }

        if (selectedReports.includes("service") && data.service.length > 0) {
          const totalCost = data.service.reduce((sum: number, s: any) => sum + (s.cost || 0), 0);
          sections += `
          <div class="section">
            <h2>🔧 Servis Kayıtları (${data.service.length} kayıt)</h2>
            <div class="summary-box">
              <strong>Toplam Servis Maliyeti:</strong> ${totalCost.toLocaleString('tr-TR')} TRY
            </div>
            <table>
              <thead>
                <tr>
                  <th>Araç</th>
                  <th>Servis Tipi</th>
                  <th>Maliyet</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                ${data.service.slice(0, 20).map((s: any) => `
                  <tr>
                    <td>${s.vehicles ? `${(s.vehicles as any).plate_number}` : '-'}</td>
                    <td>${s.service_type || '-'}</td>
                    <td>${s.cost?.toLocaleString('tr-TR') || 0} TRY</td>
                    <td>${s.service_date ? format(new Date(s.service_date), "dd.MM.yyyy") : '-'}</td>
                    <td>${s.status || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${data.service.length > 20 ? `<p class="more-info">... ve ${data.service.length - 20} kayıt daha</p>` : ''}
          </div>`;
        }

        return sections;
      };

      // Calculate stats
      const stats = [];
      if (selectedReports.includes("sales")) stats.push({ value: data.sales.length, label: "Satış Fırsatı" });
      if (selectedReports.includes("purchasing")) stats.push({ value: data.purchases.length, label: "Satın Alma" });
      if (selectedReports.includes("inventory")) stats.push({ value: data.inventory.length, label: "Ürün" });
      if (selectedReports.includes("finance")) stats.push({ value: data.finance.length, label: "Hesap" });
      if (selectedReports.includes("hr")) stats.push({ value: data.hr.length, label: "Çalışan" });
      if (selectedReports.includes("vehicles")) stats.push({ value: data.vehicles.length, label: "Araç" });
      if (selectedReports.includes("service")) stats.push({ value: data.service.length, label: "Servis" });

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
              line-height: 1.5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px;
              border-bottom: 3px solid #dc2626;
              padding-bottom: 20px;
            }
            .header h1 { color: #dc2626; font-size: 28px; }
            .header p { color: #6b7280; margin-top: 8px; }
            .header .report-types { 
              font-size: 12px; 
              color: #9ca3af; 
              margin-top: 4px;
            }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .section h2 { 
              color: #dc2626; 
              font-size: 18px;
              margin-bottom: 15px;
              padding: 10px;
              background: #fef2f2;
              border-left: 4px solid #dc2626;
            }
            .summary-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 15px;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value { font-size: 24px; font-weight: bold; color: #dc2626; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 11px;
              margin-top: 10px;
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
            }
            tr:hover { background: #f8fafc; }
            .more-info {
              font-size: 11px;
              color: #9ca3af;
              font-style: italic;
              margin-top: 8px;
              text-align: right;
            }
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
            <p class="report-types">Seçili Raporlar: ${reportLabels}</p>
          </div>

          <div class="stats-grid">
            ${stats.map(s => `
              <div class="stat-card">
                <div class="stat-value">${s.value}</div>
                <div class="stat-label">${s.label}</div>
              </div>
            `).join('')}
          </div>

          ${generateSections()}

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
