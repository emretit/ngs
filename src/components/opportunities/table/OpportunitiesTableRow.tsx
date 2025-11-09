import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit,
  Trash,
  Star
} from "lucide-react";
import { Opportunity } from "@/types/crm";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { OpportunityStatusCell } from "./OpportunityStatusCell";

interface OpportunitiesTableRowProps {
  opportunity: Opportunity;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onStatusChange?: (opportunityId: string, status: string) => void;
}

const OpportunitiesTableRow: React.FC<OpportunitiesTableRowProps> = ({
  opportunity,
  onSelectOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onStatusChange
}) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      return "-";
    }
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currency 
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
      className="h-16 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelectOpportunity(opportunity)}
    >
      <TableCell className="p-4 font-medium">
        <div className="flex items-center space-x-2">
          {opportunity.priority === 'high' && (
            <Star className="h-4 w-4 text-red-500 fill-red-500" />
          )}
          <span title={opportunity.title}>
            {shortenText(opportunity.title, 35)}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="p-4">
        {opportunity.customer ? (
          <div className="flex flex-col space-y-1">
            <span className="font-medium" title={opportunity.customer.name}>
              {shortenText(opportunity.customer.name, 30)}
            </span>
            {opportunity.customer.company && (
              <span className="text-sm text-muted-foreground" title={opportunity.customer.company}>
                {shortenText(opportunity.customer.company, 25)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="p-4 text-center">
        <OpportunityStatusCell 
          status={opportunity.status}
          opportunityId={opportunity.id}
          onStatusChange={onStatusChange}
        />
      </TableCell>
      
      <TableCell className="p-4 text-center font-medium">
        {opportunity.value ? (
          <div className="flex flex-col items-center space-y-1">
            <span>{formatCurrency(opportunity.value, opportunity.currency || 'TRY')}</span>
            {opportunity.currency && (
              <span className="text-xs text-muted-foreground">
                {opportunity.currency === 'TRY' ? '₺' : 
                 opportunity.currency === 'USD' ? '$' : 
                 opportunity.currency === 'EUR' ? '€' : 
                 opportunity.currency === 'GBP' ? '£' : 
                 opportunity.currency}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="p-4 text-center">
        <Badge 
          variant="outline" 
          className={getPriorityColor(opportunity.priority)}
        >
          {getPriorityLabel(opportunity.priority)}
        </Badge>
      </TableCell>
      
      <TableCell className="p-4">
        {opportunity.employee ? (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={opportunity.employee.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {opportunity.employee.first_name?.[0]}
                {opportunity.employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {opportunity.employee.first_name} {opportunity.employee.last_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell className="p-4 text-center text-sm">
        {formatDate(opportunity.expected_close_date)}
      </TableCell>
      
      <TableCell className="p-4 text-center text-sm">
        {formatDate(opportunity.created_at)}
      </TableCell>
      
      <TableCell className="p-4 text-center">
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
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OpportunitiesTableRow;
