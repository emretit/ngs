import { useParams } from "react-router-dom";
import ProductFormWrapper from "@/components/products/form/ProductFormWrapper";
import { Toaster } from "@/components/ui/toaster";
interface ProductFormProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const ProductForm = ({ isCollapsed, setIsCollapsed }: ProductFormProps) => {
  const { id } = useParams();
  const title = id ? "Ürün Düzenle" : "Yeni Ürün Ekle";
  return (
    <>
      <ProductFormWrapper />
      <Toaster />
    </>
  );
};
export default ProductForm;
