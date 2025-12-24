import { useState, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CategoryManagement from "@/components/cashflow/CategoryManagement";
import CategoriesPageHeader from "@/components/cashflow/CategoriesPageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Activity } from "lucide-react";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";

const CashflowCategories = memo(() => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { categories, loading: categoriesLoading } = useCashflowCategories();
  const { subcategories, loading: subcategoriesLoading } = useCashflowSubcategories();

  // Kategori istatistiklerini hesapla
  const stats = useMemo(() => {
    const incomeCategories = categories.filter(cat => cat.type === 'income').length;
    const expenseCategories = categories.filter(cat => cat.type === 'expense').length;
    const totalCategories = categories.length;
    const totalSubcategories = subcategories.length;

    return {
      totalCategories,
      incomeCategories,
      expenseCategories,
      subcategories: totalSubcategories
    };
  }, [categories, subcategories]);

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <CategoriesPageHeader
        totalCategories={stats.totalCategories}
        incomeCategories={stats.incomeCategories}
        expenseCategories={stats.expenseCategories}
        subcategories={stats.subcategories}
        onCreateCategory={() => setIsCreateDialogOpen(true)}
      />

      {/* Arama ve Filtreleme */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Kategori adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Select value={selectedType} onValueChange={(value: "all" | "income" | "expense") => setSelectedType(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Kategori Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kategoriler</SelectItem>
            <SelectItem value="income">💰 Gelir</SelectItem>
            <SelectItem value="expense">💸 Gider</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <Activity className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Durumlar</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CategoryManagement 
          searchQuery={searchQuery}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          externalOpenCreateDialog={isCreateDialogOpen}
          onExternalDialogOpened={() => setIsCreateDialogOpen(false)}
        />
      </div>
    </div>
  );
});

export default CashflowCategories;
