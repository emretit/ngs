import { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  gross_salary?: number;
}

interface EmployeeListPanelProps {
  employees: Employee[];
  selectedId: string | null;
  onSelect: (employeeId: string) => void;
  isLoading?: boolean;
}

export const EmployeeListPanel = ({
  employees,
  selectedId,
  onSelect,
  isLoading = false,
}: EmployeeListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;

    const searchLower = searchQuery.toLowerCase();
    return employees.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const department = emp.department?.toLowerCase() || "";
      return fullName.includes(searchLower) || department.includes(searchLower);
    });
  }, [employees, searchQuery]);

  // Group by department
  const employeesByDepartment = useMemo(() => {
    const grouped: { [key: string]: Employee[] } = {};
    
    filteredEmployees.forEach((emp) => {
      const dept = emp.department || "Departman Yok";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(emp);
    });

    return grouped;
  }, [filteredEmployees]);

  const departments = Object.keys(employeesByDepartment).sort();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Çalışanlar</CardTitle>
            <CardDescription className="text-xs">
              {filteredEmployees.length} çalışan
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Çalışan veya departman ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Employee List */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Arama sonucu bulunamadı" : "Çalışan bulunamadı"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {departments.map((department) => (
                <div key={department} className="space-y-2">
                  {/* Department Header */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="secondary" className="text-xs">
                      {department}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Employees in Department */}
                  <div className="space-y-1">
                    {employeesByDepartment[department].map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => onSelect(emp.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          selectedId === emp.id
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "hover:bg-accent hover:border-primary/50"
                        )}
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold",
                              selectedId === emp.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {emp.first_name.charAt(0)}
                            {emp.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              selectedId === emp.id && "text-primary"
                            )}
                          >
                            {emp.first_name} {emp.last_name}
                          </p>
                          {emp.gross_salary && (
                            <p className="text-xs text-muted-foreground">
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                                minimumFractionDigits: 0,
                              }).format(emp.gross_salary)}
                            </p>
                          )}
                        </div>

                        {selectedId === emp.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
