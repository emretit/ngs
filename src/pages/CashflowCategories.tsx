import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import CategoryManagement from "@/components/cashflow/CategoryManagement";
import { ArrowLeft, Tag, Plus, Pencil, Activity, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const CashflowCategories = memo(() => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  return (
    <div className="w-full space-y-2">
      {/* Header - İstatistik kartları ile */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50/50 hover:text-green-700 hover:border-green-200 transition-all duration-200 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Nakit Akış</span>
            </Button>
            
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
              <Tag className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Gelir-Gider Kategorileri
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Nakit akış kategorilerini yönetin ve düzenleyin
              </p>
            </div>
          </div>
          
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Toplam Kategori */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
              <Tag className="h-3 w-3" />
              <span className="font-bold">Toplam</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                12
              </span>
            </div>
            
            {/* Gelir Kategorileri */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Gelir</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                5
              </span>
            </div>
            
            {/* Gider Kategorileri */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-red-100 text-red-800 border-red-200">
              <TrendingDown className="h-3 w-3" />
              <span className="font-medium">Gider</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                7
              </span>
            </div>
            
            {/* Alt Kategoriler */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-purple-100 text-purple-800 border-purple-200">
              <Activity className="h-3 w-3" />
              <span className="font-medium">Alt Kategori</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                8
              </span>
            </div>
          </div>
          
          {/* Sağ taraf - Butonlar */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/cashflow/expenses')}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-600/90 hover:from-green-600/90 hover:to-green-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Pencil className="h-4 w-4" />
              <span>Düzenle</span>
            </Button>
          </div>
        </div>
      </div>

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
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
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
            <SelectItem value="all">Tüm Durumlar</SelectItem>
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
        />
      </div>
    </div>
  );
});

export default CashflowCategories;
