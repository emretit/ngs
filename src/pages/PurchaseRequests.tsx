import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RequestsTable } from "@/components/purchase/requests/RequestsTable";
interface PurchaseRequestsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const PurchaseRequests = ({ isCollapsed, setIsCollapsed }: PurchaseRequestsProps) => {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/purchase");
  };
  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Satın Alma'ya Dön
        </Button>
      </div>
      <Card className="p-4">
        <RequestsTable />
      </Card>
    </>
  );
};
export default PurchaseRequests;