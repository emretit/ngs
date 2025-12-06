import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Wrench } from 'lucide-react';

interface TemplateTypeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'quote' | 'service') => void;
}

export const TemplateTypeSelectionModal: React.FC<TemplateTypeSelectionModalProps> = ({
  open,
  onOpenChange,
  onSelectType,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
          <DialogDescription>
            Oluşturmak istediğiniz şablon tipini seçin
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => {
              onSelectType('quote');
              onOpenChange(false);
            }}
          >
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-center">
              <div className="font-semibold">Teklif Şablonu</div>
              <div className="text-xs text-muted-foreground mt-1">
                PDF teklif şablonu
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => {
              onSelectType('service');
              onOpenChange(false);
            }}
          >
            <div className="p-3 rounded-full bg-green-100">
              <Wrench className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <div className="font-semibold">Servis Şablonu</div>
              <div className="text-xs text-muted-foreground mt-1">
                Servis talebi şablonu
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};














