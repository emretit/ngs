import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface PdfTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  schema?: any;
}

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

  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-slip-templates', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('type', 'service_slip')
        .eq('company_id', userData.company_id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PdfTemplate[];
    },
    enabled: isOpen && !!userData?.company_id,
  });

  const handleSelect = () => {
    if (selectedTemplateId) {
      onSelect(selectedTemplateId);
      setSelectedTemplateId(null);
    }
  };

  const defaultTemplate = templates?.find(t => t.is_default);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Şablonu Seç</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
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
                      {template.is_default && (
                        <Badge variant="secondary">Varsayılan</Badge>
                      )}
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

