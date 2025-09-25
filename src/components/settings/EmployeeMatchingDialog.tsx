import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Search, User, Building2, Mail, Phone } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  avatar_url?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  company_id: string;
}

interface EmployeeMatchingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

export const EmployeeMatchingDialog = ({
  isOpen,
  onClose,
  profile,
}: EmployeeMatchingDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Fetch employees for the current company
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-for-matching", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, phone, position, department, avatar_url")
        .eq("company_id", userData.company_id)
        .eq("status", "aktif")
        .order("first_name");

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!userData?.company_id && isOpen,
  });

  // Filter employees based on search query
  const filteredEmployees = employees.filter((employee) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchTerm) ||
      employee.last_name.toLowerCase().includes(searchTerm) ||
      employee.email.toLowerCase().includes(searchTerm) ||
      employee.position.toLowerCase().includes(searchTerm) ||
      employee.department.toLowerCase().includes(searchTerm)
    );
  });

  // Set initial selected employee when profile changes
  useEffect(() => {
    if (profile?.employee_id) {
      setSelectedEmployeeId(profile.employee_id);
    } else {
      setSelectedEmployeeId("");
    }
  }, [profile]);

  // Update profile with employee match
  const updateProfileMutation = useMutation({
    mutationFn: async (employeeId: string | null) => {
      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from("profiles")
        .update({ employee_id: employeeId })
        .eq("id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı-çalışan eşleştirmesi güncellendi",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Eşleştirme güncellenirken hata oluştu: " + error.message,
      });
    },
  });

  const handleSave = () => {
    const employeeId = selectedEmployeeId || null;
    updateProfileMutation.mutate(employeeId);
  };

  const handleRemoveMatch = () => {
    updateProfileMutation.mutate(null);
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Çalışan Eşleştirme</DialogTitle>
          <DialogDescription>
            Kullanıcıyı mevcut çalışanlardan biriyle eşleştirin veya eşleştirmeyi kaldırın.
          </DialogDescription>
        </DialogHeader>

        {profile && (
          <div className="space-y-6 flex-1 overflow-hidden">
            {/* Current Profile Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Kullanıcı Bilgileri</h3>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.full_name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Çalışan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {employeesLoading ? (
                <div className="text-center py-4 text-gray-500">Yükleniyor...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchQuery ? "Arama kriterlerine uygun çalışan bulunamadı" : "Çalışan bulunamadı"}
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployeeId === employee.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar_url} />
                        <AvatarFallback>
                          {employee.first_name[0]}{employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">
                            {employee.first_name} {employee.last_name}
                          </p>
                          {selectedEmployeeId === employee.id && (
                            <Badge variant="secondary" className="text-xs">
                              Seçili
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          {employee.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          <Building2 className="h-3 w-3" />
                          <span>{employee.position}</span>
                          <span>•</span>
                          <span>{employee.department}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Current Match Info */}
            {selectedEmployee && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-sm text-green-800 mb-1">Seçilen Çalışan</h4>
                <p className="text-sm text-green-700">
                  {selectedEmployee.first_name} {selectedEmployee.last_name} - {selectedEmployee.position}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {profile?.employee_id && (
              <Button
                variant="outline"
                onClick={handleRemoveMatch}
                disabled={updateProfileMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                Eşleştirmeyi Kaldır
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeMatchingDialog;
