import React from "react";
import { useTranslation } from "react-i18next";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
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
  const { t } = useTranslation();
  const column = columns.find(c => c.id === columnToDelete);

  const handleConfirm = () => {
    onConfirmDelete();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <ConfirmationDialogComponent
      open={!!columnToDelete}
      onOpenChange={(open) => !open && onClose()}
      title="Sütunu Sil"
      description={`"${column?.title || 'Bu sütun'}" sütununu silmek istediğinize emin misiniz? Bu sütundaki tüm fırsatlar "Yeni" durumuna taşınacaktır. Bu işlem geri alınamaz.`}
      confirmText={t("common.delete")}
      cancelText={t("common.cancel")}
      variant="destructive"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isLoading={false}
    />
  );
};

export default DeleteColumnDialog;