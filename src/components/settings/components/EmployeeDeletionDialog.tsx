import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Employee } from "../types";
import { Trash2, UserX, AlertTriangle } from "lucide-react";

interface EmployeeDeletionDialogProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteUser: boolean) => void;
  isLoading?: boolean;
}

export const EmployeeDeletionDialog = ({
  employee,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: EmployeeDeletionDialogProps) => {
  const [deleteOption, setDeleteOption] = useState<'employee' | 'both' | null>(null);

  const handleConfirm = () => {
    if (deleteOption) {
      onConfirm(deleteOption === 'both');
      setDeleteOption(null);
    }
  };

  const handleClose = () => {
    setDeleteOption(null);
    onClose();
  };

  if (!employee) return null;

  const hasLinkedUser = employee.user_id;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-left text-red-900">
                Çalışanı Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left mt-2">
                {employee.first_name} {employee.last_name}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4">
          {hasLinkedUser ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 text-warning text-sm font-medium">
                  <UserX className="h-4 w-4" />
                  Bu çalışanın bir kullanıcı hesabı var
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Çalışanı silerken kullanıcı hesabı ile ne yapılmasını istiyorsunuz?
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDeleteOption('employee')}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    deleteOption === 'employee'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">Sadece Çalışanı Sil</div>
                      <div className="text-xs text-muted-foreground">
                        Kullanıcı hesabı korunur, sadece çalışan kaydı silinir
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteOption('both')}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    deleteOption === 'both'
                      ? 'border-destructive bg-destructive/5 text-destructive'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserX className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">İkisini de Sil</div>
                      <div className="text-xs text-muted-foreground">
                        Hem çalışan hem de kullanıcı hesabı silinir
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Bu çalışanın henüz bir kullanıcı hesabı yok (email bekleniyor).
                Çalışan kaydı silinecek.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={hasLinkedUser ? handleConfirm : () => onConfirm(false)}
            disabled={isLoading || (hasLinkedUser && !deleteOption)}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "İşleniyor..." : "Sil"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};