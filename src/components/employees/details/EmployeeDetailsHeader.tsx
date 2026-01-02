
import { Employee } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface EmployeeDetailsHeaderProps {
  employee: Employee;
  onEdit: () => void;
}

export const EmployeeDetailsHeader = ({ employee, onEdit }: EmployeeDetailsHeaderProps) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden">
          {employee.avatar_url ? (
            <img 
              src={employee.avatar_url} 
              alt={`${employee.first_name} ${employee.last_name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-medium text-gray-400">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-gray-500">{employee.position}</p>
          <p className="text-sm text-gray-400">
            Katılım: {formatDate(employee.hire_date)}
          </p>
        </div>
      </div>
      <Button onClick={onEdit} variant="outline" className="gap-2">
        <Edit className="h-4 w-4" />
        Bilgileri Düzenle
      </Button>
    </div>
  );
};
