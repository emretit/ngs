
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Proposal, proposalStatusColors, proposalStatusLabels } from "@/types/proposal";
import { 
  Calendar, 
  Building, 
  User, 
  CreditCard, 
  FileText, 
  Phone,
  Mail,
  MapPin,
  Award,
  Tag,
  ShieldCheck,
  PenLine,
  Save,
  Plus,
  CheckCircle2,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { calculateProposalTotals, formatProposalAmount } from "@/services/workflow/proposalWorkflow";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProposalDetailSidePanelProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProposalDetailSidePanel = ({ proposal, isOpen, onClose }: ProposalDetailSidePanelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingValues, setEditingValues] = useState<Partial<Proposal>>({});
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    contact_type: "call" as const,
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });
  
  // Proposal değiştiğinde state'leri güncelle
  useEffect(() => {
    if (proposal) {
      setEditingValues(proposal);
    }
  }, [proposal]);
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const formatMoney = (amount: number) => {
    return formatProposalAmount(amount, proposal?.currency || 'TRY');
  };

  const updateProposalMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data = {} 
    }: { 
      id: string; 
      data?: Partial<Proposal>;
    }) => {
      const { data: updatedProposal, error } = await supabase
        .from("proposals")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Teklif başarıyla güncellendi");
    },
    onError: (error) => {
      console.error("Error updating proposal:", error);
      toast.error("Teklif güncellenirken bir hata oluştu");
    }
  });

  const handleSaveChanges = async () => {
    if (!proposal) return;
    
    await updateProposalMutation.mutateAsync({
      id: proposal.id,
      data: editingValues
    });
  };

  const handleInputChange = (field: keyof Proposal, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  const handleEditProposal = () => {
    if (proposal) {
      navigate(`/proposal/${proposal.id}/edit`);
      onClose();
    }
  };

  if (!proposal) return null;

  // Calculate totals for display
  const totals = proposal.items && proposal.items.length > 0 
    ? calculateProposalTotals(proposal.items)
    : { subtotal: 0, taxAmount: 0, total: proposal.total_amount || 0 };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto border-l border-gray-200 bg-white">
        <SheetHeader className="text-left border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-xl text-gray-900">#{proposal.number}</SheetTitle>
              <div className="flex items-center mt-1 text-muted-foreground">
                <span className="mr-2">
                  {proposal.customer?.name || proposal.customer_name || "Müşteri atanmamış"}
                </span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {proposalStatusLabels[proposal.status]}
                </span>
              </div>
            </div>
          <Button 
            variant="outline" 
            size="sm" 
              onClick={handleEditProposal}
              className="ml-auto"
          >
              <Edit2 className="mr-2 h-4 w-4" />
              Düzenle
          </Button>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid grid-cols-3 mb-6 bg-gray-100/50">
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
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-800">Teklif No</Label>
                <Input 
                  value={editingValues.number || ""}
                  onChange={(e) => handleInputChange("number", e.target.value)}
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
                  <Label className="text-gray-800">Durum</Label>
                  <Select 
                    value={editingValues.status || proposal.status}
                    onValueChange={(val) => handleInputChange("status", val)}
                  >
                    <SelectTrigger className="border-gray-200 focus:ring-gray-100">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Taslak</SelectItem>
                      <SelectItem value="sent">Gönderildi</SelectItem>
                      <SelectItem value="accepted">Kabul Edildi</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-800">Geçerlilik Tarihi</Label>
                  <Input 
                    type="date" 
                    value={editingValues.valid_until?.split('T')[0] || ""}
                    onChange={(e) => handleInputChange("valid_until", e.target.value)}
                    className="border-gray-200 focus:border-gray-300 focus:ring-gray-100" 
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-800">Toplam Tutar</Label>
                <div className="text-2xl font-bold text-gray-900">
                  {formatMoney(totals.total)}
                </div>
          </div>
          
              {/* Müşteri Bilgileri Kartı */}
          {(proposal.customer?.company || proposal.customer?.email || proposal.customer?.phone) && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-800">Müşteri Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
              {proposal.customer?.company && (
                <div className="flex items-center text-sm">
                        <Building className="h-3 w-3 mr-2 text-gray-600" />
                  <span>{proposal.customer.company}</span>
                </div>
              )}
              {proposal.customer?.email && (
                <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-gray-600" />
                  <span>{proposal.customer.email}</span>
                </div>
              )}
              {proposal.customer?.phone && (
                <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-gray-600" />
                  <span>{proposal.customer.phone}</span>
                </div>
              )}
                  </CardContent>
                </Card>
              )}

              {/* Finansal Özet */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-800">Finansal Özet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam:</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KDV:</span>
              <span>{formatMoney(totals.taxAmount)}</span>
            </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Genel Toplam:</span>
                    <span>{formatMoney(totals.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={updateProposalMutation.isPending}
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
                          onValueChange={(val) => 
                            setNewActivity(prev => ({ ...prev, contact_type: val as any }))
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
                        onClick={() => {/* Handle add activity */}}
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
                <p className="text-center text-gray-500 py-4">Henüz aktivite yok</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Teklif Geçmişi</h3>
              
              <div className="space-y-3">
                <Card className="border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Teklif Oluşturuldu</span>
                          <span className="text-sm text-gray-500">
                            {proposal.created_at && format(new Date(proposal.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          #{proposal.number} numaralı teklif oluşturuldu
                        </p>
          </div>
        </div>
                  </CardContent>
                </Card>
                
                {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
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
                              {format(new Date(proposal.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Mevcut durum: {proposalStatusLabels[proposal.status]}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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

export default ProposalDetailSidePanel;
