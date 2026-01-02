import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceTemplateService, ServiceTemplate } from '@/services/serviceTemplateService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Search, Plus, FileText, TrendingUp, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { ConfirmationDialogComponent } from '@/components/ui/confirmation-dialog';

export const ServiceTemplateLibrary: React.FC = () => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ServiceTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-templates', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      return ServiceTemplateService.getTemplates(userData.company_id);
    },
    enabled: !!userData?.company_id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await ServiceTemplateService.deleteTemplate(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      toast.success('Şablon silindi.');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Şablon silinirken bir hata oluştu.');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
  });

  const handleDeleteClick = (template: ServiceTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!userData?.company_id) throw new Error('Company ID not found');
      return ServiceTemplateService.createServiceFromTemplate(templateId, userData.company_id);
    },
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Servis şablondan oluşturuldu.');
      navigate(`/service/edit/${service.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Servis oluşturulurken bir hata oluştu.');
    },
  });

  const filteredTemplates = templates?.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 text-red-700 bg-red-50';
      case 'high':
        return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'low':
        return 'border-green-500 text-green-700 bg-green-50';
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Servis Şablonları</h3>
              <Badge variant="outline">{templates?.length || 0} şablon</Badge>
            </div>
            <Button
              onClick={() => navigate('/pdf-templates/service/new')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şablon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Şablon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates && filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">{template.name}</p>
                  {template.service_request_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.service_request_description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.service_type && (
                    <Badge variant="outline" className="text-xs">
                      {template.service_type}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(template.service_priority)}`}>
                    {template.service_priority === 'urgent' ? 'Acil' :
                     template.service_priority === 'high' ? 'Yüksek' :
                     template.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                  </Badge>
                  {template.estimated_duration && (
                    <Badge variant="outline" className="text-xs">
                      ~{template.estimated_duration} dk
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{template.usage_count} kullanım</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => createFromTemplateMutation.mutate(template.id)}
                    disabled={createFromTemplateMutation.isPending}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kullan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/pdf-templates/service/edit/${template.id}`)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(template)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz şablon oluşturulmamış'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                onClick={() => navigate('/pdf-templates/service/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Şablonu Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Şablonu Sil"
        description={
          templateToDelete
            ? `"${templateToDelete.name}" şablonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

