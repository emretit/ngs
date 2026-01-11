import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Target, FileText, ShoppingCart, Truck, Receipt } from "lucide-react";

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  value: number;
  urgent: number;
  color: string;
  bgColor: string;
}

export function useWorkflowPipeline() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["workflow-pipeline", companyId],
    queryFn: async (): Promise<PipelineStage[]> => {
      if (!companyId) return getDefaultStages();

      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        opportunitiesResult,
        proposalsResult,
        ordersResult,
        deliveriesResult,
        invoicesResult
      ] = await Promise.all([
        // Active opportunities - 'stage' sütunu yok, 'status' kullanılıyor
        supabase
          .from("opportunities")
          .select("id, value, expected_close_date")
          
          .in("status", ["new", "contacted", "qualified", "negotiation"]),
        
        // Pending proposals
        supabase
          .from("proposals")
          .select("id, total_amount, valid_until")
          
          .in("status", ["draft", "sent", "pending"]),
        
        // Active orders
        supabase
          .from("orders")
          .select("id, total_amount, delivery_date")
          
          .in("status", ["pending", "confirmed", "processing"]),
        
        // Pending deliveries
        supabase
          .from("deliveries")
          .select("id, planned_delivery_date")
          
          .in("status", ["pending", "prepared", "shipped"]),
        
        // Unpaid invoices
        supabase
          .from("sales_invoices")
          .select("id, toplam_tutar, vade_tarihi")
          
          .neq("odeme_durumu", "odendi")
      ]);

      // Calculate urgent counts
      const opportunities = opportunitiesResult.data || [];
      const proposals = proposalsResult.data || [];
      const orders = ordersResult.data || [];
      const deliveries = deliveriesResult.data || [];
      const invoices = invoicesResult.data || [];

      const urgentOpportunities = opportunities.filter(
        o => o.expected_close_date && o.expected_close_date <= today
      ).length;

      const urgentProposals = proposals.filter(
        p => p.valid_until && p.valid_until <= today
      ).length;

      const urgentOrders = orders.filter(
        o => o.delivery_date && o.delivery_date <= today
      ).length;

      const urgentDeliveries = deliveries.filter(
        d => d.planned_delivery_date && d.planned_delivery_date <= today
      ).length;

      const urgentInvoices = invoices.filter(
        i => i.vade_tarihi && i.vade_tarihi <= today
      ).length;

      return [
        {
          id: 'opportunities',
          label: 'Fırsatlar',
          icon: Target,
          count: opportunities.length,
          value: opportunities.reduce((sum, o) => sum + (o.value || 0), 0),
          urgent: urgentOpportunities,
          color: 'bg-purple-500',
          bgColor: 'from-purple-50 to-purple-100/50'
        },
        {
          id: 'proposals',
          label: 'Teklifler',
          icon: FileText,
          count: proposals.length,
          value: proposals.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          urgent: urgentProposals,
          color: 'bg-blue-500',
          bgColor: 'from-blue-50 to-blue-100/50'
        },
        {
          id: 'orders',
          label: 'Siparişler',
          icon: ShoppingCart,
          count: orders.length,
          value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          urgent: urgentOrders,
          color: 'bg-indigo-500',
          bgColor: 'from-indigo-50 to-indigo-100/50'
        },
        {
          id: 'deliveries',
          label: 'Teslimatlar',
          icon: Truck,
          count: deliveries.length,
          value: 0,
          urgent: urgentDeliveries,
          color: 'bg-teal-500',
          bgColor: 'from-teal-50 to-teal-100/50'
        },
        {
          id: 'invoices',
          label: 'Faturalar',
          icon: Receipt,
          count: invoices.length,
          value: invoices.reduce((sum, i) => sum + (i.toplam_tutar || 0), 0),
          urgent: urgentInvoices,
          color: 'bg-emerald-500',
          bgColor: 'from-emerald-50 to-emerald-100/50'
        }
      ];
    },
    enabled: !!companyId,
    staleTime: 30000 // 30 seconds
  });
}

function getDefaultStages(): PipelineStage[] {
  return [
    { id: 'opportunities', label: 'Fırsatlar', icon: Target, count: 0, value: 0, urgent: 0, color: 'bg-purple-500', bgColor: 'from-purple-50 to-purple-100/50' },
    { id: 'proposals', label: 'Teklifler', icon: FileText, count: 0, value: 0, urgent: 0, color: 'bg-blue-500', bgColor: 'from-blue-50 to-blue-100/50' },
    { id: 'orders', label: 'Siparişler', icon: ShoppingCart, count: 0, value: 0, urgent: 0, color: 'bg-indigo-500', bgColor: 'from-indigo-50 to-indigo-100/50' },
    { id: 'deliveries', label: 'Teslimatlar', icon: Truck, count: 0, value: 0, urgent: 0, color: 'bg-teal-500', bgColor: 'from-teal-50 to-teal-100/50' },
    { id: 'invoices', label: 'Faturalar', icon: Receipt, count: 0, value: 0, urgent: 0, color: 'bg-emerald-500', bgColor: 'from-emerald-50 to-emerald-100/50' }
  ];
}
