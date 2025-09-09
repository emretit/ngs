
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProposalItem } from "@/types/proposal";
import { calculateProposalTotals, formatProposalAmount } from "@/services/workflow/proposalWorkflow";

interface OrderSummaryProps {
  items: ProposalItem[];
  currency: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, currency }) => {
  const totals = items.length > 0 
    ? calculateProposalTotals(items)
    : { subtotal: 0, taxAmount: 0, total: 0 };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Sipariş Özeti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam:</span>
            <span>{formatProposalAmount(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KDV Tutarı:</span>
            <span>{formatProposalAmount(totals.taxAmount, currency)}</span>
          </div>
          <div className="h-px bg-border my-2"></div>
          <div className="flex justify-between font-medium">
            <span>Genel Toplam:</span>
            <span className="text-lg">{formatProposalAmount(totals.total, currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
