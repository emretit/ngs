
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Proposal, proposalStatusColors, proposalStatusLabels } from "@/types/proposal";
import { 
  Calendar, 
  Building, 
  User, 
  CreditCard, 
  FileText, 
  Maximize2,
  Phone,
  Mail,
  MapPin,
  Award,
  Tag,
  ShieldCheck,
  PenLine
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { calculateProposalTotals, formatProposalAmount } from "@/services/workflow/proposalWorkflow";
import { useNavigate } from "react-router-dom";

interface ProposalDetailSidePanelProps {
  proposal: Proposal;
  onShowFullView: () => void;
}

const ProposalDetailSidePanel = ({ proposal, onShowFullView }: ProposalDetailSidePanelProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const formatMoney = (amount: number) => {
    return formatProposalAmount(amount, proposal.currency);
  };

  // Calculate totals for display
  const totals = proposal.items && proposal.items.length > 0 
    ? calculateProposalTotals(proposal.items)
    : { subtotal: 0, taxAmount: 0, total: proposal.total_amount || 0 };
    
  const handleEditProposal = () => {
    navigate(`/proposal/${proposal.id}/edit`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Teklif Özeti</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShowFullView}
            className="flex items-center"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Tam Görünüm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Teklif No
            </span>
            <span className="font-medium">#{proposal.number}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Müşteri
            </span>
            <span className="font-medium">
              {proposal.customer?.name || proposal.customer_name || "-"}
            </span>
          </div>
          
          {(proposal.customer?.company || proposal.customer?.email || proposal.customer?.phone) && (
            <div className="px-2 py-3 bg-gray-50 rounded-md space-y-2">
              {proposal.customer?.company && (
                <div className="flex items-center text-sm">
                  <Building className="h-3 w-3 mr-2 text-gray-500" />
                  <span>{proposal.customer.company}</span>
                </div>
              )}
              {proposal.customer?.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-2 text-gray-500" />
                  <span>{proposal.customer.email}</span>
                </div>
              )}
              {proposal.customer?.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-3 w-3 mr-2 text-gray-500" />
                  <span>{proposal.customer.phone}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <User className="h-4 w-4 mr-2" />
              Satış Temsilcisi
            </span>
            <span className="font-medium">
              {proposal.employee 
                ? `${proposal.employee.first_name} ${proposal.employee.last_name}` 
                : proposal.employee_name || "-"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Oluşturma Tarihi
            </span>
            <span className="font-medium">{formatDate(proposal.created_at)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Geçerlilik Tarihi
            </span>
            <span className="font-medium">{formatDate(proposal.valid_until)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Toplam Tutar
            </span>
            <span className="font-medium">
              {formatMoney(totals.total)}
            </span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Durum</h3>
          <Badge className={`${proposalStatusColors[proposal.status]} w-full justify-center`}>
            {proposalStatusLabels[proposal.status]}
          </Badge>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Ödeme Şartları
          </h3>
          <p className="text-sm text-muted-foreground">
            {proposal.payment_terms || "Belirtilmemiş"}
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Teslimat Şartları
          </h3>
          <p className="text-sm text-muted-foreground">
            {proposal.delivery_terms || "Belirtilmemiş"}
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Garanti Koşulları
          </h3>
          <p className="text-sm text-muted-foreground">
            {proposal.terms || "Standart garanti koşulları geçerlidir."}
          </p>
        </div>
        
        {proposal.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Açıklama
            </h3>
            <p className="text-sm text-muted-foreground">
              {proposal.description}
            </p>
          </div>
        )}
        
        {proposal.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Notlar</h3>
            <p className="text-sm text-muted-foreground">
              {proposal.notes}
            </p>
          </div>
        )}
        
        <Separator />
        
        <div className="pt-2 space-y-3">
          <div className="text-sm font-medium">Finansal Özet</div>
          <div className="space-y-1 bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam:</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KDV:</span>
              <span>{formatMoney(totals.taxAmount)}</span>
            </div>
            {proposal.discounts && proposal.discounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">İndirim:</span>
                <span className="text-red-600">-{formatMoney(proposal.discounts)}</span>
              </div>
            )}
            {proposal.additional_charges && proposal.additional_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ek Ücretler:</span>
                <span>{formatMoney(proposal.additional_charges)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-red-900">
              <span>Genel Toplam:</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="pt-2 flex space-x-2">
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEditProposal}>
            <PenLine className="h-4 w-4 mr-2" />
            Teklifi Düzenle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalDetailSidePanel;
