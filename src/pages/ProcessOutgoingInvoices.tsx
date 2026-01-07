import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useOutgoingInvoices, OutgoingInvoice } from "@/hooks/useOutgoingInvoices";
import { outgoingInvoiceSyncService } from "@/services/outgoingInvoiceSyncService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

const ProcessOutgoingInvoices = () => {
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Tarih filtreleri - son 30 gün
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: invoices = [], isLoading, refetch } = useOutgoingInvoices(
    {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    },
    true
  );

  // Sales invoices'da olmayan faturaları filtrele
  const { data: invoicesNotInSales = [], isLoading: checkingSales } = useQuery({
    queryKey: ["outgoing-invoices-not-in-sales", invoices.map((inv) => inv.id)],
    queryFn: async () => {
      if (invoices.length === 0) return [];

      const invoiceIds = invoices.map((inv) => inv.id);
      const { data: existingSales } = await supabase
        .from("sales_invoices")
        .select("nilvera_invoice_id")
        .in("nilvera_invoice_id", invoiceIds);

      const existingIds = new Set(existingSales?.map((s) => s.nilvera_invoice_id) || []);
      return invoices.filter((inv) => !existingIds.has(inv.id));
    },
    enabled: invoices.length > 0,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const invoicesToSync = invoices.filter((inv) => invoiceIds.includes(inv.id));
      return await outgoingInvoiceSyncService.syncToSalesInvoices(invoicesToSync);
    },
    onSuccess: (result) => {
      toast.success(
        `${result.created} fatura oluşturuldu, ${result.updated} fatura güncellendi`
      );
      setSelectedInvoices(new Set());
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing-invoices"] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Senkronizasyon hatası: ${error.message}`);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoicesNotInSales.map((inv) => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSync = () => {
    if (selectedInvoices.size === 0) {
      toast.error("Lütfen en az bir fatura seçin");
      return;
    }

    syncMutation.mutate(Array.from(selectedInvoices));
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    const currencyCode = currency === "TL" ? "TRY" : currency || "TRY";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      sent: { label: "Gönderildi", variant: "default" },
      delivered: { label: "Teslim Edildi", variant: "default" },
      approved: { label: "Onaylandı", variant: "default" },
      rejected: { label: "Reddedildi", variant: "destructive" },
      cancelled: { label: "İptal", variant: "secondary" },
      pending: { label: "Bekliyor", variant: "outline" },
    };

    const statusInfo = statusMap[status?.toLowerCase()] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading || checkingSales) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Giden E-Faturaları İşle</h1>
          <p className="text-muted-foreground mt-1">
            Giden e-faturaları satış faturalarına dönüştür
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İşlenecek Faturalar</CardTitle>
              <CardDescription>
                {invoicesNotInSales.length} fatura satış faturalarına eklenmeyi bekliyor
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  invoicesNotInSales.length > 0 &&
                  invoicesNotInSales.every((inv) => selectedInvoices.has(inv.id))
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Tümünü Seç</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesNotInSales.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Tüm faturalar işlenmiş</p>
              <p className="text-sm text-muted-foreground mt-2">
                Yeni faturalar geldiğinde burada görünecek
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            invoicesNotInSales.length > 0 &&
                            invoicesNotInSales.every((inv) => selectedInvoices.has(inv.id))
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Kalem Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesNotInSales.map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        isSelected={selectedInvoices.has(invoice.id)}
                        onSelect={(checked) => handleSelectInvoice(invoice.id, checked)}
                        formatCurrency={formatCurrency}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedInvoices.size} fatura seçildi
                </div>
                <Button
                  onClick={handleSync}
                  disabled={selectedInvoices.size === 0 || syncMutation.isPending}
                  size="lg"
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Satış Faturalarına Ekle ({selectedInvoices.size})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface InvoiceRowProps {
  invoice: OutgoingInvoice;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  formatCurrency: (amount: number, currency: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({
  invoice,
  isSelected,
  onSelect,
  formatCurrency,
  getStatusBadge,
}) => {
  const [itemCount, setItemCount] = useState<number | null>(null);

  // Item count'u fetch et
  React.useEffect(() => {
    supabase
      .from("outgoing_invoice_items")
      .select("id", { count: "exact", head: true })
      .eq("outgoing_invoice_id", invoice.id)
      .then(({ count }) => {
        setItemCount(count || 0);
      });
  }, [invoice.id]);

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
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
        {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: tr })}
      </TableCell>
      <TableCell>
        <div className="text-right">
          <div className="font-medium">{formatCurrency(invoice.totalAmount, invoice.currency)}</div>
          {invoice.taxAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              KDV: {formatCurrency(invoice.taxAmount, invoice.currency)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
      <TableCell>
        {itemCount !== null ? (
          <Badge variant="outline">{itemCount} kalem</Badge>
        ) : (
          <Skeleton className="h-5 w-16" />
        )}
      </TableCell>
    </TableRow>
  );
};

export default ProcessOutgoingInvoices;

