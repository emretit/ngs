import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { User, Building2 } from "lucide-react";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

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
                  <AvatarImage src={profile.full_name ? undefined : undefined} />
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

            {/* Employee Selector */}
            <div className="space-y-2">
              <EmployeeSelector
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                error=""
                companyId={userData?.company_id}
              />
            </div>

            {/* Current Match Info */}
            {selectedEmployeeId && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-sm text-green-800 mb-1">Seçilen Çalışan</h4>
                <p className="text-sm text-green-700">
                  Çalışan eşleştirildi
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
