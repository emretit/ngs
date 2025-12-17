import React from "react";
import { useTranslation } from "react-i18next";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface DeleteColumnDialogProps {
  columnToDelete: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  columnToDelete,
  onClose,
  onConfirmDelete,
}) => {
  const { t } = useTranslation();

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
      description="Bu sütunda görevler var. Silmek istediğinizden emin misiniz? Tüm görevler \"Yapılacaklar\" sütununa taşınacak. Bu işlem geri alınamaz."
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
