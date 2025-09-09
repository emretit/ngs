import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProposalTemplate } from "@/types/proposal-template";
import { 
  FileText, 
  Building2, 
  Package, 
  Calculator, 
  FileCheck, 
  Star,
  Clock,
  Users,
  CheckCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplatePreviewModalProps {
  template: ProposalTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProposalTemplate) => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!template) return null;

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "standard":
        return <FileText className="h-8 w-8 text-primary" />;
      case "product":
        return <Package className="h-8 w-8 text-blue-500" />;
      case "service":
        return <FileText className="h-8 w-8 text-green-500" />;
      case "enterprise":
        return <Building2 className="h-8 w-8 text-orange-500" />;
      case "quick":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const getCategoryLabel = (type: string): string => {
    switch (type) {
      case "standard": return "Standart";
      case "product": return "Ürün Teklifi";
      case "service": return "Hizmet Teklifi";
      case "enterprise": return "Kurumsal Çözüm";
      case "quick": return "Hızlı Teklif";
      default: return "Genel";
    }
  };

  // Mock preview data for demonstration
  const mockPreviewData = {
    proposalNumber: "STD20250101001",
    date: "01.01.2025",
    validUntil: "31.01.2025",
    customer: "Örnek Müşteri Ltd.",
    items: [
      { name: "Yazılım Geliştirme", quantity: 1, unit: "proje", unitPrice: 50000, total: 50000 },
      { name: "Teknik Destek", quantity: 12, unit: "ay", unitPrice: 2500, total: 30000 },
      { name: "Eğitim", quantity: 5, unit: "gün", unitPrice: 1500, total: 7500 }
    ],
    subtotal: 87500,
    tax: 17500,
    total: 105000
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTemplateIcon(template.templateType)}
              <div>
                <DialogTitle className="text-xl">{template.name}</DialogTitle>
                <DialogDescription className="text-base">
                  Şablon önizlemesi ve özellikler
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Template Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {getCategoryLabel(template.templateType)}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{template.popularity || 4.8}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Açıklama</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Özellikler</h4>
                  <ul className="space-y-2">
                    {template.templateFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimatedTime || "5 dk"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{template.usageCount || "2.1k"} kullanım</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h4 className="font-medium">Teklif Önizlemesi</h4>
                <p className="text-sm text-gray-600">
                  Bu şablonla oluşturacağınız teklifin nasıl görüneceğinin örneği
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white shadow-sm">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">TEKLİF</h2>
                      <p className="text-sm text-gray-600">#{mockPreviewData.proposalNumber}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p><strong>Tarih:</strong> {mockPreviewData.date}</p>
                      <p><strong>Geçerlilik:</strong> {mockPreviewData.validUntil}</p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Müşteri Bilgileri</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{mockPreviewData.customer}</p>
                      <p className="text-sm text-gray-600">Örnek Adres, İstanbul</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Teklif Kalemleri</h3>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 border-r">Açıklama</th>
                            <th className="text-center p-2 border-r">Miktar</th>
                            <th className="text-right p-2 border-r">Birim Fiyat</th>
                            <th className="text-right p-2">Toplam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockPreviewData.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2 border-r">{item.name}</td>
                              <td className="text-center p-2 border-r">{item.quantity} {item.unit}</td>
                              <td className="text-right p-2 border-r">{item.unitPrice.toLocaleString()} ₺</td>
                              <td className="text-right p-2">{item.total.toLocaleString()} ₺</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4">
                    <div className="ml-auto w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ara Toplam:</span>
                        <span>{mockPreviewData.subtotal.toLocaleString()} ₺</span>
                      </div>
                      <div className="flex justify-between">
                        <span>KDV (20%):</span>
                        <span>{mockPreviewData.tax.toLocaleString()} ₺</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Genel Toplam:</span>
                        <span className="text-primary">{mockPreviewData.total.toLocaleString()} ₺</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="mt-6 text-xs text-gray-500 border-t pt-4">
                    <p>Bu bir önizlemedir. Gerçek teklif verileriniz burada görünecektir.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button 
            onClick={() => {
              onSelectTemplate(template);
              onClose();
            }}
            className="min-w-32"
          >
            Bu Şablonu Kullan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;