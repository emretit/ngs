
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeNames } from "@/hooks/useEmployeeNames";
import { useCustomerNames } from "@/hooks/useCustomerNames";

interface OpportunityFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedEmployee: string | null;
  setSelectedEmployee: (employeeId: string | null) => void;
  selectedCustomer: string | null;
  setSelectedCustomer: (customerId: string | null) => void;
}

const OpportunityFilters = ({
  searchQuery,
  setSearchQuery,
  selectedEmployee,
  setSelectedEmployee,
  selectedCustomer,
  setSelectedCustomer,
}: OpportunityFiltersProps) => {
  const { employees } = useEmployeeNames();
  const { customers } = useCustomerNames();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Fırsat ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="w-full sm:w-64">
        <Select
          value={selectedEmployee || "all"}
          onValueChange={(value) => setSelectedEmployee(value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Satış Temsilcisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Temsilciler</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-64">
        <Select
          value={selectedCustomer || "all"}
          onValueChange={(value) => setSelectedCustomer(value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Müşteri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Müşteriler</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default OpportunityFilters;
