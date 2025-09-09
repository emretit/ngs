
import { User } from "lucide-react";
import { Employee } from "@/types/employee";
import { FormFields } from "../form/FormFields";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

interface DetailsTabContentProps {
  employee: Employee;
  handleEmployeeUpdate: (employee: Employee) => void;
}

export const DetailsTabContent = ({ 
  employee, 
  handleEmployeeUpdate,
}: DetailsTabContentProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <User className="w-5 h-5 mr-2 text-primary" />
          Employee Details
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/employee-form/${employee.id}`)}
          className="flex items-center gap-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Details
        </Button>
      </div>
      
      <FormFields 
        formData={employee}
        departments={[{ name: employee.department }]}
        isEditing={false}
      />
    </div>
  );
};
