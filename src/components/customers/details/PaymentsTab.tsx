
import { useState, useCallback } from "react";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentsList } from "./PaymentsList";
import { Customer } from "@/types/customer";

interface PaymentsTabProps {
  customer: Customer;
}

export const PaymentsTab = ({ customer }: PaymentsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"hesap" | "cek" | "senet" | null>(null);

  const handleMethodSelect = useCallback((method: { type: "hesap" | "cek" | "senet" }) => {
    setSelectedPaymentType(method.type);
    setIsDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Payments List */}
      <PaymentsList customer={customer} onAddPayment={handleMethodSelect} />
      
      <PaymentDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPaymentType(null);
        }}
        customer={customer}
        defaultPaymentType={selectedPaymentType}
      />
    </div>
  );
};
