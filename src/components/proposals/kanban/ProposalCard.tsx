
import React from "react";
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, User2Icon, CreditCardIcon } from "lucide-react";
import { Proposal } from "@/types/proposal";
import StatusBadge from "../detail/StatusBadge";
import { format } from "date-fns";

interface ProposalCardProps {
  proposal: Proposal;
  index: number;
  onClick: (proposal: Proposal) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, index, onClick }) => {
  const formatMoney = (amount: number) => {
    if (!amount && amount !== 0) return "₺0";
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Teklif başlığını oluştur ve kısalt
  const getProposalTitle = () => {
    if (proposal.title) {
      return shortenText(proposal.title, 30);
    }
    
    const proposalNumber = proposal.number || proposal.proposal_number;
    return `Teklif #${proposalNumber}`;
  };

  const companyName = proposal.customer?.name || proposal.customer_name || "İsimsiz Müşteri";
  const shortenedCompanyName = shortenText(companyName, 20);

  return (
    <Draggable draggableId={proposal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-75' : ''}`}
        >
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow h-full bg-white"
            onClick={() => onClick(proposal)}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-medium flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="leading-tight flex-1 min-w-0" title={proposal.title || `Teklif #${proposal.number || proposal.proposal_number}`}>
                    {getProposalTitle()}
                  </span>
                  <StatusBadge status={proposal.status} size="sm" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-xs space-y-2">
              <div className="flex items-start text-gray-600 gap-1.5">
                <User2Icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="leading-tight" title={companyName}>
                  {shortenedCompanyName}
                </span>
              </div>
              {(proposal.total_amount || proposal.total_value) && (
                <div className="flex items-start text-gray-600 gap-1.5">
                  <CreditCardIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="leading-tight">
                    {formatMoney(proposal.total_amount || proposal.total_value || 0)}
                  </span>
                </div>
              )}
              {proposal.valid_until && (
                <div className="flex items-start text-gray-600 gap-1.5">
                  <CalendarIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="leading-tight">
                    {format(new Date(proposal.valid_until), "dd.MM.yyyy")}
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

export default ProposalCard;
