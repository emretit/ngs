import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Save } from "lucide-react";
import ProductFormWrapper from "@/components/products/form/ProductFormWrapper";
import { Toaster } from "@/components/ui/toaster";

interface ProductFormProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const ProductForm = ({ isCollapsed, setIsCollapsed }: ProductFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const title = id ? "Ürün Düzenle" : "Yeni Ürün Ekle";
  
  return (
    <div>
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              onClick={() => navigate("/products")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ürünler
            </Button>
            
            {/* Title Section */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {id ? "Ürün bilgilerini düzenle" : "Yeni ürün ekle"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              form="product-form"
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{id ? "Değişiklikleri Kaydet" : "Kaydet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <ProductFormWrapper />
      </div>
      
      <Toaster />
    </div>
  );
};

export default ProductForm;
