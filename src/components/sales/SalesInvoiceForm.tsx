import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SalesInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesInvoiceForm = ({ isOpen, onClose }: SalesInvoiceFormProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Yeni Fatura Oluştur</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <p className="text-gray-600 text-center py-8">
            Fatura oluşturma formu burada olacak.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesInvoiceForm;
