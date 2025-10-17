import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { usePurchaseRequest, useApprovals, useSubmitPurchaseRequest, useConvertPRToRFQ, useConvertPRToPO } from "@/hooks/usePurchasing";
import { formatDate } from "@/lib/utils";
import { PRItemsTab } from "@/components/purchasing/PRItemsTab";
import { PRApprovalsTab } from "@/components/purchasing/PRApprovalsTab";
import { AttachmentsTab } from "@/components/purchasing/AttachmentsTab";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { useState } from "react";

const statusConfig = {
  draft: { label: "Taslak", variant: "secondary" as const },
  submitted: { label: "Onay Bekliyor", variant: "default" as const },
  approved: { label: "Onaylandı", variant: "default" as const },
  rejected: { label: "Reddedildi", variant: "destructive" as const },
  converted: { label: "Dönüştürüldü", variant: "default" as const },
};

const priorityConfig = {
  low: { label: "Düşük", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  high: { label: "Yüksek", variant: "default" as const },
  urgent: { label: "Acil", variant: "destructive" as const },
};

export default function PurchaseRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = usePurchaseRequest(id!);
  const { data: approvals } = useApprovals("purchase_request", id!);
  const submitMutation = useSubmitPurchaseRequest();
  const convertToRFQMutation = useConvertPRToRFQ();
  const convertToPOMutation = useConvertPRToPO();
  
  // Confirmation dialog states
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isConvertToRFQDialogOpen, setIsConvertToRFQDialogOpen] = useState(false);
  const [isConvertToPODialogOpen, setIsConvertToPODialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertingToRFQ, setIsConvertingToRFQ] = useState(false);
  const [isConvertingToPO, setIsConvertingToPO] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  if (!request) {
    return <div className="flex justify-center p-8">Talep bulunamadı</div>;
  }

  const handleSubmitClick = () => {
    setIsSubmitDialogOpen(true);
  };

  const handleSubmitConfirm = async () => {
    setIsSubmitting(true);
    try {
      submitMutation.mutate(request.id);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const handleConvertToRFQClick = () => {
    setIsConvertToRFQDialogOpen(true);
  };

  const handleConvertToRFQConfirm = async () => {
    setIsConvertingToRFQ(true);
    try {
      convertToRFQMutation.mutate(request.id, {
        onSuccess: () => {
          // Prepare query params with PR items
          const items = request.items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            uom: item.uom || 'adet',
            target_price: item.estimated_price,
          }));
          
          navigate(`/purchase-rfqs/new?pr_id=${request.id}`, { 
            state: { prItems: items } 
          });
        },
      });
    } catch (error) {
      console.error('Error converting to RFQ:', error);
    } finally {
      setIsConvertingToRFQ(false);
      setIsConvertToRFQDialogOpen(false);
    }
  };

  const handleConvertToPOClick = () => {
    setIsConvertToPODialogOpen(true);
  };

  const handleConvertToPOConfirm = async () => {
    setIsConvertingToPO(true);
    try {
      convertToPOMutation.mutate(request.id, {
        onSuccess: () => {
          // Prepare query params with PR items
          const items = request.items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            uom: item.uom || 'adet',
            unit_price: item.estimated_price || 0,
            tax_rate: 18,
            discount_rate: 0,
          }));
          
          navigate(`/purchase-orders/new?pr_id=${request.id}`, { 
            state: { prItems: items } 
          });
        },
      });
    } catch (error) {
      console.error('Error converting to PO:', error);
    } finally {
      setIsConvertingToPO(false);
      setIsConvertToPODialogOpen(false);
    }
  };

  const estimatedTotal = request.items?.reduce(
    (sum, item) => sum + ((item.estimated_price || 0) * item.quantity),
    0
  ) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-requests")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{request.request_number || "Taslak Talep"}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant={statusConfig[request.status as keyof typeof statusConfig]?.variant}>
                {statusConfig[request.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge variant={priorityConfig[request.priority as keyof typeof priorityConfig]?.variant}>
                {priorityConfig[request.priority as keyof typeof priorityConfig]?.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {request.status === "draft" && (
            <Button onClick={handleSubmitClick} disabled={submitMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Onaya Gönder
            </Button>
          )}
          {request.status === "approved" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleConvertToRFQClick}
                disabled={convertToRFQMutation.isPending}
              >
                RFQ Oluştur
              </Button>
              <Button 
                onClick={handleConvertToPOClick}
                disabled={convertToPOMutation.isPending}
              >
                PO Oluştur
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Talep Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Talep Eden</p>
                  <p className="font-medium">
                    {request.requester ? `${request.requester.first_name} ${request.requester.last_name}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departman</p>
                  <p className="font-medium">{request.department?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">İhtiyaç Tarihi</p>
                  <p className="font-medium">{request.need_by_date ? formatDate(request.need_by_date) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Masraf Merkezi</p>
                  <p className="font-medium">{request.cost_center || "-"}</p>
                </div>
              </div>
              {request.requester_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notlar</p>
                    <p className="text-sm">{request.requester_notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Tahmini Toplam:</span>
                <span className="text-xl font-bold">₺{estimatedTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">
                Kalemler ({request.items?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="approvals">
                Onaylar ({approvals?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="attachments">Ekler</TabsTrigger>
              <TabsTrigger value="history">Geçmiş</TabsTrigger>
            </TabsList>
            <TabsContent value="items">
              <PRItemsTab requestId={request.id} items={request.items || []} isEditable={request.status === "draft"} />
            </TabsContent>
            <TabsContent value="approvals">
              <PRApprovalsTab approvals={approvals || []} />
            </TabsContent>
            <TabsContent value="attachments">
              <AttachmentsTab objectType="purchase_request" objectId={request.id} />
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Geçmiş kayıtları burada görünecek
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Oluşturulma</p>
                <p className="font-medium">{formatDate(request.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Son Güncelleme</p>
                <p className="font-medium">{formatDate(request.updated_at)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kalem</p>
                <p className="font-medium">{request.items?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tahmini Tutar</p>
                <p className="font-medium text-lg">₺{estimatedTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialogComponent
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        title="Talebi Onaya Gönder"
        description="Bu talebi onaya göndermek istediğinizden emin misiniz?"
        confirmText="Gönder"
        cancelText="İptal"
        variant="default"
        onConfirm={handleSubmitConfirm}
        onCancel={() => setIsSubmitDialogOpen(false)}
        isLoading={isSubmitting}
      />

      <ConfirmationDialogComponent
        open={isConvertToRFQDialogOpen}
        onOpenChange={setIsConvertToRFQDialogOpen}
        title="RFQ'ya Dönüştür"
        description="Bu talebi RFQ'ya dönüştürmek istediğinizden emin misiniz?"
        confirmText="Dönüştür"
        cancelText="İptal"
        variant="default"
        onConfirm={handleConvertToRFQConfirm}
        onCancel={() => setIsConvertToRFQDialogOpen(false)}
        isLoading={isConvertingToRFQ}
      />

      <ConfirmationDialogComponent
        open={isConvertToPODialogOpen}
        onOpenChange={setIsConvertToPODialogOpen}
        title="PO'ya Dönüştür"
        description="Bu talebi doğrudan PO'ya dönüştürmek istediğinizden emin misiniz?"
        confirmText="Dönüştür"
        cancelText="İptal"
        variant="default"
        onConfirm={handleConvertToPOConfirm}
        onCancel={() => setIsConvertToPODialogOpen(false)}
        isLoading={isConvertingToPO}
      />
    </div>
  );
}
