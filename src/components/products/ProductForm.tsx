import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCreateProduct = () => {
    // Navigate to product form page
    navigate("/product-form");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Ürün Ekle</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center">
          <p className="text-muted-foreground mb-4">
            Yeni ürün ekleme sayfasına yönlendirileceksiniz.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleCreateProduct}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Devam Et
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;