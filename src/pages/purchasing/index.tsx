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
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig } from "@/components/module-dashboard";

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
          invoiceStats: { total: 0, unpaid: 0, totalAmount: 0 },
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
        unpaid: invoices.filter((inv: any) => inv.payment_status === "unpaid" || inv.payment_status === "partial").length,
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
    invoiceStats: { total: 0, unpaid: 0, totalAmount: 0 },
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
      stats: [
        { label: "Toplam Talep", value: stats.prStats.total },
        { label: "Bekleyen Onay", value: stats.prStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Onaylanan",
        value: stats.prStats.approved,
        color: "success",
      },
    },
    {
      id: "rfqs",
      title: "Teklif İstekleri",
      subtitle: "RFQ süreçleri",
      icon: MessageSquare,
      color: "purple",
      href: "/purchasing/rfqs",
      newButton: { href: "/purchasing/rfqs/new" },
      stats: [
        { label: "Aktif RFQ", value: stats.rfqStats.active },
        { label: "Bekleyen Teklif", value: stats.rfqStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Tamamlanan",
        value: stats.rfqStats.completed,
        color: "success",
      },
    },
    {
      id: "purchase-orders",
      title: "Satın Alma Siparişleri",
      subtitle: "PO süreçleri",
      icon: ShoppingCart,
      color: "green",
      href: "/purchasing/orders",
      newButton: { href: "/purchasing/orders/new" },
      stats: [
        { label: "Toplam Sipariş", value: stats.poStats.total },
        { label: "Onayda", value: stats.poStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(stats.poStats.totalValue, 'TRY'),
        color: "success",
      },
    },
    {
      id: "supplier-invoices",
      title: "Tedarikçi Faturaları",
      subtitle: "Gelen faturalar",
      icon: Receipt,
      color: "orange",
      href: "/purchasing/invoices",
      newButton: { href: "/purchasing/invoices/new" },
      stats: [
        { label: "Toplam Fatura", value: stats.invoiceStats.total },
        { label: "Ödenmemiş", value: stats.invoiceStats.unpaid, color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(stats.invoiceStats.totalAmount, 'TRY'),
        color: "success",
      },
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
