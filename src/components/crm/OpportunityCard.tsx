
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, User } from "lucide-react";
import { Opportunity, opportunityStatusColors, opportunityStatusLabels } from "@/types/crm";
import { formatCurrency } from "@/utils/formatters";

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onClick: () => void;
  isSelected?: boolean;
}

const OpportunityCard = ({ opportunity, index, onClick, isSelected = false }: OpportunityCardProps) => {
  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Firma ismini kısalt
  const getShortenedCompanyName = (companyName: string) => {
    return shortenText(companyName, 18);
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
            className={`${isSelected ? "border-red-500 border-2" : ""} 
                      hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer`}
            onClick={onClick}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 line-clamp-2">{shortenText(opportunity.title, 30)}</h3>
                <Badge className="ml-2 flex-shrink-0" variant="outline">
                  {formatCurrency(opportunity.value)}
                </Badge>
              </div>
              
              {opportunity.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{shortenText(opportunity.description, 40)}</p>
              )}
              
              <div className="flex items-center mt-3 text-xs font-medium text-gray-500">
                {opportunity.expected_close_date && (
                  <div className="flex items-center mr-3">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>{new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}</span>
                  </div>
                )}
                
                {opportunity.customer && (
                  <div className="flex items-center overflow-hidden">
                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate" title={opportunity.customer.name}>
                      {getShortenedCompanyName(opportunity.customer.name)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3">
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
                
                <Badge 
                  variant="outline" 
                  className={opportunityStatusColors[opportunity.status] || 'bg-gray-100 text-gray-800'}
                >
                  {opportunityStatusLabels[opportunity.status]}
                </Badge>
              </div>
              
              {opportunity.employee && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <User className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {opportunity.employee.first_name} {opportunity.employee.last_name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default OpportunityCard;
