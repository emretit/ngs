import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Camera, Save, Building, Mail, Phone, Briefcase } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";

const Profile = () => {
  const { user } = useAuth();
  const { userData, displayName, userInitials, loading: userLoading } = useCurrentUser();
  const { company } = useCompanies();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.full_name?.split(' ')[0] || "",
        last_name: userData.full_name?.split(' ').slice(1).join(' ') || "",
        email: userData.email || user?.email || "",
        phone: userData.phone || "",
        full_name: userData.full_name || "",
        avatar_url: userData.avatar_url || "",
      });
    }
  }, [userData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Lütfen bir resim dosyası seçin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resim boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Eski avatar'ı sil (varsa)
      if (formData.avatar_url) {
        try {
          const urlParts = formData.avatar_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          // employee_avatars bucket'ından silmeyi dene
          await supabase.storage.from('employee_avatars').remove([fileName]);
        } catch (error) {
          // Silme başarısız olsa bile devam et
          console.warn("Could not delete old avatar:", error);
        }
      }

      // Yeni avatar'ı yükle
      const { error: uploadError } = await supabase.storage
        .from('employee_avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('employee_avatars')
        .getPublicUrl(filePath);

      // Profili güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Profil fotoğrafı güncellendi");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Profil fotoğrafı yüklenirken bir hata oluştu");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const full_name = `${formData.first_name} ${formData.last_name}`.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Email değişikliği varsa auth.users'ı güncelle
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          toast.warning("E-posta güncellenemedi. Lütfen geçerli bir e-posta adresi girin.");
        } else {
          // Profil tablosundaki email'i de güncelle
          await supabase
            .from('profiles')
            .update({ email: formData.email })
            .eq('id', user.id);
        }
      }

      toast.success("Profil bilgileri güncellendi");
      setIsEditing(false);
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Profil güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profilim</h1>
            <p className="text-muted-foreground mt-1">
              Hesap bilgilerinizi görüntüleyin ve düzenleyin
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Save className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kişisel Bilgiler
            </CardTitle>
            <CardDescription>
              Temel profil bilgileriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {isUploadingAvatar && (
                <p className="text-sm text-muted-foreground">Yükleniyor...</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ad</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Soyad</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    if (userData) {
                      setFormData({
                        first_name: userData.full_name?.split(' ')[0] || "",
                        last_name: userData.full_name?.split(' ').slice(1).join(' ') || "",
                        email: userData.email || user?.email || "",
                        phone: userData.phone || "",
                        full_name: userData.full_name || "",
                        avatar_url: userData.avatar_url || "",
                      });
                    }
                  }}
                >
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Info Card */}
        {company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Şirket Bilgileri
              </CardTitle>
              <CardDescription>
                Bağlı olduğunuz şirket bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Şirket Adı</Label>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>
                {company.email && (
                  <div>
                    <Label className="text-muted-foreground">E-posta</Label>
                    <p className="text-sm">{company.email}</p>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <Label className="text-muted-foreground">Telefon</Label>
                    <p className="text-sm">{company.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Info Card - Check via user_id in employees table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Çalışan Bilgileri
            </CardTitle>
            <CardDescription>
              Çalışan profilinizle bağlantılı bilgiler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {user?.id ? "Çalışan bilgilerinizi görüntülemek için tıklayın." : "Çalışan bilgisi bulunamadı."}
              </p>
              {user?.id && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { data: employee } = await supabase
                      .from('employees')
                      .select('id')
                      .eq('user_id', user.id)
                      .maybeSingle();
                    
                    if (employee?.id) {
                      window.location.href = `/employees/${employee.id}`;
                    } else {
                      toast.error("Çalışan profili bulunamadı");
                    }
                  }}
                >
                  Çalışan Detaylarına Git
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
