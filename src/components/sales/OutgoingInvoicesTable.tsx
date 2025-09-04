import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, RefreshCw } from "lucide-react";

interface OutgoingInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerTaxNumber?: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  status: string;
  answerCode: string;
  isRead: boolean;
}

interface OutgoingInvoicesTableProps {
  invoices: OutgoingInvoice[];
  isLoading: boolean;
  onRefresh: () => void;
}

const OutgoingInvoicesTable: React.FC<OutgoingInvoicesTableProps> = ({
  invoices,
  isLoading,
  onRefresh,
}) => {
  const getStatusBadge = (invoice: OutgoingInvoice) => {
    const { status, answerCode, isRead } = invoice;
    
    if (answerCode === 'approved') {
      return <Badge variant="default" className="bg-green-500">Onaylandı</Badge>;
    } else if (answerCode === 'rejected') {
      return <Badge variant="destructive">Reddedildi</Badge>;
    } else if (answerCode === 'pending') {
      return <Badge variant="secondary">Bekliyor</Badge>;
    } else if (!isRead) {
      return <Badge variant="outline">Okunmadı</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Giden E-Faturalar</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">E-faturalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Giden E-Faturalar</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Henüz giden e-fatura bulunamadı</p>
          <p className="text-xs text-muted-foreground mt-1">
            Nilvera sisteminde gönderdiğiniz e-faturalar burada görünecektir
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Giden E-Faturalar ({invoices.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.customerName}</div>
                    {invoice.customerTaxNumber && (
                      <div className="text-xs text-muted-foreground">
                        VKN: {invoice.customerTaxNumber}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.invoiceDate), "dd MMM yyyy", {
                    locale: tr,
                  })}
                </TableCell>
                <TableCell>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </div>
                    {invoice.taxAmount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        KDV: {formatCurrency(invoice.taxAmount, invoice.currency)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(invoice)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Invoice details:', invoice);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OutgoingInvoicesTable;