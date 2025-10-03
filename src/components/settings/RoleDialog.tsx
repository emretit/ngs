import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, ShoppingCart, Package, Wrench, Receipt, TrendingUp, Box, Car, BarChart3, Settings, Crown, UserCog, Calculator, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const MODULE_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, category: 'Genel' },
  { key: 'customers', label: 'Müşteriler', icon: Users, category: 'CRM' },
  { key: 'suppliers', label: 'Tedarikçiler', icon: Briefcase, category: 'CRM' },
  { key: 'proposals', label: 'Teklifler', icon: FileText, category: 'CRM' },
  { key: 'orders', label: 'Siparişler', icon: ShoppingCart, category: 'ERP' },
  { key: 'purchases', label: 'Satın Alma', icon: Package, category: 'ERP' },
  { key: 'service', label: 'Servis', icon: Wrench, category: 'ERP' },
  { key: 'invoices', label: 'Faturalar', icon: Receipt, category: 'ERP' },
  { key: 'cashflow', label: 'Nakit Akış', icon: TrendingUp, category: 'Finans' },
  { key: 'products', label: 'Ürünler', icon: Box, category: 'ERP' },
  { key: 'employees', label: 'Çalışanlar', icon: UserCog, category: 'İK' },
  { key: 'vehicles', label: 'Araçlar', icon: Car, category: 'ERP' },
  { key: 'reports', label: 'Raporlar', icon: BarChart3, category: 'Analiz' },
  { key: 'modules', label: 'Modüller', icon: Package, category: 'Sistem' },
  { key: 'settings', label: 'Ayarlar', icon: Settings, category: 'Sistem' },
];

const ROLE_TEMPLATES = [
  {
    name: 'Sistem Yöneticisi',
    description: 'Tüm yetkilere sahip',
    icon: Crown,
    permissions: Object.fromEntries(
      MODULE_DEFINITIONS.map(m => [m.key, { access: true, create: true, read: true, update: true, delete: true, export: true }])
    ),
  },
  {
    name: 'Satış Müdürü',
    description: 'Satış ve CRM yetkileri',
    icon: Users,
    permissions: {
      dashboard: { access: true, create: false, read: true, update: false, delete: false, export: false },
      customers: { access: true, create: true, read: true, update: true, delete: false, export: true },
      suppliers: { access: true, create: true, read: true, update: true, delete: false, export: true },
      proposals: { access: true, create: true, read: true, update: true, delete: true, export: true },
      orders: { access: true, create: false, read: true, update: false, delete: false, export: true },
      products: { access: true, create: false, read: true, update: false, delete: false, export: true },
      reports: { access: true, create: false, read: true, update: false, delete: false, export: true },
    },
  },
  {
    name: 'Muhasebe',
    description: 'Finans ve fatura işlemleri',
    icon: Calculator,
    permissions: {
      dashboard: { access: true, create: false, read: true, update: false, delete: false, export: false },
      customers: { access: true, create: false, read: true, update: false, delete: false, export: true },
      suppliers: { access: true, create: false, read: true, update: false, delete: false, export: true },
      invoices: { access: true, create: true, read: true, update: true, delete: false, export: true },
      cashflow: { access: true, create: true, read: true, update: true, delete: false, export: true },
      reports: { access: true, create: false, read: true, update: false, delete: false, export: true },
    },
  },
];

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: string;
}

export const RoleDialog = ({ open, onOpenChange, roleId }: RoleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  const applyTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    setRoleName(template.name);
    setDescription(template.description);
    setPermissions(template.permissions);
    setActiveTab("permissions");
    toast({
      title: "Şablon uygulandı",
      description: `${template.name} şablonu yüklendi`,
    });
  };

  const togglePermission = (module: string, permission: 'access' | 'create' | 'read' | 'update' | 'delete' | 'export') => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || { access: false, create: false, read: false, update: false, delete: false, export: false }),
        [permission]: !prev[module]?.[permission],
      }
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast({
        title: "Hata",
        description: "Rol adı gereklidir",
        variant: "destructive",
      });
      return;
    }

    try {
      const roleData = {
        name: roleName,
        description: description || null,
        permissions: { modules: permissions },
        company_id: userData?.company_id,
        role_type: 'custom',
        is_active: true,
      };

      const { error } = await supabase
        .from('roles')
        .insert(roleData);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Rol başarıyla oluşturuldu",
      });

      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onOpenChange(false);
      
      // Reset form
      setRoleName("");
      setDescription("");
      setPermissions({});
      setActiveTab("general");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const modulesByCategory = MODULE_DEFINITIONS.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof MODULE_DEFINITIONS>);

  const enabledModulesCount = Object.values(permissions).filter((p: any) => p?.access).length;
  const totalPermissionsCount = Object.values(permissions).reduce((sum: number, p: any) => {
    if (!p) return sum;
    return sum + Object.values(p).filter(v => v === true).length;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Rol Oluştur</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="permissions">Modül İzinleri</TabsTrigger>
            <TabsTrigger value="summary">Özet</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Rol Adı *</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Örn: Satış Temsilcisi"
                />
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rolün sorumluluklarını açıklayın..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>🎯 Hızlı Başlangıç Şablonları</Label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLE_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={template.name}
                        variant="outline"
                        className="h-auto flex-col items-start p-4 space-y-2"
                        onClick={() => applyTemplate(template)}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            {Object.entries(modulesByCategory).map(([category, modules]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    const modulePerms = permissions[module.key] || {};
                    return (
                      <div key={module.key} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{module.label}</span>
                        </div>
                        <div className="space-y-2">
                          {(['access', 'create', 'read', 'update', 'delete', 'export'] as const).map((perm) => (
                            <div key={perm} className="flex items-center justify-between">
                              <Label htmlFor={`${module.key}-${perm}`} className="text-xs">
                                {perm === 'access' && 'Erişim'}
                                {perm === 'create' && 'Oluştur'}
                                {perm === 'read' && 'Oku'}
                                {perm === 'update' && 'Güncelle'}
                                {perm === 'delete' && 'Sil'}
                                {perm === 'export' && 'Dışa Aktar'}
                              </Label>
                              <Switch
                                id={`${module.key}-${perm}`}
                                checked={modulePerms[perm] || false}
                                onCheckedChange={() => togglePermission(module.key, perm)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Rol Bilgileri</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Rol Adı:</span> {roleName || '-'}</div>
                  <div><span className="text-muted-foreground">Açıklama:</span> {description || '-'}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">İzin Özeti</h3>
                <div className="flex gap-4 text-sm">
                  <Badge variant="secondary">
                    {enabledModulesCount}/{MODULE_DEFINITIONS.length} Modül Erişimi
                  </Badge>
                  <Badge variant="secondary">
                    {totalPermissionsCount} Toplam İzin
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Erişilebilir Modüller</h3>
                <div className="space-y-2">
                  {MODULE_DEFINITIONS.map((module) => {
                    const modulePerms = permissions[module.key];
                    if (!modulePerms?.access) return null;
                    
                    const activePerms = Object.entries(modulePerms)
                      .filter(([key, value]) => key !== 'access' && value === true)
                      .map(([key]) => key);

                    const Icon = module.icon;
                    return (
                      <div key={module.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{module.label}</span>
                        </div>
                        <div className="flex gap-1">
                          {activePerms.map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm === 'create' && 'C'}
                              {perm === 'read' && 'R'}
                              {perm === 'update' && 'U'}
                              {perm === 'delete' && 'D'}
                              {perm === 'export' && 'E'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
