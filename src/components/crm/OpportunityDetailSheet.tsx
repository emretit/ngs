import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Save, Plus, Phone, Mail, MessageSquare, Calendar, User, Edit2, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Opportunity, OpportunityStatus, opportunityStatusLabels, ContactHistoryItem } from "@/types/crm";
import { crmService } from "@/services/crmService";
import { useEmployeeNames } from "@/hooks/useEmployeeNames";

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityDetailSheet = ({ 
  opportunity, 
  isOpen, 
  onClose 
}: OpportunityDetailSheetProps) => {
  const [currentStatus, setCurrentStatus] = useState<OpportunityStatus | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Opportunity>>({});
  const [contactHistory, setContactHistory] = useState<ContactHistoryItem[]>([]);
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    contact_type: "call" as ContactHistoryItem["contact_type"],
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });
  
  const queryClient = useQueryClient();
  const { employees } = useEmployeeNames();

  // Set the current status when the opportunity changes
  useEffect(() => {
    if (opportunity && opportunity.status !== currentStatus) {
      setCurrentStatus(opportunity.status as OpportunityStatus);
      setEditingValues(opportunity);
      
      // Load contact history
      if (opportunity.contact_history) {
        setContactHistory(Array.isArray(opportunity.contact_history) ? opportunity.contact_history : []);
      }
    }
  }, [opportunity, currentStatus]);

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      data = {} 
    }: { 
      id: string; 
      status?: OpportunityStatus;
      data?: Partial<Opportunity>;
    }) => {
      const updateData = { ...data };
      
      if (status) {
        updateData.status = status;
      }
      
      const { data: updatedOpportunity, error } = await crmService.updateOpportunity(id, updateData);
        
      if (error) throw error;
      
      return { id, status, previousStatus: opportunity?.status };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      if (data.status) {
        toast.success('Durum güncellendi', {
          description: `Fırsat durumu başarıyla güncellendi.`,
          className: "bg-green-50 border-green-200",
        });
      } else {
        toast.success('Fırsat güncellendi', {
          description: `Fırsat başarıyla güncellendi.`,
          className: "bg-green-50 border-green-200",
        });
      }
    },
    onError: (error) => {
      toast.error('Hata', {
        description: 'Fırsat güncellenirken bir hata oluştu',
        className: "bg-gray-50 border-gray-200",
      });
      console.error('Error updating opportunity:', error);
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus as OpportunityStatus);
  };

  const handleSaveStatus = async () => {
    if (!opportunity || !currentStatus || currentStatus === opportunity.status) return;
    
    await updateOpportunityMutation.mutateAsync({
      id: opportunity.id,
      status: currentStatus
    });
  };

  const handleInputChange = (field: keyof Opportunity, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!opportunity) return;
    
    await updateOpportunityMutation.mutateAsync({
      id: opportunity.id,
      data: editingValues
    });
  };


  const handleAddActivity = async () => {
    if (!opportunity || !newActivity.notes.trim()) return;

    const activityToAdd: ContactHistoryItem = {
      id: Date.now().toString(),
      date: newActivity.date,
      contact_type: newActivity.contact_type,
      notes: newActivity.notes,
      employee_id: editingValues.employee_id || undefined,
      employee_name: editingValues.employee_id 
        ? employees?.find(emp => emp.id === editingValues.employee_id)?.first_name + ' ' + employees?.find(emp => emp.id === editingValues.employee_id)?.last_name
        : undefined
    };

    const updatedHistory = [...contactHistory, activityToAdd];
    setContactHistory(updatedHistory);

    try {
      await updateOpportunityMutation.mutateAsync({
        id: opportunity.id,
        data: { contact_history: updatedHistory }
      });

      setNewActivity({
        contact_type: "call",
        notes: "",
        date: new Date().toISOString().split('T')[0]
      });
      setShowNewActivityForm(false);
      toast.success('Aktivite eklendi');
    } catch (error) {
      setContactHistory(contactHistory);
      toast.error('Aktivite eklenirken hata oluştu');
    }
  };

  if (!opportunity) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto border-l border-gray-200 bg-white">
        <SheetHeader className="text-left border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-xl text-gray-900">{opportunity.title}</SheetTitle>
              <div className="flex items-center mt-1 text-muted-foreground">
                <span className="mr-2">
                  {opportunity.customer?.name || "Müşteri atanmamış"}
                </span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {opportunityStatusLabels[opportunity.status]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-4 pt-4 gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2 text-gray-700">Fırsat Durumu</p>
              <Select 
                value={currentStatus || opportunity.status} 
                onValueChange={handleStatusChange}
                disabled={updateOpportunityMutation.isPending}
              >
                <SelectTrigger className="w-full border-gray-200 focus:ring-gray-200">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(opportunityStatusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSaveStatus}
              disabled={updateOpportunityMutation.isPending || currentStatus === opportunity.status}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid grid-cols-4 mb-6 bg-gray-100/50">
            <TabsTrigger 
              value="details"
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              Detaylar
            </TabsTrigger>
            <TabsTrigger 
              value="activities"
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              Aktiviteler
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              Geçmiş
            </TabsTrigger>
            <TabsTrigger 
              value="notes"
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              Notlar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-800">Başlık</Label>
                <Input 
                  value={editingValues.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                />
              </div>
              
              <div>
                <Label className="text-gray-800">Açıklama</Label>
                <Textarea 
                  value={editingValues.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-800">Öncelik</Label>
                  <Select 
                    value={editingValues.priority || opportunity.priority}
                    onValueChange={(val) => handleInputChange("priority", val)}
                  >
                    <SelectTrigger className="border-gray-200 focus:ring-gray-100">
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-800">Tahmini Değer</Label>
                    <Input 
                      type="number" 
                      value={editingValues.value ?? opportunity.value}
                      onChange={(e) => handleInputChange("value", parseFloat(e.target.value))}
                      className="border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                    />
                  </div>
                  <div>
                    <Label className="text-gray-800">Para Birimi</Label>
                    <Select 
                      value={editingValues.currency || opportunity.currency || "TRY"}
                      onValueChange={(val) => handleInputChange("currency", val)}
                    >
                      <SelectTrigger className="border-gray-200 focus:ring-gray-100">
                        <SelectValue />
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
              </div>
              
              <div>
                <Label className="text-gray-800">Beklenen Kapanış Tarihi</Label>
                <Input 
                  type="date" 
                  value={editingValues.expected_close_date?.split('T')[0] || ""}
                  onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
                  className="border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                />
              </div>
              
              <div>
                <Label className="text-gray-800">Sorumlu Kişi</Label>
                <Select 
                  value={editingValues.employee_id || opportunity.employee_id || ""}
                  onValueChange={(val) => handleInputChange("employee_id", val)}
                >
                  <SelectTrigger className="border-gray-200 focus:ring-gray-100">
                    <SelectValue placeholder="Sorumlu kişi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={updateOpportunityMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="activities">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">Aktiviteler</h3>
                <Button 
                  onClick={() => setShowNewActivityForm(!showNewActivityForm)}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Aktivite
                </Button>
              </div>
              
              {showNewActivityForm && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-800">Yeni Aktivite Ekle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-800">Aktivite Türü</Label>
                        <Select 
                          value={newActivity.contact_type}
                          onValueChange={(val: ContactHistoryItem["contact_type"]) => 
                            setNewActivity(prev => ({ ...prev, contact_type: val }))
                          }
                        >
                          <SelectTrigger className="border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Telefon Görüşmesi</SelectItem>
                            <SelectItem value="email">E-posta</SelectItem>
                            <SelectItem value="meeting">Toplantı</SelectItem>
                            <SelectItem value="other">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-800">Tarih</Label>
                        <Input 
                          type="date"
                          value={newActivity.date}
                          onChange={(e) => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                          className="border-gray-200"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-800">Notlar</Label>
                      <Textarea 
                        value={newActivity.notes}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Aktivite detaylarını yazın..."
                        className="border-gray-200"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewActivityForm(false)}
                        className="border-gray-200 text-gray-700"
                      >
                        İptal
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleAddActivity}
                        disabled={!newActivity.notes.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-3">
                {contactHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Henüz aktivite yok</p>
                ) : (
                  contactHistory.map((activity) => (
                    <Card key={activity.id} className="border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            {activity.contact_type === 'call' && <Phone className="h-4 w-4 text-gray-600" />}
                            {activity.contact_type === 'email' && <Mail className="h-4 w-4 text-gray-600" />}
                            {activity.contact_type === 'meeting' && <Calendar className="h-4 w-4 text-gray-600" />}
                            {activity.contact_type === 'other' && <MessageSquare className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="border-gray-200 text-gray-800">
                                  {activity.contact_type === 'call' && 'Telefon'}
                                  {activity.contact_type === 'email' && 'E-posta'}
                                  {activity.contact_type === 'meeting' && 'Toplantı'}
                                  {activity.contact_type === 'other' && 'Diğer'}
                                </Badge>
                                {activity.employee_name && (
                                  <span className="text-sm text-gray-600">
                                    {activity.employee_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {format(new Date(activity.date), 'dd MMM yyyy', { locale: tr })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{activity.notes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Fırsat Geçmişi</h3>
              
              <div className="space-y-3">
                <Card className="border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Fırsat Oluşturuldu</span>
                          <span className="text-sm text-gray-500">
                            {opportunity.created_at && format(new Date(opportunity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {opportunity.title} başlıklı fırsat oluşturuldu
                        </p>
                        {opportunity.employee?.first_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Oluşturan: {opportunity.employee.first_name} {opportunity.employee.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Son Güncelleme</span>
                          <span className="text-sm text-gray-500">
                            {opportunity.updated_at && format(new Date(opportunity.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Mevcut durum: {opportunityStatusLabels[opportunity.status]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {opportunity.customer && (
                  <Card className="border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">Müşteri Bilgileri</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {opportunity.customer.name}
                          </p>
                          {opportunity.customer.email && (
                            <p className="text-xs text-gray-500 mt-1">
                              E-posta: {opportunity.customer.email}
                            </p>
                          )}
                          {opportunity.customer.phone && (
                            <p className="text-xs text-gray-500">
                              Telefon: {opportunity.customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-800">Notlar</Label>
                <Textarea 
                  value={editingValues.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="min-h-[200px] border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={updateOpportunityMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                Notları Kaydet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="flex justify-end pt-4 mt-6 border-t">
          <Button 
            onClick={handleSaveChanges}
            variant="outline" 
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OpportunityDetailSheet;
