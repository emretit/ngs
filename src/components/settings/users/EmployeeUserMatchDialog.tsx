import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, Mail, Building2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmployeeUserMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    employee_id: string | null;
  };
  onSuccess?: () => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string;
  user_id: string | null;
}

export const EmployeeUserMatchDialog = ({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EmployeeUserMatchDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Fetch available employees (unmatched or can be reassigned)
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["available-employees", user.id],
    queryFn: async () => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Get all employees in the company
      // Include employees that are unmatched or can be reassigned
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("first_name");

      if (error) throw error;
      return (data || []) as Employee[];
    },
    enabled: open,
  });

  // Set initial selected employee if user already has one, or auto-match by email
  useEffect(() => {
    if (user.employee_id) {
      setSelectedEmployeeId(user.employee_id);
    } else if (employees.length > 0 && user.email) {
      // Auto-find employee with matching email
      const matchingEmployee = employees.find(
        (emp) => emp.email && emp.email.toLowerCase() === user.email.toLowerCase()
      );
      if (matchingEmployee && !matchingEmployee.user_id) {
        // Auto-select if email matches and employee is not already matched
        setSelectedEmployeeId(matchingEmployee.id);
      } else {
        setSelectedEmployeeId("");
      }
    } else {
      setSelectedEmployeeId("");
    }
  }, [user.employee_id, user.email, employees, open]);

  // Match user with employee mutation
  const matchMutation = useMutation({
    mutationFn: async (employeeId: string | null) => {
      if (employeeId) {
        // Match user with employee
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ employee_id: employeeId })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // The trigger will automatically update employees.user_id
      } else {
        // Unmatch - remove the connection
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ employee_id: null })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, employeeId) => {
      toast.success(employeeId
        ? "Kullanıcı çalışanla eşleştirildi"
        : "Eşleştirme kaldırıldı");
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      queryClient.invalidateQueries({ queryKey: ["available-employees"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Eşleştirme yapılırken bir hata oluştu");
    },
  });

  const handleMatch = () => {
    if (selectedEmployeeId) {
      matchMutation.mutate(selectedEmployeeId);
    } else {
      // Unmatch
      matchMutation.mutate(null);
    }
  };

  // Filter employees - prioritize email matches, then unmatched ones, then others
  const emailMatchedEmployees = employees.filter(
    (emp) => 
      emp.email && 
      user.email && 
      emp.email.toLowerCase() === user.email.toLowerCase() &&
      (!emp.user_id || emp.user_id === user.id)
  );
  
  const availableEmployees = employees.filter(
    (emp) => 
      !emp.user_id || emp.user_id === user.id
  ).filter(
    (emp) => !emailMatchedEmployees.includes(emp)
  );
  
  const otherEmployees = employees.filter(
    (emp) => emp.user_id && emp.user_id !== user.id
  );

  // Find current employee if matched
  const currentEmployee = employees.find((emp) => emp.id === user.employee_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Çalışan-Kullanıcı Eşleştirme
          </DialogTitle>
          <DialogDescription>
            Kullanıcıyı bir çalışan kaydıyla eşleştirin veya mevcut eşleştirmeyi kaldırın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current User Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {user.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  {user.full_name || "İsimsiz Kullanıcı"}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Current Match Status */}
          {currentEmployee && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Mevcut Eşleştirme</span>
              </div>
              <div className="text-sm text-green-800">
                <div className="font-medium">
                  {currentEmployee.first_name} {currentEmployee.last_name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3 w-3" />
                  {currentEmployee.department} • {currentEmployee.position}
                </div>
              </div>
            </div>
          )}

          {/* Auto-match suggestion */}
          {!currentEmployee && emailMatchedEmployees.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Otomatik Eşleştirme Önerisi</span>
              </div>
              <div className="text-sm text-blue-800">
                Aynı email adresine sahip bir çalışan bulundu. Otomatik olarak seçildi.
              </div>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Çalışan Seçin
            </label>
            {employeesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Çalışan seçin veya eşleştirmeyi kaldırın" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Eşleştirmeyi Kaldır</SelectItem>
                  {emailMatchedEmployees.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-green-700 bg-green-50">
                        ✨ Email Eşleşmesi (Önerilen)
                      </div>
                      {emailMatchedEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {employee.email} • {employee.department}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-auto text-xs bg-green-100 text-green-700 border-green-300">
                              Email Eşleşti
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {availableEmployees.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Eşleşmemiş Çalışanlar
                      </div>
                      {availableEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {employee.email} • {employee.department}
                              </div>
                            </div>
                            {!employee.user_id && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                Eşleşmemiş
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {otherEmployees.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Diğer Çalışanlar (Yeniden Eşleştirme)
                      </div>
                      {otherEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {employee.email} • {employee.department}
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              Başka kullanıcıya bağlı
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            {selectedEmployeeId && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <div className="font-medium mb-1">Dikkat</div>
                    <div>
                      Seçilen çalışan başka bir kullanıcıya bağlıysa, önceki eşleştirme
                      otomatik olarak kaldırılacaktır.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={matchMutation.isPending}
          >
            İptal
          </Button>
          <Button
            onClick={handleMatch}
            disabled={matchMutation.isPending || employeesLoading}
          >
            {matchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : selectedEmployeeId ? (
              "Eşleştir"
            ) : currentEmployee ? (
              "Eşleştirmeyi Kaldır"
            ) : (
              "İptal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

