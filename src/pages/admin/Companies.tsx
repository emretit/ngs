import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Plus, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAllCompanies } from "@/hooks/useCompanies";
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
  const navigate = useNavigate();

  const { data: companies, isLoading } = useAllCompanies();

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/companies/${company.id}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Detay
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Companies;
