import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit,
  Trash,
  Star,
  MoreHorizontal,
  FileText,
  Printer,
  Target,
  Calendar
} from "lucide-react";
import { Opportunity } from "@/types/crm";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { OpportunityStatusCell } from "./OpportunityStatusCell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OpportunitiesTableRowProps {
  opportunity: Opportunity;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onStatusChange?: (opportunityId: string, status: string) => void;
  onConvertToProposal?: (opportunity: Opportunity) => void;
}

const OpportunitiesTableRow: React.FC<OpportunitiesTableRowProps> = ({
  opportunity,
  onSelectOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onStatusChange,
  onConvertToProposal
}) => {
  const navigate = useNavigate();
  const [relatedActivities, setRelatedActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Fırsata bağlı tüm aktiviteleri çek (opportunity_id veya related_item_id ile)
  useEffect(() => {
    const fetchRelatedActivities = async () => {
      if (!opportunity.id) return;
      
      setLoadingActivities(true);
      try {
        // Önce opportunity_id ile kontrol et
        let { data: activities1, error: error1 } = await supabase
          .from("activities")
          .select("id, title, status, due_date")
          .eq("opportunity_id", opportunity.id)
          .order("created_at", { ascending: false });

        // related_item_id ve related_item_type ile kontrol et
        const { data: activities2, error: error2 } = await supabase
          .from("activities")
          .select("id, title, status, due_date")
          .eq("related_item_id", opportunity.id)
          .eq("related_item_type", "opportunity")
          .order("created_at", { ascending: false });

        // Her iki sonucu birleştir ve tekrarları kaldır
        const allActivities = [
          ...(activities1 || []),
          ...(activities2 || [])
        ];

        // ID'ye göre tekrarları kaldır
        const uniqueActivities = allActivities.filter((activity, index, self) =>
          index === self.findIndex((a) => a.id === activity.id)
        );

        if ((error1 && error1.code !== 'PGRST116') || (error2 && error2.code !== 'PGRST116')) {
          console.error("Error fetching related activities:", error1 || error2);
        } else {
          setRelatedActivities(uniqueActivities);
        }
      } catch (error) {
        console.error("Error fetching related activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchRelatedActivities();
  }, [opportunity.id]);

  const handleNavigateToActivity = (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation();
    navigate(`/activities?id=${activityId}`);
  };
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const formatCurrency = (amount: number, currency: string = "TL") => {
    // Intl.NumberFormat için geçerli currency code kullan (TL -> TRY)
    const currencyCode = currency === 'TL' ? 'TRY' : currency;
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currencyCode 
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return '-';
    }
  };

  const shortenText = (text: string, maxLength: number = 35) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const handleConvertToProposal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConvertToProposal) {
      onConvertToProposal(opportunity);
    } else {
      // Default behavior: navigate to proposal creation page
      navigate(`/proposals/new?opportunityId=${opportunity.id}`);
      toast.success("Teklif oluşturma sayfasına yönlendiriliyorsunuz");
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement print functionality for opportunities
    toast.info("Yazdırma özelliği yakında eklenecek");
  };

  return (
    <TableRow 
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelectOpportunity(opportunity)}
    >
      <TableCell className="py-2 px-3 font-medium">
        <div className="flex items-center space-x-2">
          {opportunity.priority === 'high' && (
            <Star className="h-3 w-3 text-red-500 fill-red-500" />
          )}
          <span className="text-xs" title={opportunity.title}>
            {shortenText(opportunity.title, 35)}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="py-2 px-3">
        {opportunity.customer ? (
          <div className="flex flex-col space-y-0">
            <span className="text-xs font-medium" title={opportunity.customer.name}>
              {shortenText(opportunity.customer.name, 30)}
            </span>
            {opportunity.customer.company && (
              <span className="text-xs text-muted-foreground" title={opportunity.customer.company}>
                {shortenText(opportunity.customer.company, 25)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center">
        <OpportunityStatusCell 
          status={opportunity.status}
          opportunityId={opportunity.id}
          onStatusChange={onStatusChange}
        />
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center font-medium">
        {opportunity.value ? (
          <div className="flex flex-col items-center space-y-0">
            <span className="text-xs">{formatCurrency(opportunity.value, opportunity.currency || 'TL')}</span>
            {opportunity.currency && (
              <span className="text-xs text-muted-foreground">
                {opportunity.currency === 'TL' ? 'TL' : 
                 opportunity.currency === 'USD' ? '$' : 
                 opportunity.currency === 'EUR' ? '€' : 
                 opportunity.currency === 'GBP' ? '£' : 
                 opportunity.currency}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center">
        <Badge 
          variant="outline" 
          className={getPriorityColor(opportunity.priority)}
        >
          {getPriorityLabel(opportunity.priority)}
        </Badge>
      </TableCell>
      
      <TableCell className="py-2 px-3">
        {opportunity.employee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={opportunity.employee.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {opportunity.employee.first_name?.[0]}
                {opportunity.employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">
              {opportunity.employee.first_name} {opportunity.employee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center text-xs">
        {formatDate(opportunity.expected_close_date)}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center text-xs">
        {formatDate(opportunity.created_at)}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          {onEditOpportunity && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEditOpportunity(opportunity);
              }}
              className="h-8 w-8"
              title="Düzenle"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {onDeleteOpportunity && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOpportunity(opportunity);
              }}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Sil"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8"
                title="İşlemler"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Hızlı İşlemler */}
              <DropdownMenuLabel>Hızlı İşlemler</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleConvertToProposal}
                className="cursor-pointer"
              >
                <Target className="h-4 w-4 mr-2 text-blue-500" />
                <span>Teklif Hazırla</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* İlişkili Öğeler */}
              {relatedActivities.length > 0 && (
                <>
                  <DropdownMenuLabel>İlişkili Aktiviteler</DropdownMenuLabel>
                  {relatedActivities.map((activity) => (
                    <DropdownMenuItem 
                      key={activity.id}
                      onClick={(e) => handleNavigateToActivity(e, activity.id)}
                      className="cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="truncate" title={activity.title}>
                        {activity.title || 'İsimsiz Aktivite'}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Yazdırma */}
              <DropdownMenuLabel>Yazdırma</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handlePrint}
                className="cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-2 text-blue-500" />
                <span>Yazdır</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OpportunitiesTableRow;
