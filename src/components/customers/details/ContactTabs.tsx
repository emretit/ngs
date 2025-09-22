
import { Activity, Receipt, FileText, CreditCard, FileStack, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { PaymentsTab } from "./PaymentsTab";
import { ProposalsTab } from "./ProposalsTab";
import { Customer } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContactTabsProps {
  customer: Customer;
}

export const ContactTabs = ({ customer }: ContactTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['customer-tab-counts', customer.id],
    queryFn: async () => {
      const [paymentsRes, proposalsRes, serviceRequestsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('id', { count: 'exact' })
          .eq('customer_id', customer.id),
        supabase
          .from('proposals')
          .select('id', { count: 'exact' })
          .eq('customer_id', customer.id),
        supabase
          .from('service_requests')
          .select('id', { count: 'exact' })
          .eq('customer_id', customer.id),
      ]);

      return {
        payments: paymentsRes.count || 0,
        proposals: proposalsRes.count || 0,
        serviceRequests: serviceRequestsRes.count || 0,
        activities: 0, // TODO: Implement activities count
        invoices: 0, // TODO: Implement invoices count
        contracts: 0, // TODO: Implement contracts count
      };
    },
  });

  const TabTrigger = ({ value, icon, label, count }: { 
    value: string; 
    icon: React.ReactNode; 
    label: string; 
    count?: number; 
  }) => (
    <CustomTabsTrigger 
      value={value} 
      className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 relative"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="hidden md:inline">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {count}
          </Badge>
        )}
      </div>
    </CustomTabsTrigger>
  );

  const EmptyState = ({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <Card className="p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Card>
  );

  return (
    <CustomTabs defaultValue="payments" className="space-y-4">
      <CustomTabsList className="grid grid-cols-3 lg:grid-cols-6 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
        <TabTrigger 
          value="payments" 
          icon={<CreditCard className="h-4 w-4" />} 
          label="Ödemeler" 
          count={tabCounts?.payments}
        />
        <TabTrigger 
          value="activities" 
          icon={<Activity className="h-4 w-4" />} 
          label="Aktiviteler" 
          count={tabCounts?.activities}
        />
        <TabTrigger 
          value="service-receipts" 
          icon={<Receipt className="h-4 w-4" />} 
          label="Servis" 
          count={tabCounts?.serviceRequests}
        />
        <TabTrigger 
          value="offers" 
          icon={<FileText className="h-4 w-4" />} 
          label="Teklifler" 
          count={tabCounts?.proposals}
        />
        <TabTrigger 
          value="invoices" 
          icon={<Receipt className="h-4 w-4" />} 
          label="Faturalar" 
          count={tabCounts?.invoices}
        />
        <TabTrigger 
          value="contracts" 
          icon={<FileStack className="h-4 w-4" />} 
          label="Sözleşmeler" 
          count={tabCounts?.contracts}
        />
      </CustomTabsList>

      <CustomTabsContent value="payments">
        <PaymentsTab customer={customer} />
      </CustomTabsContent>

      <CustomTabsContent value="activities">
        <EmptyState
          icon={<Activity className="w-8 h-8 text-gray-400" />}
          title="Aktiviteler"
          description="Müşteri aktiviteleri yakında eklenecek. Bu bölümde müşteri ile yapılan tüm etkileşimler görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="service-receipts">
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-gray-400" />}
          title="Servis Talepleri"
          description="Bu müşteri için oluşturulan servis talepleri burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="offers">
        <ProposalsTab customer={customer} />
      </CustomTabsContent>

      <CustomTabsContent value="invoices">
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-gray-400" />}
          title="Faturalar"
          description="Bu müşteri için kesilen faturalar burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="contracts">
        <EmptyState
          icon={<FileStack className="w-8 h-8 text-gray-400" />}
          title="Sözleşmeler"
          description="Bu müşteri ile imzalanan sözleşmeler burada görüntülenecek."
        />
      </CustomTabsContent>
    </CustomTabs>
  );
};
