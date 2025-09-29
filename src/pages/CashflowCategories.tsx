import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import CategoryManagement from "@/components/cashflow/CategoryManagement";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const CashflowCategories = () => {
  const navigate = useNavigate();

  return (
    <DefaultLayout>
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cashflow/expenses')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gelir-Gider Kategorileri</h1>
              <p className="text-gray-600 mt-1">Nakit akış kategorilerini yönetin ve düzenleyin</p>
            </div>
          </div>
        </div>

        {/* Kategori Yönetimi */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <CategoryManagement />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CashflowCategories;
