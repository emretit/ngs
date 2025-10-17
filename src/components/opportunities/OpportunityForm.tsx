import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useEmployeeNames } from "@/hooks/useEmployeeNames";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Building, User, Mail, Phone, Plus, X, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Card, CardContent } from "@/components/ui/card";

interface OpportunityFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpportunityForm: React.FC<OpportunityFormProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { customers, isLoading: customersLoading } = useCustomerSelect();
  const { employees, isLoading: employeesLoading } = useEmployeeNames();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  
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

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    address: ""
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
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

  const handleCustomerSelect = (customerId: string) => {
    setFormData(prev => ({ ...prev, customer_id: customerId }));
    setCustomerPopoverOpen(false);
    setShowNewCustomerForm(false);
  };

  const selectedCustomer = customers?.find(customer => customer.id === formData.customer_id);

  const handleNewCustomerSubmit = async () => {
    
    if (!newCustomerData.company.trim() || !newCustomerData.name.trim()) {
      toast({
        title: "Hata",
        description: "Şirket adı ve iletişim kişisi zorunludur",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCustomer(true);
    
    try {
      const { data: newCustomer, error } = await supabase
        .from("customers")
                     .insert({
               company: newCustomerData.company,
               name: newCustomerData.name,
               email: newCustomerData.email || null,
               mobile_phone: newCustomerData.phone || null,
               city: newCustomerData.city || null,
               address: newCustomerData.address || null,
               type: "kurumsal",
               status: "potansiyel", // Potansiyel müşteri olarak ekle
               balance: 0
             })
        .select()
        .single();

      if (error) throw error;

      // Yeni müşteriyi seç
      setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
      setShowNewCustomerForm(false);
      setCustomerPopoverOpen(false);
      
      // Form'u temizle
      setNewCustomerData({
        company: "",
        name: "",
        email: "",
        phone: "",
        city: "",
        address: ""
      });

      // Customers listesini yenile
      queryClient.invalidateQueries({ queryKey: ["customers-select"] });
      
      toast({
        title: "Başarılı",
        description: "Yeni müşteri eklendi ve seçildi",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Hata",
        description: "Müşteri oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
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
      setCustomerPopoverOpen(false);
      setShowNewCustomerForm(false);
      setNewCustomerData({
        company: "",
        name: "",
        email: "",
        phone: "",
        city: "",
        address: ""
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Yeni Fırsat Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Fırsat Başlığı</Label>
            <Input 
              id="title" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="customer_id">Müşteri</Label>
            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerPopoverOpen}
                  className={cn(
                    "w-full justify-between",
                    !formData.customer_id && "text-muted-foreground"
                  )}
                  disabled={customersLoading}
                >
                  {selectedCustomer
                    ? selectedCustomer.company 
                      ? `${selectedCustomer.name} (${selectedCustomer.company})`
                      : selectedCustomer.name
                    : "Müşteri ara..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Müşteri ara..." />
                  
                  {/* Yeni Müşteri Ekle Bölümü - En Üstte */}
                  <div className="border-b pb-2">
                    {!showNewCustomerForm ? (
                      <CommandItem
                        onSelect={() => setShowNewCustomerForm(true)}
                        className="hover:bg-muted/50 transition-colors cursor-pointer text-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="font-medium">Yeni Müşteri Ekle</span>
                      </CommandItem>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-md space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Yeni Müşteri Bilgileri</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewCustomerForm(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="company" className="text-xs">Şirket Adı *</Label>
                              <Input
                                id="company"
                                name="company"
                                value={newCustomerData.company}
                                onChange={handleNewCustomerChange}
                                placeholder="Şirket adı"
                                className="h-8 text-xs"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="name" className="text-xs">İletişim Kişisi *</Label>
                              <Input
                                id="name"
                                name="name"
                                value={newCustomerData.name}
                                onChange={handleNewCustomerChange}
                                placeholder="Ad soyad"
                                className="h-8 text-xs"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="email" className="text-xs">Email</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={newCustomerData.email}
                                onChange={handleNewCustomerChange}
                                placeholder="email@example.com"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone" className="text-xs">Telefon</Label>
                              <Input
                                id="phone"
                                name="phone"
                                value={newCustomerData.phone}
                                onChange={handleNewCustomerChange}
                                placeholder="05xx xxx xx xx"
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="city" className="text-xs">Şehir</Label>
                              <Input
                                id="city"
                                name="city"
                                value={newCustomerData.city}
                                onChange={handleNewCustomerChange}
                                placeholder="İstanbul"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="address" className="text-xs">Adres</Label>
                              <Input
                                id="address"
                                name="address"
                                value={newCustomerData.address}
                                onChange={handleNewCustomerChange}
                                placeholder="Kısa adres"
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isCreatingCustomer}
                              className="flex-1 h-8 text-xs"
                              onClick={handleNewCustomerSubmit}
                            >
                              {isCreatingCustomer ? "Ekleniyor..." : "Kaydet"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNewCustomerForm(false)}
                              className="h-8 text-xs"
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CommandList>
                    <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      {customers?.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name} ${customer.company || ''}`}
                          onSelect={() => handleCustomerSelect(customer.id)}
                          data-selected={formData.customer_id === customer.id}
                          className="hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground transition-colors cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {customer.company && (
                              <span className="text-sm text-muted-foreground">{customer.company}</span>
                            )}
                            {customer.email && (
                              <span className="text-xs text-muted-foreground">{customer.email}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="value">Tahmini Değer</Label>
              <Input 
                id="value" 
                name="value" 
                type="number" 
                step="0.01"
                value={formData.value} 
                onChange={handleChange} 
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Para Birimi</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger id="currency">
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
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="priority">Öncelik</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger id="priority">
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
            <div>
              <Label htmlFor="opportunity_type">Fırsat Tipi</Label>
              
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
                <SelectTrigger id="opportunity_type" className="w-full bg-background border-border hover:border-primary transition-colors">
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
                    <div className="flex items-center gap-2">
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
                    <div className="flex gap-2 justify-end">
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
          
          <div>
            <Label htmlFor="employee">Sorumlu Kişi</Label>
            
            <Select value={formData.employee_id} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-full bg-background border-border hover:border-primary transition-colors">
                <SelectValue placeholder="Sorumlu kişi seçin" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                {employeesLoading ? (
                  <SelectItem value="" disabled>Yükleniyor...</SelectItem>
                ) : (
                  employees?.map((employee) => (
                    <SelectItem 
                      key={employee.id} 
                      value={employee.id}
                      className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium text-sm text-foreground">{employee.first_name} {employee.last_name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="expected_close_date">Beklenen Kapanış Tarihi</Label>
            <Input 
              id="expected_close_date" 
              name="expected_close_date" 
              type="date" 
              value={formData.expected_close_date} 
              onChange={handleChange} 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3} 
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    
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