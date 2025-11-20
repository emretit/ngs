import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Download, 
  Mail, 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  Calculator,
  Check,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { proposalStatusLabels, proposalStatusColors, ProposalStatus } from "@/types/proposal";
import { ProposalItem } from "@/types/proposal";

interface ProposalPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  items: ProposalItem[];
  calculationsByCurrency: any;
  onExportPDF?: () => void;
  onSendEmail?: () => void;
}

const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  open,
  onOpenChange,
  formData,
  items,
  calculationsByCurrency,
  onExportPDF,
  onSendEmail
}) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStatusColor = (status: ProposalStatus) => {
    return proposalStatusColors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: ProposalStatus) => {
    return proposalStatusLabels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Teklif Önizleme
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onExportPDF && (
                <Button
                  onClick={onExportPDF}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  PDF İndir
                </Button>
              )}
              {onSendEmail && (
                <Button
                  onClick={onSendEmail}
                  size="sm"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  E-posta Gönder
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {formData.subject || "Teklif Konusu"}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Teklif No: {formData.offer_number}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(formData.offer_date)}
              </span>
              <Badge 
                className={`${getStatusColor(formData.status)} text-white`}
              >
                {getStatusLabel(formData.status)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">İletişim Kişisi:</span>
                  <p className="text-sm">{formData.contact_name || "-"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Teklifi Hazırlayan:</span>
                  <p className="text-sm">{formData.prepared_by || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  Teklif Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Teklif Tarihi:</span>
                  <p className="text-sm">{formatDate(formData.offer_date)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Geçerlilik Tarihi:</span>
                  <p className="text-sm">{formatDate(formData.validity_date)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Para Birimi:</span>
                  <p className="text-sm">{formData.currency || "TRY"}</p>
                </div>
                {formData.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Notlar:</span>
                    <p className="text-sm text-gray-700">{formData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Products/Services Table */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  Ürün/Hizmet Listesi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">#</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Ürün/Hizmet</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Miktar</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Birim</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Birim Fiyat</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">KDV %</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">İndirim</th>
                        <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-3 text-sm">{item.row_number}</td>
                          <td className="py-2 px-3 text-sm">
                            <div>
                              <div className="font-medium">{item.name || (item as any).product_name || "-"}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm text-center">{item.unit || "adet"}</td>
                          <td className="py-2 px-3 text-sm text-right">
                            {formatCurrency(item.unit_price, item.currency || formData.currency)}
                          </td>
                          <td className="py-2 px-3 text-sm text-center">
                            {item.tax_rate ? `%${item.tax_rate}` : "-"}
                          </td>
                          <td className="py-2 px-3 text-sm text-center">
                            {item.discount_rate && item.discount_rate > 0 ? `%${item.discount_rate}` : "-"}
                          </td>
                          <td className="py-2 px-3 text-sm text-right font-medium">
                            {formatCurrency(item.total_price, item.currency || formData.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-green-600" />
                Finansal Özet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(calculationsByCurrency).map(([currency, totals]: [string, any]) => (
                  <div key={currency} className="space-y-3">
                    {Object.keys(calculationsByCurrency).length > 1 && (
                      <div className="text-sm font-medium text-primary">
                        {currency} Toplamları
                      </div>
                    )}
                    <div className="space-y-2 text-right">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Brüt Toplam:</span>
                        <span className="font-medium">{formatCurrency(totals.gross, currency)}</span>
                      </div>
                      
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>İndirim:</span>
                          <span>-{formatCurrency(totals.discount, currency)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Net Toplam:</span>
                        <span className="font-medium">{formatCurrency(totals.net, currency)}</span>
                      </div>
                      
                      {totals.vat > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">KDV:</span>
                          <span className="font-medium">{formatCurrency(totals.vat, currency)}</span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>GENEL TOPLAM:</span>
                        <span className="text-green-600">{formatCurrency(totals.grand, currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-600" />
                Şartlar ve Koşullar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.payment_terms && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ödeme Şartları:</span>
                    <p className="text-sm text-gray-700 mt-1">{formData.payment_terms}</p>
                  </div>
                )}
                {formData.delivery_terms && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Teslimat:</span>
                    <p className="text-sm text-gray-700 mt-1">{formData.delivery_terms}</p>
                  </div>
                )}
                {formData.warranty_terms && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Garanti Şartları:</span>
                    <p className="text-sm text-gray-700 mt-1">{formData.warranty_terms}</p>
                  </div>
                )}
                {formData.price_terms && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fiyat:</span>
                    <p className="text-sm text-gray-700 mt-1">{formData.price_terms}</p>
                  </div>
                )}
              </div>
              {formData.other_terms && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Diğer Şartlar:</span>
                  <p className="text-sm text-gray-700 mt-1">{formData.other_terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalPreviewModal;
