
import { UserWithRoles } from "./types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserMutations } from "./hooks/useUserMutations";
import { UserAvatar } from "./components/UserAvatar";
import { UserRoleSelect } from "./components/UserRoleSelect";
import { UserActions } from "./components/UserActions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Building2, X, UserPlus, UserCheck, Edit3, Trash2, Check, ArrowRight } from "lucide-react";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";
import { handleError, handleSuccess } from "@/utils/errorHandler";
import { EmployeeDeletionDialog } from "./components/EmployeeDeletionDialog";
import { Employee } from "./types";

type UserListProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

export const UserList = ({ users, isLoading }: UserListProps) => {
  const { assignRoleMutation, resetPasswordMutation, deactivateUserMutation } = useUserMutations();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const { userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update profile with employee match
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, employeeId }: { userId: string; employeeId: string | null }) => {
      logger.info('Updating user-employee mapping', { userId, employeeId });
      
      const { error } = await supabase
        .from("profiles")
        .update({ employee_id: employeeId })
        .eq("id", userId);

      if (error) {
        logger.error('Profile update failed', error);
        throw error;
      }
      
      logger.info('Profile updated successfully');
    },
    onSuccess: (data, variables) => {
      handleSuccess('User-employee mapping updated successfully', 'updateProfile', variables);
      
      // Invalidate all queries that might contain user data
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ['users', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'settings', 'employee-matching'] });
      
      toast({
        title: "Başarılı",
        description: "Kullanıcı-çalışan eşleştirmesi güncellendi",
      });
      setEditingUserId(null);
    },
    onError: (error: any) => {
      handleError(error, {
        operation: 'updateProfile',
        userId: userData?.id,
        metadata: { error: error.message }
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, deleteUser }: { employeeId: string; deleteUser: boolean }) => {
      logger.info('Deleting employee', { employeeId, deleteUser });

      if (deleteUser) {
        // First get the user_id from employee
        const { data: employee, error: fetchError } = await supabase
          .from("employees")
          .select("user_id")
          .eq("id", employeeId)
          .single();

        if (fetchError) throw fetchError;

        // Delete both employee and user
        const { error: deleteUserError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", employee.user_id);

        if (deleteUserError) throw deleteUserError;
      }

      // Delete employee (this will be handled automatically if user is deleted due to cascade)
      const { error: deleteEmployeeError } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (deleteEmployeeError) throw deleteEmployeeError;
    },
    onSuccess: (data, variables) => {
      handleSuccess('Employee deleted successfully', 'deleteEmployee', variables);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      
      toast({
        title: "Başarılı",
        description: variables.deleteUser ? "Çalışan ve kullanıcı silindi" : "Çalışan silindi",
      });
      
      setShowDeletionDialog(false);
      setEmployeeToDelete(null);
    },
    onError: (error: any) => {
      handleError(error, {
        operation: 'deleteEmployee',
        userId: userData?.id,
        metadata: { error: error.message }
      });
    },
  });

  const handleEmployeeSelect = (userId: string, employeeId: string) => {
    logger.info('Employee selection triggered', { userId, employeeId });
    if (employeeId) {
      updateProfileMutation.mutate({ userId, employeeId });
    } else {
      logger.warn('No employeeId provided in handleEmployeeSelect');
    }
  };

  const handleRemoveMatch = (userId: string) => {
    updateProfileMutation.mutate({ userId, employeeId: null });
  };

  const handleEmployeeDeletion = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeletionDialog(true);
  };

  const handleConfirmDeletion = (deleteUser: boolean) => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate({ 
        employeeId: employeeToDelete.id, 
        deleteUser 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Çalışan Eşleştirme</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Kullanıcı bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow 
                key={user.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <UserAvatar user={user} />
                </TableCell>
                <TableCell>
                  <UserRoleSelect 
                    user={user}
                    onRoleChange={(role) => assignRoleMutation.mutate({ userId: user.id, role })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {editingUserId === user.id ? (
                      <div className="flex items-center space-x-3 min-w-[280px] p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <EmployeeSelector
                            value={user.employee_id || ""}
                            onChange={(employeeId) => handleEmployeeSelect(user.id, employeeId)}
                            error=""
                            companyId={userData?.company_id}
                            showLabel={false}
                            placeholder="Çalışan seçin..."
                            searchPlaceholder="Çalışan ara..."
                            loadingText="Çalışanlar yükleniyor..."
                            noResultsText="Çalışan bulunamadı"
                            className="min-w-[200px]"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUserId(null)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        {/* Status Badge */}
                        <div className={`flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium ${
                          user.employee_id 
                            ? "bg-gray-100 text-gray-700" 
                            : "bg-gray-50 text-gray-500"
                        }`}>
                          {user.employee_id ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserPlus className="h-3 w-3" />
                          )}
                          <span>
                            {user.employee_id ? "Eşleştirilmiş" : "Eşleştirilmemiş"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(user.id)}
                            className="h-7 px-2 text-xs font-medium text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            disabled={updateProfileMutation.isPending}
                          >
                            {user.employee_id ? (
                              <>
                                <Edit3 className="h-3 w-3 mr-1" />
                                Değiştir
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Eşleştir
                              </>
                            )}
                          </Button>
                          
                          {user.employee_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMatch(user.id)}
                              className="h-7 px-2 text-xs font-medium text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                              disabled={updateProfileMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Kaldır
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active !== false ? "default" : "secondary"}>
                    {user.is_active !== false ? "Aktif" : "Devre Dışı"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.created_at && new Date(user.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell className="text-right">
                  <UserActions 
                    user={user}
                    onResetPassword={() => resetPasswordMutation.mutate(user.email || '')}
                    onDeactivate={() => deactivateUserMutation.mutate(user.id)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <EmployeeDeletionDialog
        employee={employeeToDelete}
        isOpen={showDeletionDialog}
        onClose={() => {
          setShowDeletionDialog(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleConfirmDeletion}
        isLoading={deleteEmployeeMutation.isPending}
      />
    </div>
  );
};
