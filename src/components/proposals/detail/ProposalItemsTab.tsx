
import { Proposal } from "@/types/proposal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface ProposalItemsTabProps {
  proposal: Proposal;
}

export const ProposalItemsTab = ({ proposal }: ProposalItemsTabProps) => {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: proposal.currency || 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!proposal.items || proposal.items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Bu teklife ait ürün bulunmamaktadır.
      </div>
    );
  }

  const calculateSubtotal = () => {
    return proposal.items?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) || 0;
  };

  const calculateTaxAmount = () => {
    return proposal.items?.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      return sum + (itemTotal * (item.tax_rate || 0) / 100);
    }, 0) || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    const discounts = proposal.discounts || 0;
    const additionalCharges = proposal.additional_charges || 0;
    
    return subtotal + taxAmount - discounts + additionalCharges;
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-red-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-red-50">
              <TableRow>
                <TableHead className="font-semibold text-red-900">Ürün / Hizmet</TableHead>
                <TableHead className="font-semibold text-red-900 text-right">Miktar</TableHead>
                <TableHead className="font-semibold text-red-900 text-right">Birim Fiyat</TableHead>
                <TableHead className="font-semibold text-red-900 text-right">Vergi (%)</TableHead>
                <TableHead className="font-semibold text-red-900 text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.items?.map((item, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.unit_price)}</TableCell>
                  <TableCell className="text-right">%{item.tax_rate || 0}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="space-y-2 ml-auto w-full max-w-xs">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ara Toplam:</span>
          <span className="font-medium">{formatMoney(calculateSubtotal())}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Toplam Vergi:</span>
          <span className="font-medium">{formatMoney(calculateTaxAmount())}</span>
        </div>
        {(proposal.discounts && proposal.discounts > 0) ? (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">İndirim:</span>
            <span className="font-medium text-red-600">-{formatMoney(proposal.discounts)}</span>
          </div>
        ) : null}
        {(proposal.additional_charges && proposal.additional_charges > 0) ? (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ek Masraflar:</span>
            <span className="font-medium">{formatMoney(proposal.additional_charges)}</span>
          </div>
        ) : null}
        <div className="flex justify-between items-center pt-2 border-t font-semibold">
          <span className="text-red-900">Genel Toplam:</span>
          <span className="text-red-900">{formatMoney(calculateTotal())}</span>
        </div>
      </div>
    </div>
  );
};
