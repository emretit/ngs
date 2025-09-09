import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OpportunityColumn } from "../hooks/useOpportunityColumns";

interface DeleteColumnDialogProps {
  columnToDelete: string | null;
  columns: OpportunityColumn[];
  onClose: () => void;
  onConfirmDelete: () => void;
}

const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  columnToDelete,
  columns,
  onClose,
  onConfirmDelete,
}) => {
  const column = columns.find(c => c.id === columnToDelete);

  return (
    <AlertDialog open={!!columnToDelete} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sütunu Sil</AlertDialogTitle>
          <AlertDialogDescription>
            "{column?.title}" sütununu silmek istediğinize emin misiniz?
            <br />
            <br />
            Bu sütundaki tüm fırsatlar "Yeni" durumuna taşınacaktır.
            Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>İptal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Sütunu Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteColumnDialog;