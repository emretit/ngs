
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { Proposal, proposalStatusColors, proposalStatusLabels } from "@/types/proposal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ProposalItemsTab } from "./ProposalItemsTab";
import ProposalAttachments from "@/components/proposals/form/ProposalAttachments";

import { toast } from "sonner";

interface ProposalDetailFullViewProps {
  proposal: Proposal;
  isEditMode?: boolean;
  onSave?: (updatedData: Partial<Proposal>) => void;
  saving?: boolean;
}

const ProposalDetailFullView = ({ 
  proposal, 
  isEditMode = false, 
  onSave,
  saving = false
}: ProposalDetailFullViewProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('items');
  const [editedData, setEditedData] = useState<Partial<Proposal>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Initialize edited data with proposal data when edit mode is activated
  useEffect(() => {
    if (isEditMode) {
      setEditedData({
        title: proposal.title,
        description: proposal.description || "",
        valid_until: proposal.valid_until || "",
        payment_terms: proposal.payment_terms || "",
        delivery_terms: proposal.delivery_terms || "",
        notes: proposal.notes || ""
      });
    }
  }, [isEditMode, proposal]);
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: proposal.currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date?: Date) => {
    if (date) {
      setEditedData(prev => ({
        ...prev,
        valid_until: date.toISOString()
      }));
      setDatePickerOpen(false);
    }
  };

  const handleSaveChanges = () => {
    if (onSave) {
      onSave(editedData);
    }
  };



  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Teklif Detayları</CardTitle>
          <div className="flex gap-2">
            {isEditMode && (
              <Button onClick={handleSaveChanges} size="sm" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            )}

          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="items">Teklif Kalemleri</TabsTrigger>
            <TabsTrigger value="details">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="attachments">Ekler</TabsTrigger>
            <TabsTrigger value="history">Tarihçe</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <ProposalItemsTab proposal={proposal} />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposal.customer ? (
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {proposal.customer.name?.substring(0, 1) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 w-full">
                        {isEditMode ? (
                          <Input 
                            name="customer_name"
                            defaultValue={proposal.customer.name || ''} 
                            className="font-medium"
                            placeholder="Müşteri Adı"
                            disabled={true}
                          />
                        ) : (
                          <div className="font-medium">{proposal.customer.name}</div>
                        )}
                        {isEditMode ? (
                          <Input 
                            name="customer_company"
                            defaultValue={proposal.customer.company || ''} 
                            className="text-sm"
                            placeholder="Şirket Adı"
                            disabled={true}
                          />
                        ) : (
                          proposal.customer.company && (
                            <div className="text-sm text-muted-foreground">{proposal.customer.company}</div>
                          )
                        )}
                        {isEditMode ? (
                          <Input 
                            name="customer_email"
                            defaultValue={proposal.customer.email || ''} 
                            className="text-sm"
                            placeholder="E-posta"
                            type="email"
                            disabled={true}
                          />
                        ) : (
                          proposal.customer.email && (
                            <div className="text-sm text-muted-foreground">{proposal.customer.email}</div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      {isEditMode ? (
                        <div className="space-y-2 w-full">
                          <Input placeholder="Müşteri Adı" disabled={true} />
                          <Input placeholder="Şirket Adı" disabled={true} />
                          <Input placeholder="E-posta" type="email" disabled={true} />
                          <Input placeholder="Telefon" disabled={true} />
                        </div>
                      ) : (
                        proposal.customer_name || "Müşteri bilgisi bulunmuyor"
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Teklif Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Teklif No:</span>
                    <span className="font-medium">#{proposal.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Oluşturma Tarihi:</span>
                    <span className="font-medium">{formatDate(proposal.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Geçerlilik Tarihi:</span>
                    {isEditMode ? (
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-[180px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editedData.valid_until 
                              ? formatDate(editedData.valid_until) 
                              : "Tarih seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={editedData.valid_until ? new Date(editedData.valid_until) : undefined}
                            onSelect={handleDateChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="font-medium">{formatDate(proposal.valid_until)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Durum:</span>
                    <Badge className={proposalStatusColors[proposal.status]}>
                      {proposalStatusLabels[proposal.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                    <span className="font-medium">
                      {formatMoney(proposal.total_amount || proposal.total_value || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Teklif Özellikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Ödeme Şartları</h3>
                    {isEditMode ? (
                      <Textarea 
                        name="payment_terms"
                        value={editedData.payment_terms || ""} 
                        onChange={handleInputChange}
                        placeholder="Ödeme şartlarını belirtin"
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {proposal.payment_terms || "Belirtilmemiş"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Teslimat Şartları</h3>
                    {isEditMode ? (
                      <Textarea 
                        name="delivery_terms"
                        value={editedData.delivery_terms || ""} 
                        onChange={handleInputChange}
                        placeholder="Teslimat şartlarını belirtin"
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {proposal.delivery_terms || "Belirtilmemiş"}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Açıklama</h3>
                  {isEditMode ? (
                    <Textarea 
                      name="description"
                      value={editedData.description || ""} 
                      onChange={handleInputChange}
                      placeholder="Teklif açıklaması"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {proposal.description || "Açıklama bulunmuyor"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Notlar</h3>
                  {isEditMode ? (
                    <Textarea 
                      name="notes"
                      value={editedData.notes || ""} 
                      onChange={handleInputChange}
                      placeholder="Ekstra notlar"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {proposal.notes || "Not bulunmuyor"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Satış Temsilcisi</CardTitle>
              </CardHeader>
              <CardContent>
                {proposal.employee ? (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {proposal.employee.first_name?.[0]}
                        {proposal.employee.last_name?.[0]}
                      </AvatarFallback>
                      {proposal.employee.avatar_url && (
                        <AvatarImage src={proposal.employee.avatar_url} />
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {proposal.employee.first_name} {proposal.employee.last_name}
                      </div>
                      {proposal.employee.email && (
                        <div className="text-sm text-muted-foreground">{proposal.employee.email}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {proposal.employee_name || "Temsilci bilgisi bulunmuyor"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <ProposalAttachments files={files} setFiles={setFiles} />
                
                {isEditMode && (
                  <div className="mt-4 flex justify-end">
                    <Button type="button">
                      Dosyaları Kaydet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {proposal.status !== 'draft' ? (
                    <div className="relative pl-6 pb-6 border-l-2 border-gray-200">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                      <div className="mb-1 text-sm">
                        <span className="font-semibold">Durum Değişikliği</span> • 
                        <span className="text-muted-foreground"> {formatDate(proposal.updated_at || proposal.created_at)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Teklif durumu <Badge className={proposalStatusColors[proposal.status]}>{proposalStatusLabels[proposal.status]}</Badge> olarak güncellendi.
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="relative pl-6 border-l-2 border-gray-200">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="mb-1 text-sm">
                      <span className="font-semibold">Teklif Oluşturuldu</span> • 
                      <span className="text-muted-foreground"> {formatDate(proposal.created_at)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Teklif {proposal.employee ? `${proposal.employee.first_name} ${proposal.employee.last_name}` : 'bir kullanıcı'} tarafından oluşturuldu.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {isEditMode && activeTab !== 'attachments' && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalDetailFullView;
