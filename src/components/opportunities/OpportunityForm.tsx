import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";

interface OpportunityFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpportunityForm: React.FC<OpportunityFormProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [opportunityTypeToDelete, setOpportunityTypeToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    customer_id: "",
    employee_id: "",
    value: "",
    currency: "TRY",
    status: "new",
    priority: "medium",
    opportunity_type: "general",
    expected_close_date: "",
    description: ""
  });

  const [opportunityTypes, setOpportunityTypes] = useState<Array<{id: number, name: string, display_name: string}>>([]);
  const [editingType, setEditingType] = useState<{id: number, name: string, display_name: string} | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [isAddingType, setIsAddingType] = useState(false);

  // Fırsat tiplerini yükle
  useEffect(() => {
    const fetchOpportunityTypes = async () => {
      const { data, error } = await supabase
        .from('opportunity_types')
        .select('*')
        .order('display_name');
      
      if (data) {
        setOpportunityTypes(data);
        // İlk fırsat tipini varsayılan olarak seç
        if (data.length > 0 && !formData.opportunity_type) {
          setFormData(prev => ({ ...prev, opportunity_type: data[0].name }));
        }
      }
    };
    
    fetchOpportunityTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleEmployeeChange = (value: string) => {
    setFormData(prev => ({ ...prev, employee_id: value }));
  };

  const handleCustomerChange = (customerId: string, customerName: string, companyName: string) => {
    setFormData(prev => ({ ...prev, customer_id: customerId }));
  };

  // Fırsat tipi yönetimi
  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    
    setIsAddingType(true);
    try {
      const { data, error } = await supabase
        .from('opportunity_types')
        .insert({
          name: newTypeName.toLowerCase().replace(/\s+/g, '_'),
          display_name: newTypeName.trim()
        })
        .select()
        .single();
      
      if (data) {
        setOpportunityTypes(prev => [...prev, data]);
        setNewTypeName("");
        // Yeni eklenen tipi otomatik olarak seç
        setFormData(prev => ({ ...prev, opportunity_type: data.name }));
        toast({
          title: "Başarılı",
          description: "Fırsat tipi eklendi ve seçildi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fırsat tipi eklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsAddingType(false);
    }
  };

  const handleEditType = async (id: number, newDisplayName: string) => {
    if (!newDisplayName.trim()) {
      toast({
        title: "Hata",
        description: "Fırsat tipi adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('opportunity_types')
        .update({ display_name: newDisplayName.trim() })
        .eq('id', id);
      
      if (!error) {
        setOpportunityTypes(prev => 
          prev.map(type => 
            type.id === id ? { ...type, display_name: newDisplayName.trim() } : type
          )
        );
        setEditingType(null);
        toast({
          title: "Başarılı",
          description: "Fırsat tipi güncellendi",
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error updating opportunity type:', error);
      toast({
        title: "Hata",
        description: "Fırsat tipi güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      const { error } = await supabase
        .from('opportunity_types')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setOpportunityTypes(prev => prev.filter(type => type.id !== id));
        toast({
          title: "Başarılı",
          description: "Fırsat tipi silindi",
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting opportunity type:', error);
      toast({
        title: "Hata",
        description: "Fırsat tipi silinirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTypeConfirm = async () => {
    if (opportunityTypeToDelete === null) return;
    
    setIsDeleting(true);
    try {
      await handleDeleteType(opportunityTypeToDelete);
      setIsDeleteDialogOpen(false);
      setOpportunityTypeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTypeCancel = () => {
    setIsDeleteDialogOpen(false);
    setOpportunityTypeToDelete(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Hata",
        description: "Fırsat başlığı gereklidir",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      

      const { error } = await supabase
        .from("opportunities")
        .insert({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          opportunity_type: formData.opportunity_type,
          value: formData.value ? parseFloat(formData.value) : 0,
          currency: formData.currency,
          expected_close_date: formData.expected_close_date || null,
          customer_id: formData.customer_id || null,
          employee_id: formData.employee_id || null,
          project_id: '00000000-0000-0000-0000-0000-000000000001'
        });

      if (error) throw error;

      // Refresh opportunities data
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      
      toast({
        title: "Başarılı",
        description: "Yeni fırsat başarıyla oluşturuldu",
      });

      // Reset form and close
      setFormData({
        title: "",
        customer_id: "",
        employee_id: "",
        value: "",
        currency: "TRY",
        status: "new",
        priority: "medium",
        opportunity_type: opportunityTypes.length > 0 ? opportunityTypes[0].name : "general",
        expected_close_date: "",
        description: ""
      });
      onClose();
    } catch (error) {
      console.error("Error creating opportunity:", error);
      toast({
        title: "Hata",
        description: "Fırsat oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (<>
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Fırsat Ekle"
      maxWidth="lg"
      headerColor="blue"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
          {/* Başlık ve Açıklama */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">Fırsat Başlığı *</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Fırsat başlığını girin"
                className="h-8"
                required 
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Açıklama</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Fırsat detaylarını girin"
                rows={2}
                className="resize-none h-8"
              />
            </div>
          </div>

          {/* Müşteri ve Sorumlu Kişi */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <CustomerSelector
                value={formData.customer_id}
                onChange={handleCustomerChange}
                error=""
              />
            </div>
            
            <div className="space-y-1">
              <EmployeeSelector
                value={formData.employee_id}
                onChange={handleEmployeeChange}
                label="Sorumlu Kişi"
                placeholder="Sorumlu kişi seçin..."
                searchPlaceholder="Çalışan ara..."
                noResultsText="Çalışan bulunamadı"
                showLabel={true}
              />
            </div>
          </div>

          {/* Değer ve Para Birimi */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">Tahmini Değer</Label>
              <Input 
                id="value" 
                name="value" 
                type="number" 
                step="0.01"
                value={formData.value} 
                onChange={handleChange} 
                placeholder="0.00"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Para Birimi</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger id="currency" className="h-8">
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Öncelik ve Fırsat Tipi */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Öncelik</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger id="priority" className="h-8">
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="opportunity_type" className="text-sm font-medium text-gray-700">Fırsat Tipi</Label>
              
              <Select 
                value={formData.opportunity_type} 
                onValueChange={(value) => {
                  if (value === "add_custom") {
                    setNewTypeName("");
                  } else {
                    setFormData(prev => ({ ...prev, opportunity_type: value }));
                  }
                }}
              >
                <SelectTrigger id="opportunity_type" className="w-full h-8 bg-background border-border hover:border-primary transition-colors">
                  <SelectValue placeholder="Fırsat tipi seçin" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                  {opportunityTypes.map((type) => (
                    <div key={type.id} className="group relative">
                      {editingType?.id === type.id ? (
                        // Inline editing mode
                        <div className="p-2 space-y-2">
                          <Input
                            placeholder="Fırsat tipi adı"
                            value={editingType.display_name}
                            onChange={(e) => setEditingType({...editingType, display_name: e.target.value})}
                            className="text-sm h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleEditType(editingType.id, editingType.display_name);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingType(null);
                              }
                            }}
                          />
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingType(null);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              İptal
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditType(editingType.id, editingType.display_name);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Normal display mode
                        <SelectItem 
                          value={type.name} 
                          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50 pr-10 transition-colors"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <span className="font-medium text-sm text-foreground">{type.display_name}</span>
                          </div>
                        </SelectItem>
                      )}
                      
                      {/* Edit button positioned outside SelectItem */}
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-muted/50"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingType(type);
                          }}
                        >
                          <Edit size={12} />
                        </Button>
                      </div>
                      
                      {/* Delete button positioned outside SelectItem */}
                      <div className="absolute top-2 right-8 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-100 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpportunityTypeToDelete(type.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add custom option */}
                  <SelectItem value="add_custom" className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 data-[highlighted]:bg-primary/10 p-3 border-t border-border mt-1">
                    <div className="flex items-center gap-1.5">
                      <Plus size={16} className="text-primary" />
                      <span className="text-sm font-medium text-primary">Yeni fırsat tipi ekle</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Custom type input card - rendered outside dropdown */}
              {newTypeName !== "" && (
                <Card className="p-4 border-2 border-dashed border-primary/50 bg-primary/5 mt-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Yeni Fırsat Tipi</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Fırsat tipi adı giriniz..."
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddType();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setNewTypeName("");
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setNewTypeName("")}
                        className="h-8 px-3 text-xs"
                      >
                        İptal
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleAddType}
                        disabled={isAddingType || !newTypeName.trim()}
                        className="h-8 px-3 text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        {isAddingType ? "Ekleniyor..." : "Ekle"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

            </div>
          </div>
          
          {/* Beklenen Kapanış Tarihi */}
          <div className="space-y-1">
            <UnifiedDatePicker
              label="Beklenen Kapanış Tarihi"
              date={formData.expected_close_date ? new Date(formData.expected_close_date + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  // Timezone kaymasını önlemek için yerel tarih formatını kullan
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setFormData(prev => ({ ...prev, expected_close_date: `${year}-${month}-${day}` }));
                } else {
                  setFormData(prev => ({ ...prev, expected_close_date: "" }));
                }
              }}
              placeholder="Tarih seçin"
            />
          </div>
          </div>
        </div>
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={isSubmitting} />
          <UnifiedDialogActionButton
            onClick={() => {}}
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Kaydet
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
    
    {/* Confirmation Dialog */}
    <ConfirmationDialogComponent
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      title="Fırsat Tipini Sil"
      description={`"${opportunityTypeToDelete || 'Bu fırsat tipi'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      confirmText="Sil"
      cancelText="İptal"
      variant="destructive"
      onConfirm={handleDeleteTypeConfirm}
      onCancel={handleDeleteTypeCancel}
      isLoading={isDeleting}
    />
  </> );
};

export default OpportunityForm;