
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Receipt, FileDown } from "lucide-react";
import { InvoiceStatusBadge } from "../StatusBadge";
import { formatMoney } from "../constants";
import { format } from "date-fns";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PurchaseInvoicesListProps {
  poId: string;
}

const PurchaseInvoicesList: React.FC<PurchaseInvoicesListProps> = ({ poId }) => {
  const { invoices, isLoading, filters, setFilters, recordPaymentMutation } = usePurchaseInvoices();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  
  // Filter invoices for this PO
  const filteredInvoices = invoices?.filter(invoice => invoice.po_id === poId) || [];
  
  const handleViewInvoice = (invoice: any) => {
    // Implement invoice viewing (could open a modal with details)
    console.log("View invoice", invoice);
  };

  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount((invoice.total_amount - invoice.paid_amount).toString());
    setPaymentDialogOpen(true);
  };

  const submitPayment = () => {
    if (selectedInvoice && paymentAmount) {
      recordPaymentMutation.mutate({
        id: selectedInvoice.id,
        amount: parseFloat(paymentAmount)
      });
      setPaymentDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex justify-between items-center">
            <span>İlişkili Faturalar</span>
            {filteredInvoices.length > 0 && (
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Tümünü İndir
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Fatura Tarihi</TableHead>
                <TableHead>Son Ödeme Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Ödenen</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4 text-muted-foreground">
                    Bu siparişe ait fatura bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "dd.MM.yyyy")}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), "dd.MM.yyyy")}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(invoice.total_amount, invoice.currency)}</TableCell>
                    <TableCell className="text-right">{formatMoney(invoice.paid_amount, invoice.currency)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRecordPayment(invoice)}
                              disabled={invoice.status === "paid"}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Ödeme Kaydet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Kaydet</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <span>
                  Fatura: {selectedInvoice.invoice_number} - Kalan: {
                    formatMoney(
                      selectedInvoice.total_amount - selectedInvoice.paid_amount,
                      selectedInvoice.currency
                    )
                  }
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Ödeme Tutarı</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Ödeme Yöntemi</Label>
              <Select defaultValue="bank_transfer">
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Ödeme yöntemi seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Banka Transferi</SelectItem>
                  <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                  <SelectItem value="cash">Nakit</SelectItem>
                  <SelectItem value="check">Çek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={submitPayment}>
              Ödemeyi Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchaseInvoicesList;
