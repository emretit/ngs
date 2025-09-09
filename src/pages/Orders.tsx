
import React, { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderForm from "@/components/orders/OrderForm";
import InvoiceView from "@/components/orders/InvoiceView";

interface OrdersProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Orders = ({ isCollapsed, setIsCollapsed }: OrdersProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("order");
  
  // Extract proposal ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const proposalId = queryParams.get("proposalId");
  
  const handleBack = () => {
    if (proposalId) {
      navigate(`/proposal/${proposalId}`);
    } else {
      navigate("/proposals");
    }
  };

  const pageTitle = proposalId ? "Tekliften Sipariş Oluştur" : "Satın Alma";
  const pageSubtitle = proposalId 
    ? "Onaylanan tekliften yeni sipariş oluşturuyorsunuz" 
    : "Satın alma süreçlerini yönetin ve takip edin";

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      </div>

      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="order">Sipariş Bilgileri</TabsTrigger>
            <TabsTrigger value="invoice">E-Fatura Görünümü</TabsTrigger>
          </TabsList>
          
          <TabsContent value="order">
            <OrderForm proposalId={proposalId} />
          </TabsContent>
          
          <TabsContent value="invoice">
            <InvoiceView />
          </TabsContent>
        </Tabs>
      </Card>
    </DefaultLayout>
  );
};

export default Orders;
