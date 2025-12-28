import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Users2, FileCheck, ShoppingCart, Calendar, ArrowRight } from "lucide-react";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";
import { WorkflowForm } from "@/components/settings/workflows/WorkflowForm";
import { WorkflowCard } from "@/components/settings/workflows/WorkflowCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApprovalWorkflow } from "@/types/approval";

export default function ApprovalWorkflowSettings() {
  const navigate = useNavigate();
  const { workflows, isLoading } = useApprovalWorkflows();
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | undefined>();

  const handleEdit = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingWorkflow(undefined);
  };

  const quickLinks = [
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
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onay Süreci Ayarları</h1>
          <p className="text-muted-foreground mt-1">
            Farklı nesne tipleri için onay süreçlerini yapılandırın
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
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
            {quickLinks.map((link) => (
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

      {isLoading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : workflows && workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Henüz onay süreci tanımlanmamış
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Onay Sürecini Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Onay Sürecini Düzenle" : "Yeni Onay Süreci"}
            </DialogTitle>
          </DialogHeader>
          <WorkflowForm
            workflow={editingWorkflow}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

