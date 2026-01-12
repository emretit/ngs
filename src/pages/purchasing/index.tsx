import React from "react";
import {
  FileText,
  PackageCheck,
  ShoppingCart,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig, CardSummaryProps } from "@/components/module-dashboard";

const PurchasingDashboard = () => {
  const { userData } = useCurrentUser();

  // Optimized single query for dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['purchasing-dashboard-stats', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return {
          prStats: { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 },
          poStats: { draft: 0, pending: 0, confirmed: 0, received: 0, total: 0, totalValue: 0 },
          rfqStats: { active: 0, pending: 0, completed: 0, total: 0 },
          invoiceStats: { total: 0, unpaid: 0, paid: 0, partial: 0, totalAmount: 0 },
        };
      }

      const [prResult, poResult, rfqResult, invoiceResult] = await Promise.all([
        supabase
          .from('purchase_requests')
          .select('status', { count: 'exact', head: false }),
        supabase
          .from('purchase_orders')
          .select('status, total_amount', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        supabase
          .from('rfqs')
          .select('status', { count: 'exact', head: false }),
        supabase
          .from('supplier_invoices')
          .select('payment_status, total_amount', { count: 'exact', head: false }),
      ]);

      const prs = prResult.data || [];
      const prStats = {
        draft: prs.filter((r: any) => r.status === "draft").length,
        pending: prs.filter((r: any) => r.status === "submitted").length,
        approved: prs.filter((r: any) => r.status === "approved").length,
        rejected: prs.filter((r: any) => r.status === "rejected").length,
        total: prResult.count || 0,
      };

      const pos = poResult.data || [];
      const poStats = {
        draft: pos.filter((o: any) => o.status === "draft").length,
        pending: pos.filter((o: any) => o.status === "submitted").length,
        confirmed: pos.filter((o: any) => o.status === "confirmed").length,
        received: pos.filter((o: any) => o.status === "received").length,
        total: poResult.count || 0,
        totalValue: pos.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
      };

      const rfqs = rfqResult.data || [];
      const rfqStats = {
        active: rfqs.filter((r: any) => r.status === "open" || r.status === "sent").length,
        pending: rfqs.filter((r: any) => r.status === "open").length,
        completed: rfqs.filter((r: any) => r.status === "closed" || r.status === "awarded").length,
        total: rfqResult.count || 0,
      };

      const invoices = invoiceResult.data || [];
      const invoiceStats = {
        total: invoiceResult.count || 0,
        unpaid: invoices.filter((inv: any) => inv.payment_status === "unpaid").length,
        paid: invoices.filter((inv: any) => inv.payment_status === "paid").length,
        partial: invoices.filter((inv: any) => inv.payment_status === "partial").length,
        totalAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0),
      };

      return { prStats, poStats, rfqStats, invoiceStats };
    },
    enabled: !!userData?.company_id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const stats = dashboardStats || {
    prStats: { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 },
    poStats: { draft: 0, pending: 0, confirmed: 0, received: 0, total: 0, totalValue: 0 },
    rfqStats: { active: 0, pending: 0, completed: 0, total: 0 },
    invoiceStats: { total: 0, unpaid: 0, paid: 0, partial: 0, totalAmount: 0 },
  };

  // CardSummary configurations
  const prSummary: CardSummaryProps = {
    mainMetric: { value: stats.prStats.total, label: "Toplam Talep", color: "blue" },
    statusGrid: [
      { label: "Taslak", value: stats.prStats.draft, color: "gray" },
      { label: "Bekleyen", value: stats.prStats.pending, color: "yellow" },
      { label: "Onaylı", value: stats.prStats.approved, color: "green" },
      { label: "Reddedilen", value: stats.prStats.rejected, color: "red" },
    ],
    footer: stats.prStats.total > 0 ? {
      type: "progress",
      progressLabel: "Onay Oranı",
      progressValue: Math.round((stats.prStats.approved / stats.prStats.total) * 100),
      progressColor: "green",
    } : undefined,
    compact: true,
    gridCols: 2,
  };

  const rfqSummary: CardSummaryProps = {
    mainMetric: { value: stats.rfqStats.total, label: "Toplam RFQ", color: "purple" },
    statusGrid: [
      { label: "Aktif", value: stats.rfqStats.active, color: "blue" },
      { label: "Bekleyen", value: stats.rfqStats.pending, color: "yellow" },
      { label: "Tamamlanan", value: stats.rfqStats.completed, color: "green" },
    ],
    footer: stats.rfqStats.total > 0 ? {
      type: "progress",
      progressLabel: "Tamamlanma Oranı",
      progressValue: Math.round((stats.rfqStats.completed / stats.rfqStats.total) * 100),
      progressColor: "purple",
    } : undefined,
    compact: true,
    gridCols: 3,
  };

  const poSummary: CardSummaryProps = {
    mainMetric: { value: stats.poStats.total, label: "Toplam Sipariş", color: "green" },
    statusGrid: [
      { label: "Taslak", value: stats.poStats.draft, color: "gray" },
      { label: "Onayda", value: stats.poStats.pending, color: "yellow" },
      { label: "Onaylı", value: stats.poStats.confirmed, color: "green" },
      { label: "Teslim", value: stats.poStats.received, color: "blue" },
    ],
    footer: {
      type: "value",
      valueLabel: "Toplam Tutar",
      value: formatCurrency(stats.poStats.totalValue, 'TRY'),
      valueColor: "success",
    },
    compact: true,
    gridCols: 2,
  };

  const invoiceSummary: CardSummaryProps = {
    mainMetric: { value: stats.invoiceStats.total, label: "Toplam Fatura", color: "orange" },
    statusGrid: [
      { label: "Ödenmemiş", value: stats.invoiceStats.unpaid, color: "red" },
      { label: "Kısmi", value: stats.invoiceStats.partial, color: "yellow" },
      { label: "Ödendi", value: stats.invoiceStats.paid, color: "green" },
    ],
    footer: {
      type: "value",
      valueLabel: "Toplam Tutar",
      value: formatCurrency(stats.invoiceStats.totalAmount, 'TRY'),
      valueColor: "success",
    },
    compact: true,
    gridCols: 3,
  };

  const cards: QuickLinkCardConfig[] = [
    {
      id: "purchase-requests",
      title: "Satın Alma Talepleri",
      subtitle: "İç talep süreçleri",
      icon: FileText,
      color: "blue",
      href: "/purchasing/requests",
      newButton: { href: "/purchasing/requests/new" },
      summaryConfig: prSummary,
    },
    {
      id: "rfqs",
      title: "Teklif İstekleri",
      subtitle: "RFQ süreçleri",
      icon: MessageSquare,
      color: "purple",
      href: "/purchasing/rfqs",
      newButton: { href: "/purchasing/rfqs/new" },
      summaryConfig: rfqSummary,
    },
    {
      id: "purchase-orders",
      title: "Satın Alma Siparişleri",
      subtitle: "PO süreçleri",
      icon: ShoppingCart,
      color: "green",
      href: "/purchasing/orders",
      newButton: { href: "/purchasing/orders/new" },
      summaryConfig: poSummary,
    },
    {
      id: "supplier-invoices",
      title: "Tedarikçi Faturaları",
      subtitle: "Gelen faturalar",
      icon: Receipt,
      color: "orange",
      href: "/purchasing/invoices",
      newButton: { href: "/purchasing/invoices/new" },
      summaryConfig: invoiceSummary,
    },
  ];

  const config: ModuleDashboardConfig = {
    header: {
      title: "Satın Alma Yönetimi",
      subtitle: "Tüm satın alma işlemlerinizi takip edin ve yönetin",
      icon: PackageCheck,
    },
    cards,
  };

  return <ModuleDashboard config={config} isLoading={statsLoading} gridCols={4} />;
};

export default React.memo(PurchasingDashboard);
