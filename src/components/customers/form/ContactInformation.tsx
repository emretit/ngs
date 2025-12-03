import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CustomerFormData } from "@/types/customer";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { User, Users } from "lucide-react";

interface ContactInformationProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const ContactInformation = ({ formData, setFormData }: ContactInformationProps) => {
  return (
    <div className="space-y-4">
      {/* Genel Bilgiler Kartı */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardContent className="space-y-3 pt-4 px-4 pb-4">
          {/* Müşteri Tipi ve Durumu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-medium text-gray-700">Müşteri Tipi</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "bireysel" | "kurumsal") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type" className="h-7 text-xs">
                  <SelectValue placeholder="Müşteri tipini seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bireysel">👤 Bireysel</SelectItem>
                  <SelectItem value="kurumsal">🏢 Kurumsal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-medium text-gray-700">Müşteri Durumu</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "aktif" | "pasif" | "potansiyel") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" className="h-7 text-xs">
                  <SelectValue placeholder="Durum seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">✅ Aktif</SelectItem>
                  <SelectItem value="pasif">⏸️ Pasif</SelectItem>
                  <SelectItem value="potansiyel">🎯 Potansiyel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-medium text-gray-700">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.example.com"
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <EmployeeSelector
                value={formData.representative || ""}
                onChange={(value) => setFormData({ ...formData, representative: value })}
                placeholder="Temsilci seçiniz"
                label="Temsilci"
                showLabel={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="office_phone" className="text-xs font-medium text-gray-700">
                İş Telefonu
              </Label>
              <PhoneInput
                id="office_phone"
                value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
                onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fax" className="text-xs font-medium text-gray-700">
                Faks
              </Label>
              <PhoneInput
                id="fax"
                value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
                onChange={(value) => setFormData({ ...formData, fax: getDigitsOnly(value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yetkili Kişiler Kartı */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-2 pt-2.5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            Yetkili Kişiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 px-4 pb-4">
          {/* Birinci Yetkili Kişi */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-600">Birinci Yetkili Kişi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                  Ad Soyad
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Yetkili kişi adı giriniz"
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="first_contact_position" className="text-xs font-medium text-gray-700">
                  Pozisyon
                </Label>
                <Input
                  id="first_contact_position"
                  value={formData.first_contact_position || ""}
                  onChange={(e) => setFormData({ ...formData, first_contact_position: e.target.value })}
                  placeholder="Müdür, Satış Sorumlusu..."
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile_phone" className="text-xs font-medium text-gray-700">
                  Telefon
                </Label>
                <PhoneInput
                  id="mobile_phone"
                  value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
                  onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
                />
              </div>
            </div>
          </div>

          {/* İkinci Yetkili Kişi - Accordion */}
          <div className="pt-3 border-t border-gray-100">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="second-contact" className="border-0">
                <AccordionTrigger className="text-xs font-medium text-gray-600 hover:no-underline py-2">
                  İkinci Yetkili Kişi
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="second_contact_name" className="text-xs font-medium text-gray-700">
                          Ad Soyad
                        </Label>
                        <Input
                          id="second_contact_name"
                          value={formData.second_contact_name}
                          onChange={(e) => setFormData({ ...formData, second_contact_name: e.target.value })}
                          placeholder="İkinci yetkili kişi adı"
                          className="h-7 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="second_contact_position" className="text-xs font-medium text-gray-700">
                          Pozisyon
                        </Label>
                        <Input
                          id="second_contact_position"
                          value={formData.second_contact_position}
                          onChange={(e) => setFormData({ ...formData, second_contact_position: e.target.value })}
                          placeholder="Müdür, Satış Sorumlusu..."
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="second_contact_email" className="text-xs font-medium text-gray-700">
                          E-posta
                        </Label>
                        <Input
                          id="second_contact_email"
                          type="email"
                          value={formData.second_contact_email}
                          onChange={(e) => setFormData({ ...formData, second_contact_email: e.target.value })}
                          placeholder="email@example.com"
                          className="h-7 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="second_contact_phone" className="text-xs font-medium text-gray-700">
                          Telefon
                        </Label>
                        <PhoneInput
                          id="second_contact_phone"
                          value={formData.second_contact_phone ? formatPhoneNumber(formData.second_contact_phone) : ""}
                          onChange={(value) => setFormData({ ...formData, second_contact_phone: getDigitsOnly(value) })}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactInformation;
