/**
 * SaveViewModal Component
 * Rapor görünümünü kaydetme modalı
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface SaveViewModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (viewName: string, isDefault: boolean) => Promise<void>;
  existingViewName?: string;
}

export default function SaveViewModal({
  open,
  onClose,
  onSave,
  existingViewName,
}: SaveViewModalProps) {
  const [viewName, setViewName] = useState(existingViewName || "");
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setViewName(existingViewName || "");
      setIsDefault(false);
    }
  }, [open, existingViewName]);

  const handleSave = async () => {
    if (!viewName.trim()) {
      toast.error("Lütfen bir görünüm adı girin");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(viewName.trim(), isDefault);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Görünüm kaydedilemedi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingViewName ? "Görünümü Güncelle" : "Görünümü Kaydet"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="view-name">Görünüm Adı</Label>
            <Input
              id="view-name"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Örn: Aylık Satış Raporu"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSaving) {
                  handleSave();
                }
              }}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="default-view"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
              disabled={isSaving}
            />
            <Label
              htmlFor="default-view"
              className="text-sm font-normal cursor-pointer"
            >
              Varsayılan görünüm olarak ayarla
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !viewName.trim()}
          >
            {isSaving ? "Kaydediliyor..." : existingViewName ? "Güncelle" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

