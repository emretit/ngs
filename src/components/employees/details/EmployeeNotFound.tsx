
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export const EmployeeNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-medium text-gray-800">Çalışan bulunamadı</h2>
        <p className="text-gray-600 max-w-md">
          İstediğiniz çalışan kaydı mevcut değil veya erişim izniniz yok.
        </p>
        <Button 
          onClick={() => navigate("/employees")}
          className="mt-2"
        >
          Çalışanlara Dön
        </Button>
      </div>
    </div>
  );
};
