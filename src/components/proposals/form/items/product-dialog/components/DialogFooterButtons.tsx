
import React from "react";
import { Button } from "@/components/ui/button";

interface DialogFooterButtonsProps {
  onClose: () => void;
  onSelectProduct: () => void;
}

const DialogFooterButtons: React.FC<DialogFooterButtonsProps> = ({ onClose, onSelectProduct }) => {
  return (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        İptal
      </Button>
      <Button type="button" onClick={onSelectProduct} className="ml-2">
        Ekle
      </Button>
    </>
  );
};

export default DialogFooterButtons;
