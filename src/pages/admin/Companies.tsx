import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Plus, Search, Pencil, Power, Trash2, Users, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAllCompanies, useToggleCompanyStatus, useDeleteCompany } from "@/hooks/useCompanies";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: companies, isLoading } = useAllCompanies();
  const toggleActiveMutation = useToggleCompanyStatus();
  const deleteMutation = useDeleteCompany();

  const handleDeleteClick = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    try {
      await deleteMutation.mutateAsync(companyToDelete);
      toast({
        title: "Başarılı",
        description: "Şirket silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şirket silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const filteredCompanies = companies?.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading title="Şirket Yönetimi" description="Tüm şirketleri görüntüle ve yönet" />
        <Button onClick={() => navigate('/admin/companies/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Şirket
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Şirket ara (isim, email, domain)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Şirket Adı</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-center">Kullanıcılar</TableHead>
              <TableHead className="text-center">Faturalar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies?.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {company.logo_url && (
                      <img src={company.logo_url} alt={company.name || ''} className="h-8 w-8 rounded object-cover" />
                    )}
                    {company.name || '-'}
                  </div>
                </TableCell>
                <TableCell>{company.email || '-'}</TableCell>
                <TableCell>{company.phone || '-'}</TableCell>
                <TableCell>{company.domain || '-'}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/companies/${company.id}/users`)}
                    className="gap-1"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Görüntüle</span>
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/companies/${company.id}/financials`)}
                    className="gap-1"
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="text-xs">Finansal</span>
                  </Button>
                </TableCell>
                <TableCell>
                  {company.is_active ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>
                  ) : (
                    <Badge variant="destructive">Pasif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(company.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                      title="Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActiveMutation.mutate({ id: company.id, isActive: company.is_active })}
                      title={company.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      <Power className={`h-4 w-4 ${company.is_active ? 'text-green-600' : 'text-red-600'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(company.id)}
                      title="Sil"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şirketi Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem şirketi pasif hale getirecektir. Şirket verisi silinmez, sadece is_active = false olarak işaretlenir.
              Gerektiğinde şirketi tekrar aktif hale getirebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Companies;
