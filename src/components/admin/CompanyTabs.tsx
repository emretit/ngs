import { Users, Receipt, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/custom-tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CompanyUsersTab from "./CompanyUsersTab";
import CompanyFinancialsTab from "./CompanyFinancialsTab";

interface CompanyTabsProps {
  companyId: string;
}

export const CompanyTabs = ({ companyId }: CompanyTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['company-tab-counts', companyId],
    queryFn: async () => {
      const [usersRes, salesInvoicesRes, purchaseInvoicesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
        supabase
          .from('sales_invoices')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
        supabase
          .from('purchase_invoices')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
      ]);

      return {
        users: usersRes.count || 0,
        invoices: (salesInvoicesRes.count || 0) + (purchaseInvoicesRes.count || 0),
      };
    },
  });

  const TabTrigger = ({
    value,
    icon,
    label,
    count,
  }: {
    value: string;
    icon: React.ReactNode;
    label: string;
    count?: number;
  }) => (
    <CustomTabsTrigger
      value={value}
      className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {icon}
        <span className="text-xs sm:text-sm">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
            {count}
          </Badge>
        )}
      </div>
    </CustomTabsTrigger>
  );

  return (
    <CustomTabs defaultValue="users" className="space-y-4">
      <CustomTabsList className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm flex flex-nowrap justify-start sm:justify-center">
        <TabTrigger value="users" icon={<Users className="h-4 w-4" />} label="Kullanıcılar" count={tabCounts?.users} />
        <TabTrigger value="financials" icon={<Receipt className="h-4 w-4" />} label="Finansal" count={tabCounts?.invoices} />
      </CustomTabsList>

      <CustomTabsContent value="users">
        <CompanyUsersTab companyId={companyId} />
      </CustomTabsContent>

      <CustomTabsContent value="financials">
        <CompanyFinancialsTab companyId={companyId} />
      </CustomTabsContent>
    </CustomTabs>
  );
};
