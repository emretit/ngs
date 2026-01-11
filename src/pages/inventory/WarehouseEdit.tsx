import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateWarehouseData } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Warehouse, MapPin, Phone, User, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { showError } from "@/utils/toastUtils";

const WarehouseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch existing warehouse
  const { data: existingWarehouse, isLoading } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("id", id)
        .eq("company_id", profile?.company_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: "",
    code: "",
    address: "",
    city: "",
    district: "",
    country: "",
    postal_code: "",
    phone: "",
    email: "",
    manager_name: "",
    manager_phone: "",
    manager_email: "",
    warehouse_type: "main",
    is_active: true,
    capacity: undefined,
    capacity_unit: "m²",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when warehouse data is loaded
  useEffect(() => {
    if (existingWarehouse) {
      setFormData({
        name: existingWarehouse.name || "",
        code: existingWarehouse.code || "",
        address: existingWarehouse.address || "",
        city: existingWarehouse.city || "",
        district: existingWarehouse.district || "",
        country: existingWarehouse.country || "",
        postal_code: existingWarehouse.postal_code || "",
        phone: existingWarehouse.phone || "",
        email: existingWarehouse.email || "",
        manager_name: existingWarehouse.manager_name || "",
        manager_phone: existingWarehouse.manager_phone || "",
        manager_email: existingWarehouse.manager_email || "",
        warehouse_type: existingWarehouse.warehouse_type || "main",
        is_active: existingWarehouse.is_active ?? true,
        capacity: existingWarehouse.capacity || undefined,
        capacity_unit: existingWarehouse.capacity_unit || "m²",
        notes: existingWarehouse.notes || "",
      });
    }
  }, [existingWarehouse]);

  const handleInputChange = (field: keyof CreateWarehouseData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    let errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Depo adı zorunludur.";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Geçersiz e-posta formatı.";
    }
    if (formData.manager_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.manager_email)) {
      errors.manager_email = "Geçersiz e-posta formatı.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateWarehouseMutation = useMutation({
    mutationFn: async (updates: Partial<CreateWarehouseData>) => {
      const { error } = await supabase
        .from("warehouses")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depo başarıyla güncellendi!");
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      navigate(`/inventory/warehouses/${id}`);
    },
    onError: (error: any) => {
      toast.error("Depo güncellenirken bir hata oluştu.", {
        description: error.message,
      });
      logger.error("Error updating warehouse:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Lütfen tüm zorunlu alanları doldurun ve hataları düzeltin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateWarehouseMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
          <span className="text-gray-600">Depo bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              onClick={() => navigate(`/inventory/warehouses/${id}`)}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Depo Detayları
            </Button>
            
            {/* Title Section */}
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Depo Düzenle
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Depo bilgilerini düzenle
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top Row - Basic Info & Address */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Temel Bilgiler Card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                      <Warehouse className="h-4 w-4 text-blue-600" />
                    </div>
                    Temel Bilgiler
                  </CardTitle>
                  <div className="ml-4">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Depo Adı - Tam Genişlik */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Depo Adı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Örn: Ana Depo - Merkez"
                    className={`h-7 text-xs ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>

                {/* Depo Kodu ve Tipi - Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-xs font-medium text-gray-700 mb-1.5 block">Depo Kodu</Label>
                    <Input
                      id="code"
                      value={formData.code || ""}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      placeholder="Örn: ANDP-001"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="warehouse_type" className="text-xs font-medium text-gray-700 mb-1.5 block">Depo Tipi</Label>
                    <Select
                      value={formData.warehouse_type || "main"}
                      onValueChange={(value: any) => handleInputChange("warehouse_type", value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Depo tipi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Ana Depo</SelectItem>
                        <SelectItem value="sub">Alt Depo</SelectItem>
                        <SelectItem value="virtual">Sanal Depo</SelectItem>
                        <SelectItem value="transit">Transfer Depo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Durum Göstergesi */}
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs font-medium text-gray-700">
                      {formData.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adres Bilgileri Card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  Adres Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Adres - Tam Genişlik */}
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-medium text-gray-700 mb-1.5 block">Adres</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Tam adres bilgisi"
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                {/* Şehir, İlçe, Posta Kodu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-medium text-gray-700 mb-1.5 block">Şehir</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Şehir"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="district" className="text-xs font-medium text-gray-700 mb-1.5 block">İlçe</Label>
                    <Input
                      id="district"
                      value={formData.district || ""}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      placeholder="İlçe"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="text-xs font-medium text-gray-700 mb-1.5 block">Posta Kodu</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ""}
                      onChange={(e) => handleInputChange("postal_code", e.target.value)}
                      placeholder="34000"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Ülke */}
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-medium text-gray-700 mb-1.5 block">Ülke</Label>
                  <Input
                    id="country"
                    value={formData.country || ""}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Türkiye"
                    className="h-7 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Contact & Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* İletişim Bilgileri Card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                    <Phone className="h-4 w-4 text-orange-600" />
                  </div>
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-1.5 block">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+90 212 123 45 67"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1.5 block">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="depo@example.com"
                      className={`h-7 text-xs ${formErrors.email ? "border-red-500" : ""}`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depo Sorumlusu Card */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  Depo Sorumlusu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="manager_name" className="text-xs font-medium text-gray-700 mb-1.5 block">Ad Soyad</Label>
                    <Input
                      id="manager_name"
                      value={formData.manager_name || ""}
                      onChange={(e) => handleInputChange("manager_name", e.target.value)}
                      placeholder="Ad Soyad"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manager_phone" className="text-xs font-medium text-gray-700 mb-1.5 block">Telefon</Label>
                    <Input
                      id="manager_phone"
                      value={formData.manager_phone || ""}
                      onChange={(e) => handleInputChange("manager_phone", e.target.value)}
                      placeholder="+90 555 123 45 67"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manager_email" className="text-xs font-medium text-gray-700 mb-1.5 block">E-posta</Label>
                    <Input
                      id="manager_email"
                      type="email"
                      value={formData.manager_email || ""}
                      onChange={(e) => handleInputChange("manager_email", e.target.value)}
                      placeholder="sorumlu@example.com"
                      className={`h-7 text-xs ${formErrors.manager_email ? "border-red-500" : ""}`}
                    />
                    {formErrors.manager_email && (
                      <p className="text-xs text-red-500">{formErrors.manager_email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - Additional Info */}
          <Card className="rounded-xl">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
                    <Info className="h-4 w-4 text-indigo-600" />
                  </div>
                  Ek Bilgiler
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Kapasite */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="capacity" className="text-xs font-medium text-gray-700 mb-1.5 block">Kapasite</Label>
                  <div className="flex gap-2">
                    <Input
                      id="capacity"
                      type="number"
                      step="0.01"
                      value={formData.capacity || ""}
                      onChange={(e) => handleInputChange("capacity", e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="1000"
                      className="h-7 text-xs"
                    />
                    <Select
                      value={formData.capacity_unit || "m²"}
                      onValueChange={(value) => handleInputChange("capacity_unit", value)}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="m³">m³</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ton">ton</SelectItem>
                        <SelectItem value="adet">adet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium text-gray-700 mb-1.5 block">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Depo hakkında ek notlar..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default WarehouseEdit;

