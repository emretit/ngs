import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit2,
  Trash2,
  Star,
  MoreHorizontal
} from "lucide-react";
import { Opportunity } from "@/types/crm";
import { OpportunityStatusCell } from "./OpportunityStatusCell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return dateObj.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "-";
    }
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    // Convert TL to TRY directly
    const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
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
          <span className="text-xs font-medium" title={opportunity.title}>
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
          <span className="text-xs font-medium">{formatCurrency(opportunity.value, opportunity.currency || 'TRY')}</span>
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
      
      <TableCell className="py-2 px-3 text-center text-xs font-medium">
        {formatDate(opportunity.expected_close_date)}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center text-xs font-medium">
        {formatDate(opportunity.created_at)}
      </TableCell>
      
      <TableCell className="py-2 px-2">
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
              <Edit2 className="h-4 w-4" />
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
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8"
                title="Daha Fazla"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onStatusChange && (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'new');
                  }}>
                    Yeni Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'meeting_visit');
                  }}>
                    Görüşme ve Ziyaret Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'proposal');
                  }}>
                    Teklif Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'negotiation');
                  }}>
                    Müzakere Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'won');
                  }}>
                    Kazanıldı Yap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(opportunity.id, 'lost');
                  }}>
                    Kaybedildi Yap
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OpportunitiesTableRow;
