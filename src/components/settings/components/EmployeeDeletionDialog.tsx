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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Çalışanı Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
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
                  Bu çalışan bir kullanıcı hesabıyla eşleştirilmiş
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
                        Kullanıcı hesabı korunur, sadece eşleştirme kaldırılır
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
                Bu çalışan herhangi bir kullanıcı hesabıyla eşleştirilmemiş.
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
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={hasLinkedUser ? handleConfirm : () => onConfirm(false)}
            disabled={isLoading || (hasLinkedUser && !deleteOption)}
          >
            {isLoading ? "Siliniyor..." : "Sil"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};