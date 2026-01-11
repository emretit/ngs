
import React, { useEffect, useState } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Proposal, ProposalItem } from "@/types/proposal";
import { mockCrmService } from "@/services/mockCrm";
import { useOrders } from "@/hooks/useOrders";
import { CreateOrderData } from "@/types/orders";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Save, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import OrderCustomerInfo from "./OrderCustomerInfo";
import OrderItemsTable from "./OrderItemsTable";
import OrderSummary from "./OrderSummary";
import OrderPaymentInfo from "./OrderPaymentInfo";

interface OrderFormProps {
  proposalId: string | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ proposalId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createOrderMutation } = useOrders();
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [orderItems, setOrderItems] = useState<ProposalItem[]>([]);
  
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!proposalId) return;
      
      try {
        setLoading(true);
        const { data, error } = await mockCrmService.getProposalById(proposalId);
        
        if (error) {
          toast({
            title: "Hata",
            description: "Teklif bilgileri yüklenemedi",
            variant: "destructive",
          });
          throw error;
        }
        
        if (data) {
          // Make sure that items are properly parsed
          let parsedData = data;
          if (typeof data.items === 'string') {
            try {
              parsedData = {
                ...data,
                items: JSON.parse(data.items)
              };
            } catch (e) {
              logger.error("Failed to parse items:", e);
            }
          }
          
          setProposal(parsedData);
          
          // Initialize order items from proposal items
          if (parsedData.items && Array.isArray(parsedData.items)) {
            setOrderItems(parsedData.items);
          }
        }
      } catch (error) {
        logger.error("Error fetching proposal:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposalData();
  }, [proposalId, toast]);

  const handleCreateOrder = async () => {
    if (!proposal) {
      toast({
        title: "Hata",
        description: "Teklif bilgileri bulunamadı",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create order data from proposal
      const orderData: CreateOrderData = {
        proposal_id: proposal.id,
        customer_id: proposal.customer_id,
        employee_id: proposal.employee_id,
        title: proposal.title || `Sipariş - ${proposal.number}`,
        description: proposal.description,
        notes: proposal.notes,
        status: 'pending',
        currency: proposal.currency || 'TRY',
        payment_terms: proposal.payment_terms,
        delivery_terms: proposal.delivery_terms,
        warranty_terms: proposal.warranty_terms,
        price_terms: proposal.price_terms,
        other_terms: proposal.other_terms,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || 'adet',
          unit_price: Number(item.unit_price),
          tax_rate: Number(item.tax_rate || 18),
          discount_rate: Number(item.discount_rate || 0),
          item_group: item.group || 'product',
          stock_status: 'in_stock',
          sort_order: 0
        }))
      };

      await createOrderMutation.mutateAsync(orderData);
      
      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu",
      });
      
      // Navigate to orders list
      navigate('/orders/list');
      
    } catch (error) {
      logger.error("Error creating order:", error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!proposal) {
      toast({
        title: "Hata",
        description: "Teklif bilgileri bulunamadı",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create order data as draft
      const orderData: CreateOrderData = {
        proposal_id: proposal.id,
        customer_id: proposal.customer_id,
        employee_id: proposal.employee_id,
        title: proposal.title || `Sipariş - ${proposal.number}`,
        description: proposal.description,
        notes: proposal.notes,
        status: 'pending',
        currency: proposal.currency || 'TRY',
        payment_terms: proposal.payment_terms,
        delivery_terms: proposal.delivery_terms,
        warranty_terms: proposal.warranty_terms,
        price_terms: proposal.price_terms,
        other_terms: proposal.other_terms,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || 'adet',
          unit_price: Number(item.unit_price),
          tax_rate: Number(item.tax_rate || 18),
          discount_rate: Number(item.discount_rate || 0),
          item_group: item.group || 'product',
          stock_status: 'in_stock',
          sort_order: 0
        }))
      };

      await createOrderMutation.mutateAsync(orderData);
      
      toast({
        title: "Kaydedildi",
        description: "Sipariş taslak olarak kaydedildi",
      });
      
      // Navigate to orders list
      navigate('/orders/list');
      
    } catch (error) {
      logger.error("Error saving draft order:", error);
      toast({
        title: "Hata",
        description: "Sipariş taslağı kaydedilirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {proposalId ? t("forms.createFromProposal") : t("forms.createNewOrder")}
        </h2>
        
        {!proposalId && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4">
            {t("forms.note")}
          </div>
        )}
      </div>
      
      <OrderCustomerInfo customer={proposal?.customer} />
      
      <Separator className="my-6" />
      
      <OrderItemsTable items={orderItems} setItems={setOrderItems} currency={proposal?.currency || "TRY"} />
      
      <Separator className="my-6" />
      
      <OrderPaymentInfo proposal={proposal} />
      
      <OrderSummary items={orderItems} currency={proposal?.currency || "TRY"} />
      
      <div className="flex justify-end space-x-3 mt-8">
        <Button 
          variant="outline" 
          onClick={handleSaveDraft}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? t("common.saving") : t("forms.saveAsDraft")}
        </Button>
        <Button 
          onClick={handleCreateOrder}
          disabled={loading}
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? t("common.creating") : t("forms.createOrder")}
        </Button>
      </div>
    </div>
  );
};

export default OrderForm;
