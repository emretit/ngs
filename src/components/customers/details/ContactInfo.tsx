import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Building, MapPin, FileText, User, Users, Globe, Printer, CreditCard, Building2, Clock } from "lucide-react";
import { Customer } from "@/types/customer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatPhoneNumber } from "@/utils/phoneFormatter";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ContactInfoProps {
  customer: Customer;
  onUpdate?: (updatedCustomer: Customer) => void;
}

export const ContactInfo = ({ customer, onUpdate }: ContactInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* İletişim Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building className="w-2.5 h-2.5 text-purple-500" />
                <span>Şirket</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.company || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <User className="w-2.5 h-2.5 text-primary" />
                <span>Yetkili Kişi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Mail className="w-2.5 h-2.5 text-blue-500" />
                <span>E-posta</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-2.5 h-2.5 text-green-500" />
                <span>Cep Telefonu</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.mobile_phone ? formatPhoneNumber(customer.mobile_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-2.5 h-2.5 text-orange-500" />
                <span>İş Telefonu</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.office_phone ? formatPhoneNumber(customer.office_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-2.5 h-2.5 text-indigo-500" />
                <span>Temsilci</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.representative ? getRepresentativeName(customer.representative) : <span className="text-gray-400 italic">Atanmamış</span>}
              </div>
            </div>

            {/* Vergi Bilgileri - Sadece Kurumsal */}
            {customer.type === 'kurumsal' && (
              <>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <FileText className="w-2.5 h-2.5 text-amber-500" />
                    <span>Vergi No</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.tax_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Building className="w-2.5 h-2.5 text-amber-600" />
                    <span>Vergi Dairesi</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.tax_office || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>
              </>
            )}

            {/* Adres Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                <span>Ülke</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.country || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-600" />
                <span>İl</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.city || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-700" />
                <span>İlçe</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.district || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-800" />
                <span>Posta Kodu</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.postal_code || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Detaylı Adres */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                <span>Detaylı Adres</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.address || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Ek İletişim Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Printer className="w-2.5 h-2.5 text-gray-500" />
                <span>Faks</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.fax ? formatPhoneNumber(customer.fax) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Globe className="w-2.5 h-2.5 text-purple-500" />
                <span>Web Sitesi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.website ? (
                  <a 
                    href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {customer.website}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* Finansal Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
                <span>Banka</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.bank_name || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
                <span>IBAN</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.iban || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
                <span>Hesap No</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.account_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Ticaret Sicil ve Mersis */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building2 className="w-2.5 h-2.5 text-amber-600" />
                <span>Ticaret Sicil</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.trade_registry_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building2 className="w-2.5 h-2.5 text-amber-600" />
                <span>MERSIS</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.mersis_number || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* İkinci Yetkili Kişi Bilgileri */}
            {customer.second_contact_name && (
              <>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Users className="w-2.5 h-2.5 text-indigo-600" />
                    <span>İkinci Yetkili</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_contact_name}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Mail className="w-2.5 h-2.5 text-blue-600" />
                    <span>İkinci E-posta</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_contact_email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-2.5 h-2.5 text-green-600" />
                    <span>İkinci Telefon</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_contact_phone ? formatPhoneNumber(customer.second_contact_phone) : <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <User className="w-2.5 h-2.5 text-indigo-600" />
                    <span>İkinci Pozisyon</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_contact_position || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>
              </>
            )}

            {/* İkinci Adres Bilgileri */}
            {customer.second_address && (
              <>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-2.5 h-2.5 text-rose-600" />
                    <span>İkinci Adres</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_address}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-2.5 h-2.5 text-rose-600" />
                    <span>İkinci Şehir</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_city || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-2.5 h-2.5 text-rose-600" />
                    <span>İkinci İlçe</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_district || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-2.5 h-2.5 text-rose-600" />
                    <span>İkinci Ülke</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_country || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-2.5 h-2.5 text-rose-600" />
                    <span>İkinci Posta Kodu</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {customer.second_postal_code || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </div>
                </div>
              </>
            )}

            {/* Şirket Detay Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-2.5 h-2.5 text-blue-500" />
                <span>Kuruluş Tarihi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.establishment_date ? new Date(customer.establishment_date).toLocaleDateString('tr-TR') : <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building className="w-2.5 h-2.5 text-purple-600" />
                <span>Sektör</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.sector || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Users className="w-2.5 h-2.5 text-indigo-600" />
                <span>Müşteri Segmenti</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.customer_segment || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Globe className="w-2.5 h-2.5 text-purple-600" />
                <span>Müşteri Kaynağı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.customer_source || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <FileText className="w-2.5 h-2.5 text-amber-600" />
                <span>Notlar</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.notes || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {/* Pozisyon Bilgileri */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <User className="w-2.5 h-2.5 text-primary" />
                <span>Pozisyon</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {customer.first_contact_position || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};