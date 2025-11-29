import React from "react";
import { Button } from "@/components/ui/button";
import { Tag, TrendingUp, TrendingDown, Activity, Plus } from "lucide-react";

interface CategoriesPageHeaderProps {
  totalCategories: number;
  incomeCategories: number;
  expenseCategories: number;
  subcategories: number;
  onCreateCategory: () => void;
}

const CategoriesPageHeader = ({
  totalCategories,
  incomeCategories,
  expenseCategories,
  subcategories,
  onCreateCategory
}: CategoriesPageHeaderProps) => {
  // Durum kartları
  const statusCards = [
    { 
      status: 'income', 
      icon: TrendingUp, 
      label: 'Gelir', 
      count: incomeCategories,
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    { 
      status: 'expense', 
      icon: TrendingDown, 
      label: 'Gider', 
      count: expenseCategories,
      color: 'bg-red-100 text-red-800 border-red-200' 
    },
    { 
      status: 'subcategory', 
      icon: Activity, 
      label: 'Alt Kategori', 
      count: subcategories,
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
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
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam kategori sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCategories}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, count, color }) => {
          return (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-300" 
          onClick={onCreateCategory}
        >
          <Plus className="h-4 w-4" />
          <span>Kategori Ekle</span>
        </Button>
      </div>
    </div>
  );
};

export default CategoriesPageHeader;

