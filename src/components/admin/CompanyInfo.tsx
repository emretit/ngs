import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Phone, Globe, MapPin, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  domain?: string;
  address?: string;
  website?: string;
  tax_number?: string;
  tax_office?: string;
  default_currency?: string;
  created_at: string;
  updated_at?: string;
}

interface CompanyInfoProps {
  company: Company;
}

export const CompanyInfo = ({ company }: CompanyInfoProps) => {
  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem icon={<Building2 className="h-4 w-4" />} label="Şirket Adı" value={company.name} />
          <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={company.email} />
          <InfoItem icon={<Phone className="h-4 w-4" />} label="Telefon" value={company.phone} />
          <InfoItem icon={<Globe className="h-4 w-4" />} label="Domain" value={company.domain} />
          <InfoItem icon={<Globe className="h-4 w-4" />} label="Website" value={company.website} />
          <InfoItem icon={<MapPin className="h-4 w-4" />} label="Adres" value={company.address} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vergi ve Diğer Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem icon={<FileText className="h-4 w-4" />} label="Vergi Numarası" value={company.tax_number} />
          <InfoItem icon={<FileText className="h-4 w-4" />} label="Vergi Dairesi" value={company.tax_office} />
          <InfoItem icon={<FileText className="h-4 w-4" />} label="Para Birimi" value={company.default_currency} />
          <InfoItem 
            icon={<Calendar className="h-4 w-4" />} 
            label="Oluşturulma Tarihi" 
            value={format(new Date(company.created_at), 'dd.MM.yyyy HH:mm')} 
          />
          {company.updated_at && (
            <InfoItem 
              icon={<Calendar className="h-4 w-4" />} 
              label="Son Güncelleme" 
              value={format(new Date(company.updated_at), 'dd.MM.yyyy HH:mm')} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
