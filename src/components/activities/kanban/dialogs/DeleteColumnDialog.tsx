
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteColumnDialogProps {
  columnToDelete: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  columnToDelete,
  onClose,
  onConfirmDelete,
}) => {
  return (
    <Dialog open={!!columnToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sütunu Sil</DialogTitle>
          <DialogDescription>
            Bu sütunda görevler var. Silmek istediğinizden emin misiniz? Tüm görevler "Yapılacaklar" sütununa taşınacak.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            İptal
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirmDelete}
          >
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteColumnDialog;
