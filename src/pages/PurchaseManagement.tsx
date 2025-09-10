
import React, { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { ArrowLeft, FileText, FileDown, Plus } from "lucide-react";
import { EnhancedCard } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PurchaseOrdersTab from "@/components/purchase/orders/PurchaseOrdersTab";
import InvoiceManagementTab from "@/components/purchase/invoices/InvoiceManagementTab";

interface PurchaseManagementProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PurchaseManagement = ({ isCollapsed, setIsCollapsed }: PurchaseManagementProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("purchase-orders");
  
  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Satın Alma Yönetimi"
      subtitle="Siparişleri ve faturaları yönetin"
    >
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Panele Dön
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/orders/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Yeni Sipariş
          </Button>
          
          <Button 
            onClick={() => navigate("/purchase/requests/new")}
            className="flex items-center gap-2 bg-primary text-white"
          >
            <FileText className="h-4 w-4" />
            Yeni Satın Alma Talebi
          </Button>
        </div>
      </div>

      <EnhancedCard className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="purchase-orders" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Satın Alma Siparişleri
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center">
              <FileDown className="h-4 w-4 mr-2" />
              E-Fatura Yönetimi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchase-orders">
            <PurchaseOrdersTab />
          </TabsContent>
          
          <TabsContent value="invoices">
            <InvoiceManagementTab />
          </TabsContent>
        </Tabs>
      </EnhancedCard>
    </DefaultLayout>
  );
};

export default PurchaseManagement;
