import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Download, FileText, Calendar, User, Building2 } from "lucide-react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseInvoiceDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PurchaseInvoiceDetail = ({ isCollapsed, setIsCollapsed }: PurchaseInvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById } = usePurchaseInvoices();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await fetchInvoiceById(id!);

      // Supplier bilgisini al
      if (invoiceData.supplier_id) {
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("id, name, company, tax_number")
          .eq("id", invoiceData.supplier_id)
          .single();

        setInvoice({ ...invoiceData, supplier });
      } else {
        setInvoice(invoiceData);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Beklemede</Badge>;
      case 'paid':
        return <Badge variant="outline" className="border-green-500 text-green-700">Ödendi</Badge>;
      case 'partially_paid':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Kısmi Ödendi</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="border-red-500 text-red-700">Gecikmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DefaultLayout
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        title="Fatura Detayı"
        subtitle="Fatura bilgileri yükleniyor..."
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DefaultLayout>
    );
  }

  if (!invoice) {
    return (
      <DefaultLayout
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        title="Fatura Bulunamadı"
        subtitle="Aradığınız fatura bulunamadı"
      >
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Fatura bulunamadı</p>
          <Button
            variant="outline"
            onClick={() => navigate('/purchase-invoices')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Faturalara Dön
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Alış Faturası Detayı"
      subtitle={`Fatura No: ${invoice.invoice_number || 'Henüz atanmadı'}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/purchase-invoices')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`/purchase-invoices/edit/${id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Yazdırma ile PDF oluşturma
                window.print();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          </div>
        </div>

        {/* Invoice Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fatura Bilgileri
              </CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Kolon - Fatura Bilgileri */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fatura No</label>
                  <p className="text-lg font-semibold">
                    {invoice.invoice_number || 'Henüz atanmadı'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Fatura Tarihi</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), "dd MMMM yyyy", { locale: tr }) : 'Belirtilmemiş'}
                  </p>
                </div>

                {invoice.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vade Tarihi</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(invoice.due_date), "dd MMMM yyyy", { locale: tr })}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Para Birimi</label>
                  <p>{invoice.currency || 'TRY'}</p>
                </div>
              </div>

              {/* Sağ Kolon - Tedarikçi Bilgileri */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tedarikçi</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">{invoice.supplier?.name || 'Bilinmiyor'}</p>
                      {invoice.supplier?.company && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.supplier.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {invoice.supplier?.tax_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vergi No</label>
                    <p>{invoice.supplier.tax_number}</p>
                  </div>
                )}

                {invoice.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Açıklama</label>
                    <p>{invoice.description}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Tutar Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Toplam Tutar</label>
                <p className="text-lg font-semibold">{formatCurrency(invoice.total_amount || 0)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Ödenen Tutar</label>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(invoice.paid_amount || 0)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Kalan Tutar</label>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency((invoice.total_amount || 0) - (invoice.paid_amount || 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Durum</label>
                <div className="mt-1">
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Notlar</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fatura Kalemleri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fatura Kalemleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fatura kalemleri henüz mevcut değil</p>
              <p className="text-sm mt-1">Fatura kalemi bilgileri buraya eklenecektir</p>
            </div>
          </CardContent>
        </Card>

        {/* Ödeme Geçmişi */}
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ödeme geçmişi henüz mevcut değil</p>
              <p className="text-sm mt-1">Ödeme kayıtları buraya eklenecektir</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default PurchaseInvoiceDetail;