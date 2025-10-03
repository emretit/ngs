import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Shield, Users, ChevronDown } from "lucide-react";
import { navItems } from "@/components/navbar/nav-config";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Role {
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface CompactRoleManagementProps {
  roles: Role[];
}

export const CompactRoleManagement = ({ roles }: CompactRoleManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Dialog açılış/kapanış işleyicisi
  const handleDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      // Dialog kapandığında state'i temizle
      setNewRole({ name: '', description: '', permissions: [] });
      setEditingRole(null);
    }
  };

  // Yeni rol ekleme mutation'ı
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; description: string; permissions: string[] }) => {
      // Önce kullanıcının company_id'sini al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (!profile?.company_id) {
        throw new Error('Kullanıcının şirket bilgisi bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          company_id: profile.company_id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Rol başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleDialogChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: "Rol oluşturulurken hata oluştu: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Menü yapısını düzleştir
  const getAllMenuItems = () => {
    const items: Array<{ path: string; label: string; parent?: string }> = [];
    
    navItems.forEach((item) => {
      if (item.hasDropdown && item.items) {
        // Ana menü - path'i düzelt (başındaki / kaldır)
        const mainPath = item.path.startsWith('/') ? item.path.substring(1) : item.path;
        items.push({ path: mainPath, label: item.label });
        // Alt menüler
        item.items.forEach((subItem: any) => {
          const subPath = subItem.path.startsWith('/') ? subItem.path.substring(1) : subItem.path;
          items.push({ 
            path: subPath, 
            label: subItem.label,
            parent: item.label 
          });
        });
      } else {
        // Tek menü - path'i düzelt (başındaki / kaldır)
        const mainPath = item.path.startsWith('/') ? item.path.substring(1) : item.path;
        items.push({ path: mainPath, label: item.label });
      }
    });
    
    return items;
  };

  const menuItems = getAllMenuItems();

  const handlePermissionToggle = (path: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(path)
        ? prev.permissions.filter(p => p !== path)
        : [...prev.permissions, path]
    }));
  };

  const handleSelectAll = () => {
    const allPaths = menuItems.map(item => item.path);
    setNewRole(prev => ({
      ...prev,
      permissions: allPaths
    }));
  };

  const handleDeselectAll = () => {
    setNewRole(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const isAllSelected = () => {
    const allPaths = menuItems.map(item => item.path);
    return allPaths.every(path => newRole.permissions.includes(path));
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'sistem yöneticisi': 'bg-purple-50 text-purple-700 border-purple-200',
      'yönetici': 'bg-red-50 text-red-700 border-red-200',
      'satış müdürü': 'bg-blue-50 text-blue-700 border-blue-200',
      'satış temsilcisi': 'bg-green-50 text-green-700 border-green-200',
      'muhasebe': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };
    return colors[roleName.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, string> = {
      'sistem yöneticisi': '🔐',
      'yönetici': '👑',
      'satış müdürü': '👨‍💼',
      'satış temsilcisi': '💼',
      'muhasebe': '💰',
    };
    return icons[roleName.toLowerCase()] || '👤';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Roller & İzinler</h3>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg">Yeni Rol</DialogTitle>
              <DialogDescription className="text-sm">
                Rol bilgilerini girin ve izinleri seçin
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Rol Bilgileri - Kompakt */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="roleName" className="text-xs font-medium">Rol Adı</Label>
                  <Input
                    id="roleName"
                    placeholder="Örn: Satış Müdürü"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="roleDesc" className="text-xs font-medium">Açıklama</Label>
                  <Input
                    id="roleDesc"
                    placeholder="Kısa açıklama"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* İzinler - Kompakt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Erişim İzinleri</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {newRole.permissions.length} seçildi
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleSelectAll}
                      >
                        Tümü
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleDeselectAll}
                      >
                        Temizle
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg max-h-[250px] overflow-y-auto bg-white">
                  <div className="divide-y divide-gray-100">
                    {navItems.map((item, index) => {
                      // Alt menüsü olanlar için accordion
                      if (item.hasDropdown && item.items) {
                        return (
                          <Accordion key={item.path} type="single" collapsible className="w-full">
                            <AccordionItem value={`item-${index}`} className="border-none">
                              <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-blue-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={newRole.permissions.includes(item.path)}
                                    onCheckedChange={() => handlePermissionToggle(item.path)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                </div>
                              </AccordionTrigger>
                              
                              <AccordionContent className="px-0 pb-0">
                                <div className="bg-gray-50/50 border-t border-gray-100">
                                  {item.items.map((subItem: any) => (
                                    <div key={subItem.path} className="flex items-center gap-3 py-2 px-6 hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-b-0">
                                      <Checkbox
                                        checked={newRole.permissions.includes(subItem.path)}
                                        onCheckedChange={() => handlePermissionToggle(subItem.path)}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-600">
                                        {subItem.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        );
                      }
                      
                      // Alt menüsü olmayanlar için basit checkbox
                      return (
                        <div key={item.path} className="flex items-center gap-3 py-3 px-4 hover:bg-blue-50/50 transition-colors">
                          <Checkbox
                            checked={newRole.permissions.includes(item.path)}
                            onCheckedChange={() => handlePermissionToggle(item.path)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                 <Button 
                   size="sm"
                   onClick={() => {
                     if (!newRole.name.trim()) {
                       toast({
                         title: "Hata",
                         description: "Rol adı gereklidir",
                         variant: "destructive",
                       });
                       return;
                     }
                     createRoleMutation.mutate(newRole);
                   }}
                   disabled={createRoleMutation.isPending}
                   className="flex-1"
                 >
                   {createRoleMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                 </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roller Listesi - Kompakt */}
      <div className="grid grid-cols-1 gap-3">
        {roles.map((role) => (
          <Card key={role.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Sol taraf - Rol bilgisi */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg border ${getRoleColor(role.name)}`}>
                    <span className="text-lg">{getRoleIcon(role.name)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold capitalize">{role.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {role.userCount} kullanıcı
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {role.permissions.length} izin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sağ taraf - Aksiyonlar */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingRole(role);
                      setNewRole({
                        name: role.name,
                        description: role.description,
                        permissions: role.permissions,
                      });
                      setIsAddDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompactRoleManagement;
