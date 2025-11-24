import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDFViewer } from '@react-pdf/renderer';
import {
  Edit,
  Copy,
  Trash2,
  X,
  Calendar,
  FileText
} from 'lucide-react';
import { PdfTemplate, QuoteData } from '@/types/pdf-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface QuickPreviewModalProps {
  template: PdfTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (templateId: string, templateType?: 'pdf' | 'service') => void;
  onDuplicate: (template: PdfTemplate) => void;
  onDelete: (template: PdfTemplate) => void;
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
  template,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [previewData, setPreviewData] = useState<QuoteData | null>(null);

  useEffect(() => {
    // Generate sample data for preview
    if (template) {
      const sampleData: QuoteData = {
        number: 'PREVIEW-001',
        title: 'Örnek Belge',
        customer: {
          name: 'Örnek Müşteri',
          company: 'Örnek Şirket A.Ş.',
          email: 'info@ornek.com',
          mobile_phone: '+90 212 555 0123',
          address: 'İstanbul, Türkiye',
        },
        items: [
          {
            id: '1',
            description: 'Ürün/Hizmet 1',
            quantity: 2,
            unit: 'adet',
            unit_price: 100.00,
            discount_rate: 10,
            total: 180.00,
          },
          {
            id: '2',
            description: 'Ürün/Hizmet 2',
            quantity: 1,
            unit: 'paket',
            unit_price: 150.00,
            discount_rate: 0,
            total: 150.00,
          },
        ],
        subtotal: 350.00,
        total_discount: 35.00,
        total_tax: 63.00,
        total_amount: 378.00,
        currency: 'TRY',
        notes: 'Bu bir örnek önizlemedir.',
        id: 'sample-1',
        created_at: new Date().toISOString(),
        prepared_by: 'Örnek Kullanıcı',
      };
      setPreviewData(sampleData);
    }
  }, [template]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quote':
        return 'Teklif';
      case 'invoice':
        return 'Fatura';
      case 'proposal':
        return 'Öneri';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quote':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'invoice':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'proposal':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  if (!template || !previewData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl font-bold">
                  {template.name}
                </DialogTitle>
                <Badge className={getTypeBadgeColor(template.type)}>
                  {getTypeLabel(template.type)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(template.updated_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
                <span>Sürüm: v{template.version}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full w-full">
            <PDFViewer className="w-full h-full border-0">
              <PdfRenderer data={previewData} schema={template.schema_json} />
            </PDFViewer>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Bu bir önizlemedir. Gerçek verilerinizle test etmek için şablonu düzenleyin.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onDuplicate(template)}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Kopyala
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(template)}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
            <Button
              onClick={() => {
                onEdit(template.id, 'pdf');
                onOpenChange(false);
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
