import DefaultLayout from "@/components/layouts/DefaultLayout";
import SimpleEmployeeForm from "@/components/employees/form/SimpleEmployeeForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddEmployee = () => {
  const navigate = useNavigate();
  
  return (
    <DefaultLayout>
      <div className="w-full">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Çalışanlara Dön
        </Button>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Yeni Çalışan Ekle</h1>
          <p className="text-gray-500">Yeni bir çalışan kaydı oluşturun</p>
        </div>
        
        <SimpleEmployeeForm />
      </div>
    </DefaultLayout>
  );
};

export default AddEmployee;
