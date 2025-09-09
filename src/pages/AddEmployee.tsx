
import Navbar from "@/components/Navbar";
import SimpleEmployeeForm from "@/components/employees/form/SimpleEmployeeForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AddEmployeeProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const AddEmployee = ({ isCollapsed, setIsCollapsed }: AddEmployeeProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <div className="container mx-auto px-6 py-8">
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
      </main>
    </div>
  );
};

export default AddEmployee;
