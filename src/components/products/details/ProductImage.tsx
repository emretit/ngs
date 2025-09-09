
import { Card, CardContent } from "@/components/ui/card";

interface ProductImageProps {
  imageUrl: string | null;
  productName: string;
}

const ProductImage = ({ imageUrl, productName }: ProductImageProps) => {
  return imageUrl ? (
    <Card>
      <CardContent className="p-6">
        <img
          src={imageUrl}
          alt={productName}
          className="w-full h-auto rounded-lg"
        />
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardContent className="p-6 flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Ürün görseli bulunmuyor</p>
      </CardContent>
    </Card>
  );
};

export default ProductImage;
