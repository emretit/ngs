
import React from "react";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Building, MapPin, FileText, User, Users, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Customer } from "@/types/customer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatPhoneNumber } from "@/utils/phoneFormatter";

interface ContactInfoProps {
  customer: Customer;
  onUpdate?: (updatedCustomer: Customer) => void;
}



export const ContactInfo = ({ customer, onUpdate }: ContactInfoProps) => {
  // Fetch employees for representative display
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "aktif")
        .order("first_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const getRepresentativeName = (repId: string | null) => {
    if (!repId || !employees) return "";
    const employee = employees.find((e) => e.id === repId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "";
  };

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
            {customer.company || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3 h-3 text-primary" />
            <span>Yetkili Kişi</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-blue-500" />
            <span>E-posta</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-green-500" />
            <span>Cep Telefonu</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.mobile_phone ? formatPhoneNumber(customer.mobile_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-orange-500" />
            <span>İş Telefonu</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.office_phone ? formatPhoneNumber(customer.office_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>Temsilci</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {getRepresentativeName(customer.representative) || <span className="text-gray-400 italic">Atanmamış</span>}
          </div>
        </div>

        {/* Vergi Bilgileri - Sadece Kurumsal */}
        {customer.type === 'kurumsal' && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <FileText className="w-3 h-3 text-amber-500" />
                <span>Vergi No</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {customer.tax_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Building className="w-3 h-3 text-amber-600" />
                <span>Vergi Dairesi</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {customer.tax_office || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
          </>
        )}
        
        {/* Adres Bilgileri */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>Ülke</span>
          </div>
          <div className="text-sm font-medium text-gray-900">Türkiye</div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-rose-600" />
            <span>İl</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.city || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-rose-700" />
            <span>İlçe</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.district || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>

        {/* Finansal Bilgiler */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Toplam Bakiye</span>
          </div>
          <div className={`text-sm font-bold ${
            customer.balance > 0 
              ? 'text-emerald-700' 
              : customer.balance < 0 
              ? 'text-red-700' 
              : 'text-gray-700'
          }`}>
            {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY',
              maximumFractionDigits: 0
            }).format(customer.balance)}
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
            }).format(Math.max(0, customer.balance))}
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
            }).format(Math.abs(Math.min(0, customer.balance)))}
          </div>
        </div>

        {/* E-Fatura Bilgileri */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FileText className="w-3 h-3 text-blue-500" />
            <span>E-Fatura Alias</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {customer.einvoice_alias_name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
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
            {customer.address || <span className="text-gray-400 italic">Belirtilmemiş</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};
