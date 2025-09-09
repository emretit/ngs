
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  handleAddColumn: () => void;
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({
  isOpen,
  onClose,
  newColumnTitle,
  setNewColumnTitle,
  handleAddColumn,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Sütun Ekle</DialogTitle>
          <DialogDescription>
            Kanban panonuza yeni bir sütun ekleyin
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Sütun başlığı"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            İptal
          </Button>
          <Button onClick={handleAddColumn}>
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;
