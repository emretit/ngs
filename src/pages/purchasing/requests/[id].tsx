import { useParams, useNavigate } from "react-router-dom";
import { usePurchaseRequest, useApprovals, useSubmitPurchaseRequest, useDecideApproval } from "@/hooks/usePurchasing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  converted: "bg-purple-500",
};

const priorityColors = {
  low: "bg-gray-400",
  normal: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

export default function PurchaseRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = usePurchaseRequest(id!);
  const { data: approvals } = useApprovals("purchase_request", id!);
  const submitMutation = useSubmitPurchaseRequest();
  const decideMutation = useDecideApproval();
  const [comment, setComment] = useState("");

  if (isLoading) return <div>Yükleniyor...</div>;
  if (!request) return <div>Talep bulunamadı</div>;

  const handleSubmit = () => {
    submitMutation.mutate(request.id);
  };

  const handleApprove = (approvalId: string) => {
    decideMutation.mutate({ id: approvalId, status: "approved", comment });
  };

  const handleReject = (approvalId: string) => {
    decideMutation.mutate({ id: approvalId, status: "rejected", comment });
  };

  const totalAmount = request.items?.reduce(
    (sum, item) => sum + (item.quantity * (item.estimated_price || 0)), 
    0
  ) || 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma Talebi #{request.request_number}</h1>
          <div className="flex gap-2 mt-2">
            <Badge className={statusColors[request.status]}>
              {request.status === 'draft' ? 'Taslak' :
               request.status === 'submitted' ? 'Onay Bekliyor' :
               request.status === 'approved' ? 'Onaylandı' :
               request.status === 'rejected' ? 'Reddedildi' : 'Siparişe Dönüştürüldü'}
            </Badge>
            <Badge className={priorityColors[request.priority]}>
              {request.priority === 'low' ? 'Düşük' :
               request.priority === 'normal' ? 'Normal' :
               request.priority === 'high' ? 'Yüksek' : 'Acil'}
            </Badge>
          </div>
        </div>
        {request.status === 'draft' && (
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
            <Send className="h-4 w-4 mr-2" />
            Onaya Gönder
          </Button>
        )}
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
                    {request.requester?.first_name} {request.requester?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departman</p>
                  <p className="font-medium">{request.department?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">İhtiyaç Tarihi</p>
                  <p className="font-medium">{request.need_by_date || "-"}</p>
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
                    <p>{request.requester_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kalemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.items?.map((item, index) => (
                  <div key={item.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        {item.product && (
                          <p className="text-sm text-muted-foreground">
                            {item.product.code} - {item.product.name}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} {item.uom}
                        </p>
                        {item.estimated_price && (
                          <p className="text-sm text-muted-foreground">
                            ₺{item.estimated_price.toFixed(2)} / birim
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold">
                <span>Toplam Tahmini Tutar</span>
                <span>₺{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Onay Süreci</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals && approvals.length > 0 ? (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">Seviye {approval.step}</p>
                        <Badge
                          className={
                            approval.status === "approved"
                              ? "bg-green-500"
                              : approval.status === "rejected"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }
                        >
                          {approval.status === "approved"
                            ? "Onaylandı"
                            : approval.status === "rejected"
                            ? "Reddedildi"
                            : "Bekliyor"}
                        </Badge>
                      </div>
                      {approval.approver && (
                        <p className="text-sm text-muted-foreground">
                          {approval.approver.first_name} {approval.approver.last_name}
                        </p>
                      )}
                      {approval.decided_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(approval.decided_at).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                      {approval.comment && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">{approval.comment}</p>
                      )}
                      {approval.status === "pending" && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Yorum (opsiyonel)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(approval.id)}
                              disabled={decideMutation.isPending}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(approval.id)}
                              disabled={decideMutation.isPending}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reddet
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz onay süreci başlatılmadı</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
