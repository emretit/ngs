import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Building2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PayrollHeaderProps {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number?: string;
    department?: string;
    position?: string;
    workplace?: string;
    hire_date?: string;
  };
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export const PayrollHeader = ({
  employee,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: PayrollHeaderProps) => {
  const months = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-50">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {employee.first_name} {employee.last_name}
                </h2>
                {employee.position && (
                  <p className="text-sm text-muted-foreground">
                    {employee.position}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {employee.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Departman:</span>
                  <span className="font-medium">{employee.department}</span>
                </div>
              )}
              {employee.workplace && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">İşyeri:</span>
                  <span className="font-medium">{employee.workplace}</span>
                </div>
              )}
              {employee.hire_date && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">İşe Giriş:</span>
                  <span className="font-medium">
                    {format(new Date(employee.hire_date), "d MMMM yyyy", { locale: tr })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Period Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Bordro Dönemi</label>
              <div className="flex gap-2">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => onMonthChange(parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => onYearChange(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Seçili Dönem: {months[selectedMonth - 1].label} {selectedYear}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
