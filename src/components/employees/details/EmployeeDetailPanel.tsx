import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Employee } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Eye, Maximize, Mail, Phone, Calendar, MapPin, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface EmployeeDetailPanelProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailPanel = ({
  employee,
  isOpen,
  onClose,
}: EmployeeDetailPanelProps) => {
  const navigate = useNavigate();
  
  if (!employee) return null;

  const handleViewDetails = () => {
    navigate(`/employees/${employee.id}`);
    onClose();
  };

  const getStatusColor = (status: string) => {
    return status === "aktif" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getInitials = () => {
    return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] sm:w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl">{employee.first_name} {employee.last_name}</SheetTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleViewDetails}
                title="Tam görünüm"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <SheetDescription>
            {employee.position} - {employee.department}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-start mb-6">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarImage src={employee.avatar_url || undefined} alt={`${employee.first_name} ${employee.last_name}`} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{employee.first_name} {employee.last_name}</h3>
                <p className="text-gray-500">{employee.position}</p>
                <Badge className={`mt-2 ${getStatusColor(employee.status)}`}>
                  {employee.status === "aktif" ? "Aktif" : "Pasif"}
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
                <TabsTrigger value="personal">Kişisel Bilgiler</TabsTrigger>
                <TabsTrigger value="salary">Maaş</TabsTrigger>
                <TabsTrigger value="documents">Belgeler</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">İletişim Bilgileri</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{employee.phone || "-"}</span>
                      </div>
                      {employee.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{employee.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">İş Bilgileri</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Departman</p>
                        <p className="font-medium">{employee.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pozisyon</p>
                        <p className="font-medium">{employee.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">İşe Başlama Tarihi</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(employee.hire_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kimlik/SSN</p>
                        <p className="font-medium">{employee.id_ssn || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Kişisel Bilgiler</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Doğum Tarihi</p>
                        <p className="font-medium">
                          {formatDate(employee.date_of_birth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cinsiyet</p>
                        <p className="font-medium">{employee.gender || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Medeni Durum</p>
                        <p className="font-medium">{employee.marital_status || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ülke</p>
                        <p className="font-medium">{employee.country || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Şehir</p>
                        <p className="font-medium">{employee.city || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">İlçe</p>
                        <p className="font-medium">{employee.district || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Posta Kodu</p>
                        <p className="font-medium">{employee.postal_code || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Acil Durum İletişim</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">İsim</p>
                        <p className="font-medium">{employee.emergency_contact_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefon</p>
                        <p className="font-medium">{employee.emergency_contact_phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">İlişki</p>
                        <p className="font-medium">{employee.emergency_contact_relation || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="salary" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <h4 className="text-gray-500 mb-2">Maaş bilgileri henüz eklenmemiş</h4>
                      <Button variant="outline" size="sm" className="mt-2">
                        Maaş Bilgisi Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <h4 className="text-gray-500 mb-2">Belge henüz eklenmemiş</h4>
                      <Button variant="outline" size="sm" className="mt-2">
                        Belge Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
