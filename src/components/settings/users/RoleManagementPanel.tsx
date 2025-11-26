import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Modül tanımlamaları - Sidebar sırasına göre tam olarak aynı yapı
const MODULE_DEFINITIONS = [
  // 1. Gösterge Paneli
  { key: 'dashboard', label: 'Gösterge Paneli', category: 'Genel', subModules: [] },
  
  // 2. Müşteriler
  { key: 'customers', label: 'Müşteriler', category: 'Müşteri İlişkileri', subModules: [] },
  
  // 3. Tedarikçiler
  { key: 'suppliers', label: 'Tedarikçiler', category: 'Müşteri İlişkileri', subModules: [] },
  
  // 4. Satış Yönetimi
  { 
    key: 'crm', 
    label: 'Satış Yönetimi', 
    category: 'Satış Yönetimi', 
    subModules: [
      { key: 'activities', label: 'Aktiviteler' },
      { key: 'opportunities', label: 'Fırsatlar' },
      { key: 'proposals', label: 'Teklifler' },
      { key: 'orders', label: 'Siparişler' },
      { key: 'deliveries', label: 'Teslimatlar' },
      { key: 'returns', label: 'İadeler' },
    ]
  },
  
  // 5. Satın Alma
  { 
    key: 'purchasing', 
    label: 'Satın Alma', 
    category: 'Satın Alma', 
    subModules: [
      { key: 'purchase-requests', label: 'Talepler' },
      { key: 'purchase-rfqs', label: 'Teklif İst.' },
      { key: 'purchase-orders', label: 'Siparişler' },
      { key: 'purchase-grns', label: 'Teslimatlar' },
      { key: 'vendor-invoices', label: 'Faturalar' },
    ]
  },
  
  // 6. Servis
  { 
    key: 'service', 
    label: 'Servis', 
    category: 'Servis', 
    subModules: [
      { key: 'service-views', label: 'Servis Yönetimi' },
      { key: 'service-work-orders', label: 'İş Emirleri' },
      { key: 'service-assets', label: 'Cihaz Yönetimi' },
      { key: 'service-contracts', label: 'Sözleşmeler' },
      { key: 'service-warranties', label: 'Garanti Takibi' },
      { key: 'service-maintenance', label: 'Bakım Takvimi' },
      { key: 'service-templates', label: 'Servis Şablonları' },
      { key: 'service-sla', label: 'SLA Yönetimi' },
      { key: 'service-performance', label: 'Teknisyen Performansı' },
      { key: 'service-costs', label: 'Maliyet Analizi' },
      { key: 'service-parts', label: 'Parça Yönetimi' },
      { key: 'service-satisfaction', label: 'Müşteri Memnuniyeti' },
      { key: 'service-history', label: 'Servis Geçmişi' },
      { key: 'service-analytics', label: 'Raporlar ve Analitik' },
    ]
  },
  
  // 7. Fatura Yönetimi
  { 
    key: 'invoices', 
    label: 'Fatura Yönetimi', 
    category: 'Fatura Yönetimi', 
    subModules: [
      { key: 'sales-invoices', label: 'Satış Faturaları' },
      { key: 'purchase-invoices', label: 'Alış Faturaları' },
      { key: 'e-invoice', label: 'E-Fatura' },
    ]
  },
  
  // 8. Nakit Akış
  { 
    key: 'cashflow', 
    label: 'Nakit Akış', 
    category: 'Nakit Akış', 
    subModules: [
      { key: 'bank-accounts', label: 'Hesaplar' },
      { key: 'expenses', label: 'Gelirler ve Giderler' },
      { key: 'budget-management', label: 'Bütçe Yönetimi' },
      { key: 'checks-notes', label: 'Çekler ve Senetler' },
      { key: 'loans', label: 'Krediler' },
    ]
  },
  
  // 9. Stok Yönetimi
  { 
    key: 'inventory', 
    label: 'Stok Yönetimi', 
    category: 'Stok Yönetimi', 
    subModules: [
      { key: 'products', label: 'Ürünler' },
      { key: 'transactions', label: 'Stok Hareketleri' },
      { key: 'counts', label: 'Stok Sayımları' },
      { key: 'warehouses', label: 'Depolar' },
      { key: 'production', label: 'Üretim' },
    ]
  },
  
  // 10. Çalışanlar
  { key: 'employees', label: 'Çalışanlar', category: 'İnsan Kaynakları', subModules: [] },
  
  // 11. Araç Yönetimi
  { key: 'vehicles', label: 'Araç Yönetimi', category: 'İnsan Kaynakları', subModules: [] },
  
  // 12. Raporlar
  { key: 'reports', label: 'Raporlar', category: 'Genel', subModules: [] },
  
  // 13. Modül Ağacı
  { key: 'modules-tree', label: 'Modül Ağacı', category: 'Sistem', subModules: [] },
  
  // 14. Ayarlar
  { 
    key: 'settings', 
    label: 'Ayarlar', 
    category: 'Sistem', 
    subModules: [
      { key: 'users', label: 'Kullanıcı Yönetimi' },
      { key: 'subscription', label: 'Abonelik & Faturalama' },
      { key: 'nilvera', label: 'Nilvera E-Fatura' },
      { key: 'system', label: 'Sistem Ayarları' },
      { key: 'pdf-templates', label: 'PDF Şablonları' },
      { key: 'audit-logs', label: 'Denetim Günlüğü' },
    ]
  },
];

// Sadece menü görünürlüğü için access yetkisi kullanılıyor

interface UserWithEmployee {
  id: string;
  user_roles: Array<{
    id: string;
    role: string;
  }>;
}

interface RoleManagementPanelProps {
  users: UserWithEmployee[];
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, any> | null;
  isSystem?: boolean;
}

type RolePermissions = Record<string, Record<string, boolean>>;

export const RoleManagementPanel = ({ users }: RoleManagementPanelProps) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  
  // Sistem admin rol isimleri (bunlar özel işaretlenecek)
  const systemAdminNames = ['admin', 'sistem yöneticisi', 'system admin'];

  // Admin rolü için tüm modülleri görünür yapan helper fonksiyon
  const getAllPermissionsForAdmin = (): RolePermissions => {
    const allPermissions: RolePermissions = {};
    
    MODULE_DEFINITIONS.forEach(module => {
      allPermissions[module.key] = { access: true };
      
      if (module.subModules && module.subModules.length > 0) {
        module.subModules.forEach(subModule => {
          allPermissions[subModule.key] = { access: true };
        });
      }
    });
    
    return allPermissions;
  };

  // Her rol için yetki state'i
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissions>>({});
  // Her modül için açık/kapalı state'i (rol-modül kombinasyonu)
  const [moduleOpenStates, setModuleOpenStates] = useState<Record<string, Record<string, boolean>>>({});

  // Veritabanından rolleri çek: Global (company_id = NULL) + Şirket rolleri
  const { data: dbRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      // Global roller (company_id IS NULL) + Şirket rolleri
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${userData.company_id}`)
        .order('company_id', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  // Rolleri filtrele: Şirket rolleri öncelikli, aynı isimde global roller filtrelenir
  const companyRoles = dbRoles.filter(r => r.company_id && r.company_id === userData?.company_id);
  const globalRoles = dbRoles.filter(r => !r.company_id); // company_id null veya undefined
  const companyRoleNames = new Set(companyRoles.map(r => r.name.toLowerCase()));
  
  // Sadece şirket rolleriyle aynı isimde olmayan global rolleri ekle
  const uniqueGlobalRoles = globalRoles.filter(r => !companyRoleNames.has(r.name.toLowerCase()));
      
  // Şirket rolleri + benzersiz global roller (global roller önce, sonra şirket rolleri)
  const allRoles = [...uniqueGlobalRoles, ...companyRoles];
  
  // Rolleri Role tipine dönüştür
  const displayRoles: Role[] = allRoles.map(dbRole => ({
    id: dbRole.id,
    name: dbRole.name,
    description: dbRole.description,
    permissions: dbRole.permissions,
    isSystem: systemAdminNames.includes(dbRole.name.toLowerCase()) || dbRole.role_type === 'system',
  }));

  // Rolleri yükle ve yetkileri oluştur
  useEffect(() => {
    const permissions: Record<string, RolePermissions> = {};
    
    dbRoles.forEach(role => {
      const isSystemAdmin = systemAdminNames.includes(role.name.toLowerCase());
      
      // Sistem admin rolü için tüm yetkileri true yap
      if (isSystemAdmin) {
        if (role.permissions && typeof role.permissions === 'object' && 'modules' in role.permissions) {
          const dbPermissions = (role.permissions as any).modules || {};
          const allAdminPermissions = getAllPermissionsForAdmin();
          permissions[role.id] = { ...allAdminPermissions, ...dbPermissions };
        } else {
          permissions[role.id] = getAllPermissionsForAdmin();
        }
      } else {
        if (role.permissions && typeof role.permissions === 'object' && 'modules' in role.permissions) {
          permissions[role.id] = (role.permissions as any).modules || {};
        } else {
          permissions[role.id] = {};
        }
      }
    });
    
    setRolePermissions(permissions);
  }, [dbRoles]);

  // Yetki değiştirme
  const togglePermission = (roleId: string, moduleKey: string, permissionKey: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [moduleKey]: {
          ...prev[roleId]?.[moduleKey],
          [permissionKey]: !prev[roleId]?.[moduleKey]?.[permissionKey],
        },
      },
    }));
  };

  // Yetkileri kaydet
  const savePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: RolePermissions }) => {
      if (!userData?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      
      const permissionsData = {
        modules: permissions
      };

      // Doğrudan ID ile güncelle
        const { error } = await supabase
          .from('roles')
          .update({ permissions: permissionsData })
        .eq('id', roleId);

        if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Yetkiler başarıyla kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      toast.error('Yetkiler kaydedilirken hata oluştu: ' + error.message);
    },
  });

  // Helper function to map owner/admin role to Admin for display
  const mapRoleForDisplay = (role: string): string => {
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'owner' || lowerRole === 'admin') {
      return 'Admin';
    }
    return role;
  };

  // Calculate user count per role (including owner as Admin)
  const getRoleUserCount = (roleName: string) => {
    // Count both the role name and owner if roleName is Admin
    if (roleName === 'Admin') {
      return users.filter(u => {
        const userRole = u.user_roles?.[0]?.role || '';
        return userRole.toLowerCase() === 'owner' || userRole === 'Admin' || userRole === 'admin';
      }).length;
    }
    return users.filter(u => u.user_roles?.some(r => r.role === roleName)).length;
  };

  // Modülleri sidebar sırasına göre doğrudan kullan (kategoriler olmadan)
  const sortedModules = MODULE_DEFINITIONS;

  return (
    <>
      <ScrollArea className="h-[600px] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {displayRoles.map((role) => {
            const userCount = getRoleUserCount(role.name);
            const isSystemRole = role.isSystem || false;
            const permissions = rolePermissions[role.id] || {};
            const isSaving = savePermissionsMutation.isPending;

            return (
              <div key={role.id} className="mb-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={role.id} className="border-0">
                    <div className={`bg-white border rounded-lg shadow-sm h-full ${
                      isSystemRole 
                        ? 'border-blue-200 bg-blue-50/50' 
                        : 'border-gray-200'
                    }`}>
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between gap-3 w-full pr-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-md flex-shrink-0 ${
                          isSystemRole 
                            ? 'bg-blue-500' 
                            : 'bg-purple-500'
                        }`}>
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{role.name}</h4>
                            {isSystemRole && (
                              <span className="text-xs text-blue-600 font-medium whitespace-nowrap">Sistem</span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={`border-0 text-xs gap-1.5 font-semibold flex-shrink-0 px-2.5 py-1 ${
                        isSystemRole 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        <Users className="h-3.5 w-3.5" />
                        {userCount}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-3">
                      {/* Modüller - Sidebar sırasına göre, kategoriler olmadan */}
                      <div className="space-y-3">
                            {sortedModules.map((module) => {
                              // Alt modülü olan modüller için akordiyon, olmayanlar için normal checkbox
                              const hasSubModules = module.subModules && module.subModules.length > 0;
                              
                              if (hasSubModules) {
                                // Collapsible yapısı - Checkbox dışarda, modül adı collapsible içinde
                                const moduleStateKey = `${role.id}-${module.key}`;
                                const isOpen = moduleOpenStates[role.id]?.[module.key] || false;
                                
                                return (
                                  <div key={module.key} className="flex items-center justify-between py-2 pr-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <Collapsible 
                                        open={isOpen} 
                                        onOpenChange={(open) => {
                                          setModuleOpenStates(prev => ({
                                            ...prev,
                                            [role.id]: {
                                              ...prev[role.id],
                                              [module.key]: open
                                            }
                                          }));
                                        }} 
                                        className="flex-1"
                                      >
                                        <div className="flex items-center gap-2">
                                          <CollapsibleTrigger asChild>
                                            <button className="py-1 px-0 hover:no-underline flex items-center gap-2 flex-1 text-left">
                                              <span className="text-sm font-medium text-gray-800">
                                                {module.label}
                                              </span>
                                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                          </CollapsibleTrigger>
                                        </div>
                                        <CollapsibleContent className="pt-3 pb-0">
                                          <div className="space-y-2 pl-3">
                                            {module.subModules.map((subModule) => {
                                              const isParentAccessEnabled = permissions[module.key]?.access || false;
                                              return (
                                                <div key={subModule.key} className="flex items-center justify-between pr-2 py-1">
                                                  <span 
                                                    className={`text-xs font-medium ${
                                                      isParentAccessEnabled ? 'text-gray-700' : 'text-gray-400'
                                                    }`}
                                                  >
                                                    {subModule.label}
                                                  </span>
                                                  <Checkbox
                                                    checked={permissions[subModule.key]?.access || false}
                                                    onCheckedChange={() => togglePermission(role.id, subModule.key, 'access')}
                                                    disabled={!isParentAccessEnabled}
                                                    className="h-4 w-4 shrink-0"
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    </div>
                                    <Checkbox
                                      checked={permissions[module.key]?.access || false}
                                      onCheckedChange={() => togglePermission(role.id, module.key, 'access')}
                                      className="h-4 w-4 shrink-0"
                                    />
                                  </div>
                                );
                              } else {
                                // Alt modülü olmayan modüller için normal checkbox
                                return (
                                  <div key={module.key} className="flex items-center justify-between py-2 pr-2">
                                    <span className="text-sm font-medium text-gray-800">
                                      {module.label}
                                    </span>
                                    <Checkbox
                                      checked={permissions[module.key]?.access || false}
                                      onCheckedChange={() => togglePermission(role.id, module.key, 'access')}
                                      className="h-4 w-4 shrink-0"
                                    />
                                  </div>
                                );
                              }
                            })}
                      </div>
                      
                      {/* Kaydet butonu */}
                      <div className="pt-4 border-t mt-4">
                        <Button
                          onClick={() => savePermissionsMutation.mutate({
                            roleId: role.id,
                            permissions: permissions
                          })}
                          disabled={isSaving}
                          size="default"
                          className="w-full h-10 text-sm gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? 'Kaydediliyor...' : 'Yetkileri Kaydet'}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
};
