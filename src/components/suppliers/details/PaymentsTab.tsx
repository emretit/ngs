import { useState, useCallback } from "react";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentsList } from "./PaymentsList";
import { Supplier } from "@/types/supplier";

interface PaymentsTabProps {
  supplier: Supplier;
}

export const PaymentsTab = ({ supplier }: PaymentsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"hesap" | "cek" | "senet" | null>(null);

  const handleMethodSelect = useCallback((method: { type: "hesap" | "cek" | "senet" }) => {
    setSelectedPaymentType(method.type);
    setIsDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Payments List */}
      <PaymentsList supplier={supplier} onAddPayment={handleMethodSelect} />
      
      <PaymentDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPaymentType(null);
        }}
        supplier={supplier}
        defaultPaymentType={selectedPaymentType}
      />
    </div>
  );
};