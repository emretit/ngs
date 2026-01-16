import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";

interface CashflowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  previousMonthNet: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  monthlyData: { month: string; inflow: number; outflow: number; net: number }[];
}

export const useCashflowSummary = () => {
  const { companyId } = useCompany();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ["cashflow-summary", companyId, currentYear, currentMonth],
    queryFn: async (): Promise<CashflowSummary> => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Get current year cashflow data
      const { data, error } = await supabase
        .from("cashflow_main")
        .select("*")
        .eq("company_id", companyId)
        .eq("year", currentYear)
        .order("month", { ascending: true });

      if (error) throw error;

      // Calculate monthly summaries
      const monthlyData: CashflowSummary["monthlyData"] = [];
      
      for (let month = 1; month <= 12; month++) {
        const monthData = data?.filter((d) => d.month === month) || [];
        
        const inflow = monthData
          .filter((d) => d.main_category === "Nakit Girişleri")
          .reduce((sum, d) => sum + (d.value || 0), 0);
        
        const outflow = monthData
          .filter((d) => d.main_category === "Nakit Çıkışları")
          .reduce((sum, d) => sum + (d.value || 0), 0);

        monthlyData.push({
          month: new Date(currentYear, month - 1).toLocaleString("tr-TR", { month: "short" }),
          inflow,
          outflow,
          net: inflow - outflow,
        });
      }

      // Current month data
      const currentMonthData = monthlyData[currentMonth - 1] || { inflow: 0, outflow: 0, net: 0 };
      const previousMonthData = monthlyData[currentMonth - 2] || { inflow: 0, outflow: 0, net: 0 };

      // Calculate trend
      let trend: "up" | "down" | "stable" = "stable";
      let trendPercentage = 0;

      if (previousMonthData.net !== 0) {
        trendPercentage = ((currentMonthData.net - previousMonthData.net) / Math.abs(previousMonthData.net)) * 100;
        if (trendPercentage > 5) trend = "up";
        else if (trendPercentage < -5) trend = "down";
      }

      return {
        totalInflow: currentMonthData.inflow,
        totalOutflow: currentMonthData.outflow,
        netCashflow: currentMonthData.net,
        previousMonthNet: previousMonthData.net,
        trend,
        trendPercentage: Math.abs(trendPercentage),
        monthlyData: monthlyData.slice(0, currentMonth), // Only show up to current month
      };
    },
    enabled: !!companyId,
  });
};
