
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSetSelectedRequestData: (data: any) => void;
  onConfirmDelete: () => void;
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  onSetSelectedRequestData,
  onConfirmDelete
}: DeleteDialogProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) onSetSelectedRequestData(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Servis Talebini Sil</DialogTitle>
          <DialogDescription>
            Bu servis talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm ilişkili aktiviteler de silinecektir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
