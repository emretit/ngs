import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Building, MapPin, FileText, User, Users, Globe, Calendar, CreditCard, Briefcase } from "lucide-react";
import { Employee } from "@/types/employee";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "./utils/formatDate";

interface EmployeeInfoProps {
  employee: Employee;
  onUpdate?: (updatedEmployee: Employee) => void;
}

export const EmployeeInfo = ({ employee, onUpdate }: EmployeeInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 border shadow-sm">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Genel Bilgiler</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isExpanded ? 'Gizle' : 'Göster'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Tüm Bilgiler Tek Grid'de - Daha Kompakt */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* Temel Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <User className="w-2.5 h-2.5 text-primary" />
                <span>Ad Soyad</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.first_name} {employee.last_name}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Briefcase className="w-2.5 h-2.5 text-purple-500" />
                <span>Pozisyon</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.position || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building className="w-2.5 h-2.5 text-indigo-500" />
                <span>Departman</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.department || <span className="text-gray-400 italic">Atanmamış</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-2.5 h-2.5 text-green-500" />
                <span>İşe Giriş</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.hire_date ? formatDate(employee.hire_date) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Mail className="w-2.5 h-2.5 text-blue-500" />
                <span>E-posta</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-2.5 h-2.5 text-green-500" />
                <span>Cep Telefonu</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.phone ? formatPhoneNumber(employee.phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Kişisel Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-2.5 h-2.5 text-purple-500" />
                <span>Doğum Tarihi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.date_of_birth ? formatDate(employee.date_of_birth) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <FileText className="w-2.5 h-2.5 text-amber-500" />
                <span>TC Kimlik</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.id_ssn || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Adres Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                <span>Ülke</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.country || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-600" />
                <span>İl</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.city || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-700" />
                <span>İlçe</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.district || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-800" />
                <span>Posta Kodu</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.postal_code || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Detaylı Adres */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                <span>Detaylı Adres</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.address || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Finansal Bilgiler */}

            {/* Ek Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-2.5 h-2.5 text-indigo-500" />
                <span>Medeni Durum</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.marital_status || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-2.5 h-2.5 text-indigo-500" />
                <span>Cinsiyet</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.gender || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-2.5 h-2.5 text-indigo-500" />
                <span>Acil Durum İletişim</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.emergency_contact_name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-2.5 h-2.5 text-orange-500" />
                <span>Acil Durum Telefon</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {employee.emergency_contact_phone ? formatPhoneNumber(employee.emergency_contact_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
