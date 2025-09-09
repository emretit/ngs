
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceRequestForm } from "../ServiceRequestForm";

interface EditDialogProps {
  isOpen: boolean;
  selectedRequestData: any;
  onOpenChange: (open: boolean) => void;
  onSetSelectedRequestData: (data: any) => void;
}

export function EditDialog({
  isOpen,
  selectedRequestData,
  onOpenChange,
  onSetSelectedRequestData
}: EditDialogProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) onSetSelectedRequestData(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Servis Talebini Düzenle</DialogTitle>
        </DialogHeader>
        {selectedRequestData && (
          <ServiceRequestForm 
            onClose={() => onOpenChange(false)} 
            initialData={selectedRequestData}
            isEditing={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
