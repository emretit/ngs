import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import { useSystemParameters, SystemParameter } from '@/hooks/useSystemParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Download, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmationDialogComponent } from '@/components/ui/confirmation-dialog';

interface SystemParametersManagerProps {
  category?: string;
  title?: string;
}

export const SystemParametersManager: React.FC<SystemParametersManagerProps> = ({
  category,
  title = "Sistem Parametreleri"
}) => {
  const { parameters, loading, error, createParameter, updateParameter, deleteParameter, exportParameters, importParameters, resetToDefaults } = useSystemParameters();
  const { user } = useAuth();
  const [editingParam, setEditingParam] = useState<SystemParameter | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState<SystemParameter | null>(null);
  const [formData, setFormData] = useState({
    parameter_key: '',
    parameter_value: '',
    parameter_type: 'string' as const,
    category: category || 'general',
    description: '',
  });

  // Audit log fonksiyonu
  const logParameterChange = async (
    action: 'create' | 'update' | 'delete',
    parameterKey: string,
    oldValue?: any,
    newValue?: any,
    companyId?: string
  ) => {
    try {
      await supabase.from('audit_logs').insert({
        action: `parameter_${action}`,
        entity_type: 'system_parameter',
        entity_id: parameterKey,
        changes: {
          parameter_key: parameterKey,
          action,
          old_value: oldValue,
          new_value: newValue,
          category: category
        },
        user_id: user?.id,
        company_id: companyId
      });
    } catch (error) {
      logger.error('Audit log error:', error);
    }
  };

  const filteredParameters = category
    ? parameters.filter(p => p.category === category)
    : parameters;

  const handleCreate = async () => {
    try {
      const result = await createParameter(formData);
      if (!result) {
        toast.error('Parametre oluşturulurken hata oluştu');
        return;
      }
      await logParameterChange('create', formData.parameter_key, null, formData.parameter_value, result.company_id);

      setFormData({
        parameter_key: '',
        parameter_value: '',
        parameter_type: 'string',
        category: category || 'general',
        description: '',
      });
      setIsCreateDialogOpen(false);
      toast.success('Parametre başarıyla oluşturuldu');
    } catch (error) {
      logger.error('Error creating parameter:', error);
      toast.error('Parametre oluşturulurken hata oluştu');
    }
  };

  const handleUpdate = async () => {
    if (!editingParam) return;

    const oldValue = editingParam.parameter_value;

    try {
      await updateParameter(editingParam.id, {
        parameter_value: editingParam.parameter_value || '',
        parameter_type: editingParam.parameter_type,
        category: editingParam.category,
        description: editingParam.description || '',
      });

      await logParameterChange('update', editingParam.parameter_key, oldValue, editingParam.parameter_value, editingParam.company_id);

      setEditingParam(null);
      toast.success('Parametre başarıyla güncellendi');
    } catch (error) {
      logger.error('Error updating parameter:', error);
      toast.error('Parametre güncellenirken hata oluştu');
    }
  };

  const handleDelete = (id: string) => {
    const param = parameters.find(p => p.id === id);
    if (!param) return;
    setParameterToDelete(param);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!parameterToDelete) return;

    try {
      await logParameterChange('delete', parameterToDelete.parameter_key, parameterToDelete.parameter_value, null, parameterToDelete.company_id);
      await deleteParameter(parameterToDelete.id);
      toast.success('Parametre başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setParameterToDelete(null);
    } catch (error) {
      logger.error('Error deleting parameter:', error);
      toast.error('Parametre silinirken hata oluştu');
      setIsDeleteDialogOpen(false);
      setParameterToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setParameterToDelete(null);
  };

  const startEditing = (param: SystemParameter) => {
    setEditingParam({ ...param });
  };

  const cancelEditing = () => {
    setEditingParam(null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Hata: {error}</div>;
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      )}
      <div className="flex justify-end gap-1.5 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = exportParameters(category ? [category] : undefined);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `system-parameters-${category || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="h-7 text-[10px] px-2"
          >
            <Download className="h-3 w-3 mr-1" />
            Dışa Aktar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                try {
                  const text = await file.text();
                  await importParameters(text);
                  toast.success('Parametreler başarıyla içe aktarıldı');
                } catch (error) {
                  toast.error('Parametreler içe aktarılırken hata oluştu');
                }
              };
              input.click();
            }}
            className="h-7 text-[10px] px-2"
          >
            <Upload className="h-3 w-3 mr-1" />
            İçe Aktar
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[10px] px-2">
                <Plus className="h-3 w-3 mr-1" />
                Yeni
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-base">Yeni Parametre Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="parameter_key" className="text-xs">Parametre Anahtarı</Label>
                <Input
                  id="parameter_key"
                  value={formData.parameter_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, parameter_key: e.target.value }))}
                  placeholder="örnek: proposal_number_format"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="parameter_value" className="text-xs">Değer</Label>
                <Input
                  id="parameter_value"
                  value={formData.parameter_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, parameter_value: e.target.value }))}
                  placeholder="Parametre değeri"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="parameter_type" className="text-xs">Tip</Label>
                <Select value={formData.parameter_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, parameter_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Metin</SelectItem>
                    <SelectItem value="number">Sayı</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="array">Dizi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!category && (
                <div>
                  <Label htmlFor="category" className="text-xs">Kategori</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Genel</SelectItem>
                      <SelectItem value="formats">Formatlar</SelectItem>
                      <SelectItem value="financial">Finansal</SelectItem>
                      <SelectItem value="workflow">İş Akışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="description" className="text-xs">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Parametre açıklaması"
                  className="text-sm min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button size="sm" onClick={handleCreate}>
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {filteredParameters.map((param) => (
          <div key={param.id} className="p-2.5 border rounded-md bg-white">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium truncate">{param.parameter_key}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{param.category}</Badge>
                    {param.is_system_parameter && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Sistem</Badge>
                    )}
                  </div>
                  {param.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{param.description}</p>
                  )}
                </div>
                {!param.is_system_parameter && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(param)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(param.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {editingParam?.id === param.id ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] mb-1 block">Değer</Label>
                    <Input
                      value={editingParam.parameter_value || ''}
                      onChange={(e) => setEditingParam(prev => prev ? { ...prev, parameter_value: e.target.value } : null)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Tip</Label>
                    <Select
                      value={editingParam.parameter_type}
                      onValueChange={(value: any) => setEditingParam(prev => prev ? { ...prev, parameter_type: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Metin</SelectItem>
                        <SelectItem value="number">Sayı</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="array">Dizi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Açıklama</Label>
                    <Textarea
                      value={editingParam.description || ''}
                      onChange={(e) => setEditingParam(prev => prev ? { ...prev, description: e.target.value } : null)}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Button size="sm" onClick={handleUpdate} className="h-7 text-[10px] px-2">
                      <Save className="h-3 w-3 mr-0.5" />
                      Kaydet
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className="h-7 text-[10px] px-2">
                      <X className="h-3 w-3 mr-0.5" />
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-1.5 rounded-md">
                  <div className="font-mono text-[10px] break-all">
                    {param.parameter_value || <span className="text-muted-foreground">Boş</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredParameters.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          Henüz parametre bulunmuyor.
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Parametreyi Sil"
        description={
          parameterToDelete
            ? `"${parameterToDelete.parameter_key}" parametresini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu parametreyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};