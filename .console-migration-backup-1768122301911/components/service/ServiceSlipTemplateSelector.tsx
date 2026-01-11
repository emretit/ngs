import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import type { ServicePdfTemplate } from '@/types/service-template';

interface ServiceSlipTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export const ServiceSlipTemplateSelector: React.FC<ServiceSlipTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { userData } = useCurrentUser();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ServicePdfTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Servis şablonlarını yükle - ServicesTable'daki gibi
  useEffect(() => {
    const loadTemplates = async () => {
      if (!userData?.company_id || !isOpen) return;
      
      setIsLoadingTemplates(true);
      setError(null);
      try {
        console.log('[ServiceSlipTemplateSelector] Şablonlar yükleniyor...', {
          companyId: userData?.company_id,
          isOpen
        });
        const loadedTemplates = await PdfExportService.getServiceTemplates();
        console.log('[ServiceSlipTemplateSelector] Şablonlar yüklendi:', loadedTemplates);
        setTemplates(loadedTemplates);
      } catch (err) {
        console.error('[ServiceSlipTemplateSelector] Şablon yükleme hatası:', err);
        setError(err instanceof Error ? err : new Error('Bilinmeyen hata'));
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [userData?.company_id, isOpen]);

  const handleSelect = () => {
    if (selectedTemplateId) {
      onSelect(selectedTemplateId);
      setSelectedTemplateId(null);
    }
  };

  // Varsayılan şablon varsa otomatik seç
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      // İlk şablonu seç
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Dialog kapandığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId(null);
      setTemplates([]);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Şablonu Seç</DialogTitle>
        </DialogHeader>

        {isLoadingTemplates ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p className="font-medium">Şablonlar yüklenirken hata oluştu</p>
            <p className="text-sm mt-2 text-muted-foreground">
              {error instanceof Error ? error.message : 'Bilinmeyen hata'}
            </p>
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Henüz servis fişi şablonu oluşturulmamış.</p>
            <p className="text-sm mt-2">Lütfen önce bir şablon oluşturun.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplateId === template.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {selectedTemplateId === template.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedTemplateId}
          >
            Seç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

