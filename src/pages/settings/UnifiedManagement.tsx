import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Workflow, Plus, Loader2, Receipt, Users2, FileCheck, ShoppingCart, ArrowRight, Calendar } from "lucide-react";
import { UserManagementNew } from "@/components/settings/users/UserManagementNew";
import { RoleManagementPanel } from "@/components/settings/users/RoleManagementPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";
import { WorkflowForm } from "@/components/settings/workflows/WorkflowForm";
import { WorkflowCard } from "@/components/settings/workflows/WorkflowCard";
import { ApprovalWorkflow } from "@/types/approval";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UnifiedManagement() {
  const { userData } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "users");

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") || "users";
    
    // Redirect leave-types tab to the new location
    if (tab === "leave-types") {
      navigate("/employees/leaves?tab=settings&settingsTab=leave-types", { replace: true });
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, navigate]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    if (value !== "users") {
      newParams.set("tab", value);
    } else {
      newParams.delete("tab");
    }
    setSearchParams(newParams, { replace: true });
  };
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | undefined>();
  const { workflows: approvalWorkflows, isLoading: isLoadingWorkflows } = useApprovalWorkflows();

  // Fetch users for RoleManagementPanel
  const { data: users = [] } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          status,
          created_at,
          last_login,
          phone,
          avatar_url,
          employee_id,
          employees!profiles_employee_id_fkey (
            id,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('id, role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles;
    },
    enabled: !!userData?.company_id,
  });

  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setShowWorkflowForm(true);
  };

  const handleCloseWorkflowForm = () => {
    setShowWorkflowForm(false);
    setEditingWorkflow(undefined);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kullanıcı & Çalışan Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Kullanıcı-çalışan eşleşmesi, roller, izinler ve onay süreçlerini tek noktadan yönetin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcı & Çalışan
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roller & Yetkiler
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Onay Süreçleri
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kullanıcı & Çalışan Eşleşmesi */}
        <TabsContent value="users" className="space-y-6">
          <UserManagementNew />
        </TabsContent>

        {/* Tab 2: Roller & Yetkiler */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rol Yönetimi</CardTitle>
              <CardDescription>
                Rolleri tanımlayın ve modül bazlı yetkileri yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleManagementPanel users={users} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Onay Süreçleri */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Onay Süreçleri</h2>
              <p className="text-muted-foreground mt-1">
                Farklı nesne tipleri için hiyerarşik onay süreçlerini yapılandırın
              </p>
            </div>
            <Button onClick={() => setShowWorkflowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Onay Süreci
            </Button>
          </div>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "Harcama Talepleri",
                    description: "Harcama taleplerini görüntüle ve yönet",
                    icon: Receipt,
                    path: "/expense-requests",
                    color: "bg-amber-50 text-amber-600 border-amber-200",
                  },
                  {
                    title: "Organizasyon Şeması",
                    description: "Şirket hiyerarşisini görselleştir",
                    icon: Users2,
                    path: "/organization-chart",
                    color: "bg-blue-50 text-blue-600 border-blue-200",
                  },
                  {
                    title: "Bekleyen Onaylar",
                    description: "Onay bekleyen talepleri görüntüle",
                    icon: FileCheck,
                    path: "/dashboard",
                    color: "bg-purple-50 text-purple-600 border-purple-200",
                  },
                  {
                    title: "Satın Alma Talepleri",
                    description: "Satın alma taleplerini yönet",
                    icon: ShoppingCart,
                    path: "/purchasing/requests",
                    color: "bg-green-50 text-green-600 border-green-200",
                  },
                  {
                    title: "İzin Talepleri",
                    description: "İzin taleplerini görüntüle",
                    icon: Calendar,
                    path: "/employees/leaves",
                    color: "bg-teal-50 text-teal-600 border-teal-200",
                  },
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`p-4 rounded-lg border-2 hover:shadow-md transition-all text-left group ${link.color}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <link.icon className="h-6 w-6" />
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{link.title}</h3>
                    <p className="text-xs opacity-80">{link.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {isLoadingWorkflows ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : approvalWorkflows && approvalWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvalWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={handleEditWorkflow}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Henüz onay süreci tanımlanmamış
                </p>
                <Button onClick={() => setShowWorkflowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Onay Sürecini Oluştur
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Form Dialog */}
      <Dialog open={showWorkflowForm} onOpenChange={handleCloseWorkflowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Onay Sürecini Düzenle" : "Yeni Onay Süreci"}
            </DialogTitle>
          </DialogHeader>
          <WorkflowForm
            workflow={editingWorkflow}
            onSuccess={handleCloseWorkflowForm}
            onCancel={handleCloseWorkflowForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

