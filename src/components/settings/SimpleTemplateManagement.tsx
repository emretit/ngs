import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Copy, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SimpleTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  created_at?: string;
}

export const SimpleTemplateManagement: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SimpleTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    content: ""
  });

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['simple-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('id, name, description, template_type, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        content: item.template_type || 'standard',
        created_at: item.created_at
      })) || [];
    }
  });

  // Create template
  const createMutation = useMutation({
    mutationFn: async (template: Omit<SimpleTemplate, 'id'>) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .insert({
          name: template.name,
          description: template.description,
          template_type: template.content,
          template_features: [],
          items: [],
          design_settings: null,
          prefilled_fields: {},
          popularity: 4.0,
          estimated_time: '5 dk',
          usage_count: '0',
          is_recommended: false,
          tags: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-templates'] });
      toast.success('Şablon başarıyla oluşturuldu');
      setIsCreateOpen(false);
      setNewTemplate({ name: "", description: "", content: "" });
    },
    onError: () => {
      toast.error('Şablon oluşturulurken hata oluştu');
    }
  });

  // Update template
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...template }: SimpleTemplate) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .update({
          name: template.name,
          description: template.description,
          template_type: template.content
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-templates'] });
      toast.success('Şablon başarıyla güncellendi');
      setIsEditOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Şablon güncellenirken hata oluştu');
    }
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-templates'] });
      toast.success('Şablon başarıyla silindi');
    },
    onError: () => {
      toast.error('Şablon silinirken hata oluştu');
    }
  });

  const handleCreate = () => {
    if (!newTemplate.name.trim()) {
      toast.error('Şablon adı gereklidir');
      return;
    }
    createMutation.mutate(newTemplate);
  };

  const handleEdit = (template: SimpleTemplate) => {
    setEditingTemplate(template);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTemplate?.name.trim()) {
      toast.error('Şablon adı gereklidir');
      return;
    }
    updateMutation.mutate(editingTemplate);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (template: SimpleTemplate) => {
    const duplicated = {
      name: `${template.name} (Kopya)`,
      description: template.description,
      content: template.content
    };
    createMutation.mutate(duplicated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Şablonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Teklif Şablonları</h2>
          <p className="text-muted-foreground">Basit ve kullanışlı şablon yönetimi</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şablon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir teklif şablonu oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Şablon Adı</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Örn: Standart Teklif Şablonu"
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Bu şablonun ne için kullanıldığını açıklayın"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">Şablon Türü</Label>
                <Input
                  id="content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Örn: standard, modern, minimal"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description || 'Açıklama bulunmuyor'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>Tür: {template.content}</span>
                <span>
                  {template.created_at 
                    ? new Date(template.created_at).toLocaleDateString('tr-TR')
                    : 'Tarih yok'
                  }
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Henüz şablon yok</h3>
          <p className="text-muted-foreground mb-6">
            İlk şablonunuzu oluşturarak başlayın
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk Şablonu Oluştur
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu Düzenle</DialogTitle>
            <DialogDescription>
              Şablon bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Şablon Adı</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Şablon Türü</Label>
                <Input
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};