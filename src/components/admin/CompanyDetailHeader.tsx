import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Power, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useToggleCompanyStatus, useDeleteCompany } from "@/hooks/useCompanies";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  domain?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

interface CompanyDetailHeaderProps {
  company: Company;
}

export const CompanyDetailHeader = ({ company }: CompanyDetailHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const toggleActiveMutation = useToggleCompanyStatus();
  const deleteMutation = useDeleteCompany();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleToggleActive = async () => {
    try {
      await toggleActiveMutation.mutateAsync({ id: company.id, isActive: company.is_active });
      toast({
        title: "Başarılı",
        description: `Şirket ${company.is_active ? 'pasif' : 'aktif'} yapıldı`,
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Durum değiştirilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(company.id);
      toast({
        title: "Başarılı",
        description: "Şirket silindi",
      });
      setIsDeleteDialogOpen(false);
      navigate('/admin/companies');
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şirket silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/companies')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Şirketler
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {company.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-16 w-16 rounded object-cover border"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.is_active ? (
                <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>
              ) : (
                <Badge variant="destructive">Pasif</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {company.email && <span>{company.email}</span>}
              {company.phone && <span>•</span>}
              {company.phone && <span>{company.phone}</span>}
              {company.domain && <span>•</span>}
              {company.domain && <span>{company.domain}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleActive}
            className="gap-2"
          >
            <Power className={`h-4 w-4 ${company.is_active ? 'text-green-600' : 'text-red-600'}`} />
            {company.is_active ? 'Pasif Yap' : 'Aktif Yap'}
          </Button>
          <Button variant="destructive" className="gap-2" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Şirketi Sil"
        description={`"${company.name}" şirketini silmek istediğinizden emin misiniz? Bu işlem şirketi pasif hale getirecektir. Şirket verisi silinmez, sadece is_active = false olarak işaretlenir. Gerektiğinde şirketi tekrar aktif hale getirebilirsiniz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
