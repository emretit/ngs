
import { useParams } from "react-router-dom";
import ProductFormWrapper from "@/components/products/form/ProductFormWrapper";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Toaster } from "@/components/ui/toaster";

interface ProductFormProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ProductForm = ({ isCollapsed, setIsCollapsed }: ProductFormProps) => {
  const { id } = useParams();
  const title = id ? "Ürün Düzenle" : "Yeni Ürün Ekle";
  
  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title={title}
      subtitle="Ürün bilgilerini doldurun ve kaydedin"
    >
      <ProductFormWrapper />
      <Toaster />
    </DefaultLayout>
  );
};

export default ProductForm;
