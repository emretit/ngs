
import React, { useState, useMemo } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { AlertCircle, CheckCircle, AlertTriangle, Package, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  formatCurrency: (amount: number, currency?: string) => string;
  onSelectProduct: (product: Product) => void;
  selectedCurrency: string;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  searchQuery,
  formatCurrency,
  onSelectProduct,
  selectedCurrency
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach(product => {
      if (product.product_categories?.name) {
        uniqueCategories.add(product.product_categories.name);
      }
    });
    return Array.from(uniqueCategories);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Search filter
        const matchesSearch = 
          searchQuery === "" || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Category filter
        const matchesCategory = 
          categoryFilter === "all" || 
          product.product_categories?.name === categoryFilter;
        
        // Stock filter
        let matchesStock = true;
        if (stockFilter === "in_stock") {
          matchesStock = (product.stock_quantity > product.min_stock_level);
        } else if (stockFilter === "low_stock") {
          matchesStock = (product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_level);
        } else if (stockFilter === "out_of_stock") {
          matchesStock = (product.stock_quantity <= 0);
        }
        
        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === "price") {
          return sortOrder === "asc" 
            ? a.price - b.price
            : b.price - a.price;
        } else if (sortBy === "stock") {
          return sortOrder === "asc" 
            ? a.stock_quantity - b.stock_quantity
            : b.stock_quantity - a.stock_quantity;
        }
        return 0;
      });
  }, [products, searchQuery, categoryFilter, stockFilter, sortBy, sortOrder]);

  const getStockStatusBadge = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Stokta Yok
        </Badge>
      );
    } else if (product.stock_quantity <= product.min_stock_level) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Düşük Stok
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Stokta
        </Badge>
      );
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Ürünler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full h-7 text-xs">
              <SelectValue placeholder="Kategori Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full h-7 text-xs">
              <SelectValue placeholder="Stok Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Stok Durumları</SelectItem>
              <SelectItem value="in_stock">Stokta</SelectItem>
              <SelectItem value="low_stock">Düşük Stok</SelectItem>
              <SelectItem value="out_of_stock">Stokta Yok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full h-7 text-xs">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">İsme Göre</SelectItem>
              <SelectItem value="price">Fiyata Göre</SelectItem>
              <SelectItem value="stock">Stok Miktarına Göre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="icon" onClick={toggleSortOrder}>
          {sortOrder === "asc" ? "↑" : "↓"}
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Stok Durumu</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  {searchQuery 
                    ? `"${searchQuery}" ile eşleşen ürün bulunamadı` 
                    : "Arama kriterlerinize uygun ürün bulunamadı"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id} className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectProduct(product)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.sku}
                        </span>
                      )}
                      {product.description && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStockStatusBadge(product)}
                      <span className="text-sm">{product.stock_quantity} {product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {formatCurrency(product.price, product.currency)}
                      </span>
                      {product.discount_price && product.discount_price < product.price && (
                        <span className="text-xs text-green-600">
                          İndirimli: {formatCurrency(product.discount_price, product.currency)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Seç
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductList;
