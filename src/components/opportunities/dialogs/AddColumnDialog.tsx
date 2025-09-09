import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Sütun Ekle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="column-title">Sütun Adı</Label>
            <Input
              id="column-title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Ör: Demo Yapıldı, Fiyat Görüşmesi..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddColumn();
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button 
            onClick={handleAddColumn}
            disabled={!newColumnTitle.trim()}
          >
            Sütun Ekle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;