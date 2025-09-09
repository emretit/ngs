import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Building, MapPin, Package, Calculator } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ProposalPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
}

const ProposalPreviewDialog: React.FC<ProposalPreviewDialogProps> = ({
  open,
  onOpenChange,
  formData
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: formData.currency || 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Teklif Önizlemesi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{formData.title}</CardTitle>
                <Badge variant="outline">
                  {formData.status === 'draft' ? 'Taslak' : 'Gönderildi'}
                </Badge>
              </div>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Firma:</strong> {formData.billing_address?.company}</p>
                  <p><strong>İletişim:</strong> {formData.billing_address?.contact_person}</p>
                  <p><strong>E-posta:</strong> {formData.customer_email || "Belirtilmemiş"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Proposal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Teklif Detayları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Geçerlilik:</strong> {formatDate(formData.valid_until)}</p>
                  <p><strong>Para Birimi:</strong> {formData.currency}</p>
                  <p><strong>Durum:</strong> {formData.status === 'draft' ? 'Taslak' : 'Gönderildi'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Fatura Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{formData.billing_address?.company}</p>
                  <p>{formData.billing_address?.contact_person}</p>
                  <p>{formData.billing_address?.address}</p>
                  <p>{formData.billing_address?.city} {formData.billing_address?.postal_code}</p>
                  <p>{formData.billing_address?.country}</p>
                  {formData.billing_address?.tax_number && (
                    <p>VN: {formData.billing_address.tax_number}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Teslimat Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.shipping_address?.same_as_billing ? (
                  <p className="text-muted-foreground italic">Fatura adresi ile aynı</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p>{formData.shipping_address?.company}</p>
                    <p>{formData.shipping_address?.contact_person}</p>
                    <p>{formData.shipping_address?.address}</p>
                    <p>{formData.shipping_address?.city} {formData.shipping_address?.postal_code}</p>
                    <p>{formData.shipping_address?.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Teklif Kalemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items && formData.items.length > 0 ? (
                <div className="space-y-4">
                  {formData.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-sm">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                          {item.discount_rate > 0 && (
                            <span className="text-red-600 ml-2">
                              -%{item.discount_rate}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                        {item.tax_rate && (
                          <p className="text-xs text-muted-foreground">
                            +%{item.tax_rate} KDV
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Henüz kalem eklenmemiş</p>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Toplam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span>{formatCurrency(formData.subtotal || 0)}</span>
                </div>
                {formData.total_discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Toplam İndirim:</span>
                    <span>-{formatCurrency(formData.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>KDV Toplamı:</span>
                  <span>{formatCurrency(formData.total_tax || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Genel Toplam:</span>
                  <span>{formatCurrency(formData.total_amount || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          {(formData.payment_terms || formData.delivery_terms || formData.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Şartlar ve Notlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.payment_terms && (
                  <div>
                    <h4 className="font-medium mb-2">Ödeme Şartları:</h4>
                    <p className="text-sm whitespace-pre-wrap">{formData.payment_terms}</p>
                  </div>
                )}
                {formData.delivery_terms && (
                  <div>
                    <h4 className="font-medium mb-2">Teslimat Şartları:</h4>
                    <p className="text-sm whitespace-pre-wrap">{formData.delivery_terms}</p>
                  </div>
                )}
                {formData.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notlar:</h4>
                    <p className="text-sm whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalPreviewDialog; 