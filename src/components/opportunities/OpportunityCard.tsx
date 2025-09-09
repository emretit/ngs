
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, FileText, User, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { Opportunity } from "@/types/crm";

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onClick: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onEdit?: (opportunity: Opportunity) => void;
  onDelete?: (opportunity: Opportunity) => void;
  onConvertToProposal?: (opportunity: Opportunity) => void;
  onPlanMeeting?: (opportunity: Opportunity) => void;
}

const OpportunityCard = ({ 
  opportunity, 
  index, 
  onClick, 
  onSelect, 
  isSelected = false,
  onEdit,
  onDelete,
  onConvertToProposal,
  onPlanMeeting
}: OpportunityCardProps) => {
  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };



  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? "opacity-75" : ""}`}
        >
          <Card 
            className={`${isSelected ? "border-primary border" : "border-gray-200"} 
                      hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm`}
            onClick={onClick}
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 line-clamp-2 text-sm flex-1 mr-2">{shortenText(opportunity.title, 30)}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="flex-shrink-0 text-xs" variant="outline">
                    {opportunity.currency && opportunity.currency !== 'TRY' 
                      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: opportunity.currency }).format(opportunity.value)
                      : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(opportunity.value)
                    }
                  </Badge>
                  
                  {/* 3 Nokta Menü */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onEdit && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit(opportunity);
                        }}>
                          <Edit className="mr-2 h-3 w-3" />
                          Düzenle
                        </DropdownMenuItem>
                      )}
                      {onPlanMeeting && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onPlanMeeting(opportunity);
                        }}>
                          <Calendar className="mr-2 h-3 w-3" />
                          Görüşme Planla
                        </DropdownMenuItem>
                      )}
                      {onConvertToProposal && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onConvertToProposal(opportunity);
                        }}>
                          <Target className="mr-2 h-3 w-3" />
                          Teklif Hazırla
                        </DropdownMenuItem>
                      )}

                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(opportunity);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Sil
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {opportunity.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{shortenText(opportunity.description, 40)}</p>
              )}
              
                             {opportunity.expected_close_date && (
                 <div className="flex items-center mt-2 text-xs text-gray-500">
                   <CalendarIcon className="h-3 w-3 mr-1" />
                   <span>{format(new Date(opportunity.expected_close_date), 'dd MMM yyyy')}</span>
                 </div>
               )}
              
              <div className="flex items-center justify-between mt-2">
                <Badge 
                  variant="outline" 
                  className={
                    opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                    opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    opportunity.priority === 'low' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {opportunity.priority === 'high' && 'Yüksek'}
                  {opportunity.priority === 'medium' && 'Orta'}
                  {opportunity.priority === 'low' && 'Düşük'}
                  {!opportunity.priority && '-'}
                </Badge>
                
                {opportunity.employee && (
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {opportunity.employee.first_name} {opportunity.employee.last_name}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default OpportunityCard;
