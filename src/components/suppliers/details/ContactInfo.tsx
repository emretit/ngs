import React from "react";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Building, MapPin, FileText, User, Users, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Supplier } from "@/types/supplier";
import { formatPhoneNumber } from "@/utils/phoneFormatter";

interface ContactInfoProps {
  supplier: Supplier;
  onUpdate?: (updatedSupplier: Supplier) => void;
}

export const ContactInfo = ({ supplier, onUpdate }: ContactInfoProps) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-background to-muted/20 border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded">
          <User className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Genel Bilgiler</h2>
      </div>
      
      {/* Tüm Bilgiler Tek Grid'de */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* İletişim Bilgileri */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building className="w-3 h-3 text-purple-500" />
            <span>Şirket</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.company || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3 h-3 text-primary" />
            <span>Yetkili Kişi</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-blue-500" />
            <span>E-posta</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-green-500" />
            <span>Cep Telefonu</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.mobile_phone ? formatPhoneNumber(supplier.mobile_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-orange-500" />
            <span>İş Telefonu</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.office_phone ? formatPhoneNumber(supplier.office_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>Temsilci</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.representative || <span className="text-gray-400 italic">Atanmamış</span>}
          </div>
        </div>

        {/* Vergi Bilgileri - Sadece Kurumsal */}
        {supplier.type === 'kurumsal' && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <FileText className="w-3 h-3 text-amber-500" />
                <span>Vergi No</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {supplier.tax_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Building className="w-3 h-3 text-amber-600" />
                <span>Vergi Dairesi</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {supplier.tax_office || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
          </>
        )}

        {/* Finansal Bilgiler */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Toplam Bakiye</span>
          </div>
          <div className={`text-sm font-bold ${
            supplier.balance > 0 
              ? 'text-emerald-700' 
              : supplier.balance < 0 
              ? 'text-red-700' 
              : 'text-gray-700'
          }`}>
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY',
              maximumFractionDigits: 0
            }).format(supplier.balance)}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Alacak</span>
          </div>
          <div className="text-sm font-bold text-emerald-700">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY',
              maximumFractionDigits: 0
            }).format(Math.max(0, supplier.balance))}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <TrendingDown className="w-3 h-3 text-red-600" />
            <span>Borç</span>
          </div>
          <div className="text-sm font-bold text-red-700">
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY',
              maximumFractionDigits: 0
            }).format(Math.abs(Math.min(0, supplier.balance)))}
          </div>
        </div>
      </div>

      {/* Detaylı Adres - Tam Genişlik */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>Detaylı Adres</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {supplier.address || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};