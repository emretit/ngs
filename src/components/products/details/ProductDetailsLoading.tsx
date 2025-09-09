
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProductDetailsLoadingProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isError?: boolean;
}

const ProductDetailsLoading = ({ 
  isCollapsed, 
  setIsCollapsed, 
  isError = false 
}: ProductDetailsLoadingProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
      }`}>
        <TopBar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          {isError ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Ürün bulunamadı</h2>
              <Button onClick={() => navigate("/products")}>Ürünlere Dön</Button>
            </>
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductDetailsLoading;
