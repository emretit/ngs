import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Target, FileText } from "lucide-react";

interface ProposalContextPopulatorProps {
  customerId?: string | null;
  opportunityId?: string | null;
  templateId?: string | null;
  onContextLoaded: (context: any) => void;
}

const ProposalContextPopulator: React.FC<ProposalContextPopulatorProps> = ({
  customerId,
  opportunityId,
  templateId,
  onContextLoaded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState({
    customer: false,
    opportunity: false,
    template: false
  });

  // Fetch customer data
  const { data: customer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId
  });

  // Fetch opportunity data
  const { data: opportunity } = useQuery({
    queryKey: ["opportunity", opportunityId],
    queryFn: async () => {
      if (!opportunityId) return null;
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, customer:customer_id(*)")
        .eq("id", opportunityId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!opportunityId
  });

  // Fetch template data (disabled for now as table doesn't exist)
  const { data: template } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      return null; // Disabled until proposal_templates table is created
    },
    enabled: false // Disabled until table exists
  });

  // Auto-populate form when data is loaded
  useEffect(() => {
    setIsLoading(true);
    const context: any = {};
    let hasUpdates = false;

    // Populate customer data
    if (customer && !loadedData.customer) {
      context.customer_id = customer.id;
      context.billing_address = {
        company: customer.company || customer.name,
        contact_person: customer.name,
        address: customer.address || "",
        city: "",
        postal_code: "",
        country: "Türkiye",
        tax_number: customer.tax_number || "",
        tax_office: customer.tax_office || ""
      };
      
      // Auto-generate title based on customer
      context.title = `${customer.company || customer.name} - Teklif`;
      
      setLoadedData(prev => ({ ...prev, customer: true }));
      hasUpdates = true;
      
      toast.success(`Müşteri bilgileri yüklendi: ${customer.name}`, {
        duration: 3000,
      });
    }

    // Populate opportunity data
    if (opportunity && !loadedData.opportunity) {
      context.opportunity_id = opportunity.id;
      context.title = opportunity.title || context.title;
      context.description = opportunity.description || "";
      
      // If opportunity has customer and we didn't load customer separately
      if (opportunity.customer && !customer) {
        context.customer_id = opportunity.customer.id;
        context.billing_address = {
          company: opportunity.customer.company || opportunity.customer.name,
          contact_person: opportunity.customer.name,
          address: opportunity.customer.address || "",
          city: "",
          postal_code: "",
          country: "Türkiye",
          tax_number: opportunity.customer.tax_number || "",
          tax_office: opportunity.customer.tax_office || ""
        };
      }
      
      // Set default validity based on opportunity expected close date
      if (opportunity.expected_close_date) {
        const validUntil = new Date(opportunity.expected_close_date);
        validUntil.setDate(validUntil.getDate() + 30); // 30 days validity
        context.valid_until = validUntil.toISOString().split('T')[0];
      }
      
      setLoadedData(prev => ({ ...prev, opportunity: true }));
      hasUpdates = true;
      
      toast.success(`Fırsat bilgileri yüklendi: ${opportunity.title}`, {
        duration: 3000,
      });
    }

    // Populate template data (disabled until table exists)
    // Template functionality will be implemented when proposal_templates table is created

    // Set default values if no context provided
    if (!customerId && !opportunityId && !templateId && !loadedData.customer && !loadedData.opportunity) {
      const defaultValidUntil = new Date();
      defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
      
      context.valid_until = defaultValidUntil.toISOString().split('T')[0];
      context.title = "Yeni Teklif";
      context.currency = "TRY";
      
      hasUpdates = true;
      setLoadedData({ customer: true, opportunity: true, template: true });
    }

    if (hasUpdates) {
      onContextLoaded(context);
    }
    
    setIsLoading(false);
  }, [customer, opportunity, template, customerId, opportunityId, templateId]);

  // Don't render anything if no context to load
  if (!customerId && !opportunityId && !templateId) {
    return null;
  }

  return (
    <div className="px-6 py-4 bg-muted/50 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Bağlam Yükleniyor</span>
        </div>
        
        <div className="flex items-center gap-2">
          {customerId && (
            <Badge 
              variant={loadedData.customer ? "default" : "secondary"} 
              className="gap-1"
            >
              <Users className="h-3 w-3" />
              {loadedData.customer ? "Müşteri Yüklendi" : "Müşteri Yükleniyor..."}
              {!loadedData.customer && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </Badge>
          )}
          
          {opportunityId && (
            <Badge 
              variant={loadedData.opportunity ? "default" : "secondary"} 
              className="gap-1"
            >
              <Target className="h-3 w-3" />
              {loadedData.opportunity ? "Fırsat Yüklendi" : "Fırsat Yükleniyor..."}
              {!loadedData.opportunity && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </Badge>
          )}
          
          {templateId && (
            <Badge 
              variant={loadedData.template ? "default" : "secondary"} 
              className="gap-1"
            >
              <FileText className="h-3 w-3" />
              {loadedData.template ? "Şablon Yüklendi" : "Şablon Yükleniyor..."}
              {!loadedData.template && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalContextPopulator; 