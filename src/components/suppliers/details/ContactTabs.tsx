
import { Activity, Receipt, CreditCard, FileStack, Package, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { Supplier } from "@/types/supplier";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SupplierInvoicesTab from './SupplierInvoicesTab';
import { PaymentsTab } from './PaymentsTab';
import SupplierPortalActivityLog from "@/components/supplier-portal/SupplierPortalActivityLog";
import { ActivitiesList } from './ActivitiesList';
import { PurchaseOrdersTab } from './PurchaseOrdersTab';

interface ContactTabsProps {
  supplier: Supplier;
}

export const ContactTabs = ({ supplier }: ContactTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['supplier-tab-counts', supplier.id],
    queryFn: async () => {
      const [paymentsRes, purchaseOrdersRes, purchaseInvoicesRes, salesInvoicesRes, activitiesRes] = await Promise.all([
        supabase
          .from('payments')
          .select('id', { count: 'exact' })
          .eq('supplier_id', supplier.id),
        supabase
          .from('purchase_orders')
          .select('id', { count: 'exact' })
          .eq('supplier_id', supplier.id),
        supabase
          .from('purchase_invoices')
          .select('id', { count: 'exact' })
          .eq('supplier_id', supplier.id),
        supabase
          .from('sales_invoices')
          .select('id', { count: 'exact' })
          .eq('customer_id', supplier.id), // Tedarikçi aynı zamanda müşteri olabilir
        supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('related_item_type', 'supplier')
          .eq('related_item_id', supplier.id),
      ]);

      return {
        payments: paymentsRes.count || 0,
        purchaseOrders: purchaseOrdersRes.count || 0,
        activities: activitiesRes.count || 0,
        invoices: (purchaseInvoicesRes.count || 0) + (salesInvoicesRes.count || 0),
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
        <span className="text-sm">{label}</span>
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
      <CustomTabsList className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm flex flex-nowrap justify-start sm:justify-center">
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
        {supplier.portal_enabled && (
          <TabTrigger 
            value="portal" 
            icon={<ExternalLink className="h-4 w-4" />} 
            label="Portal" 
          />
        )}
      </CustomTabsList>

      <CustomTabsContent value="payments">
        <PaymentsTab supplier={supplier} />
      </CustomTabsContent>

      <CustomTabsContent value="activities">
        <ActivitiesList supplier={supplier} />
      </CustomTabsContent>

      <CustomTabsContent value="orders">
        <PurchaseOrdersTab supplier={supplier} />
      </CustomTabsContent>

      <CustomTabsContent value="invoices">
        <SupplierInvoicesTab 
          supplierId={supplier.id} 
          supplierName={supplier.name || supplier.company || 'Tedarikçi'}
        />
      </CustomTabsContent>

      <CustomTabsContent value="contracts">
        <EmptyState
          icon={<FileStack className="w-8 h-8 text-gray-400" />}
          title="Sözleşmeler"
          description="Bu tedarikçi ile imzalanan sözleşmeler burada görüntülenecek."
        />
      </CustomTabsContent>

      {supplier.portal_enabled && (
        <CustomTabsContent value="portal">
          <SupplierPortalActivityLog supplierId={supplier.id} />
        </CustomTabsContent>
      )}
    </CustomTabs>
  );
};
