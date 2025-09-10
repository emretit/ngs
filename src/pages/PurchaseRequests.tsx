import React from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "@/components/shared";
import { ArrowLeft } from "lucide-react";
import { EnhancedCard } from "@/components/shared";
import { RequestsTable } from "@/components/purchase/requests/RequestsTable";

interface PurchaseRequestsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PurchaseRequests = ({ isCollapsed, setIsCollapsed }: PurchaseRequestsProps) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate("/purchase");
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Satın Alma Talepleri"
      subtitle="Satın alma taleplerini görüntüleyin ve yönetin"
    >
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Satın Alma'ya Dön
        </Button>
      </div>

      <EnhancedCard className="p-4">
        <RequestsTable />
      </EnhancedCard>
    </DefaultLayout>
  );
};

export default PurchaseRequests;