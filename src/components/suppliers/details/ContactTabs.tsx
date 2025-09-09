
import { Activity, Receipt, FileText, CreditCard, FileStack, TrendingUp, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { ContactInfo } from "./ContactInfo";
import { FinancialInfo } from "./FinancialInfo";
import { HistoryCard } from "./HistoryCard";
import { Supplier } from "@/types/supplier";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContactTabsProps {
  supplier: Supplier;
}

export const ContactTabs = ({ supplier }: ContactTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['supplier-tab-counts', supplier.id],
    queryFn: async () => {
      const [paymentsRes, purchaseOrdersRes] = await Promise.all([
        supabase
          .from('payments')
          .select('id', { count: 'exact' })
          .eq('supplier_id', supplier.id),
        supabase
          .from('purchase_orders')
          .select('id', { count: 'exact' })
          .eq('supplier_id', supplier.id),
      ]);

      return {
        payments: paymentsRes.count || 0,
        proposals: 0, // TODO: Implement proposals count
        purchaseOrders: purchaseOrdersRes.count || 0,
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
    <CustomTabs defaultValue="overview" className="space-y-4">
      <CustomTabsList className="grid grid-cols-3 lg:grid-cols-6 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
        <TabTrigger 
          value="overview" 
          icon={<TrendingUp className="h-4 w-4" />} 
          label="Genel Bakış" 
        />
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
          value="orders" 
          icon={<Package className="h-4 w-4" />} 
          label="Siparişler" 
          count={tabCounts?.purchaseOrders}
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

      <CustomTabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ContactInfo supplier={supplier} onUpdate={(updatedSupplier) => {
              // Supplier güncellendiğinde ana query'yi yeniden fetch edebiliriz
              console.log('Supplier updated:', updatedSupplier);
            }} />
            <FinancialInfo supplier={supplier} />
          </div>
          <div>
            <HistoryCard supplier={supplier} />
          </div>
        </div>
      </CustomTabsContent>

      <CustomTabsContent value="payments">
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-gray-400" />}
          title="Ödemeler"
          description="Bu tedarikçi için yapılan ödemeler burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="activities">
        <EmptyState
          icon={<Activity className="w-8 h-8 text-gray-400" />}
          title="Aktiviteler"
          description="Tedarikçi aktiviteleri yakında eklenecek. Bu bölümde tedarikçi ile yapılan tüm etkileşimler görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="orders">
        <EmptyState
          icon={<Package className="w-8 h-8 text-gray-400" />}
          title="Satın Alma Siparişleri"
          description="Bu tedarikçiye verilen siparişler burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="invoices">
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-gray-400" />}
          title="Faturalar"
          description="Bu tedarikçiden alınan faturalar burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="contracts">
        <EmptyState
          icon={<FileStack className="w-8 h-8 text-gray-400" />}
          title="Sözleşmeler"
          description="Bu tedarikçi ile imzalanan sözleşmeler burada görüntülenecek."
        />
      </CustomTabsContent>
    </CustomTabs>
  );
};
