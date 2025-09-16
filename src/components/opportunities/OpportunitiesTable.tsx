
import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Opportunity, 
  opportunityStatusColors 
} from "@/types/crm";
import { OpportunityStatusCell } from "./table/OpportunityStatusCell";
import { useOpportunityStatusUpdate } from "./hooks/useOpportunityStatusUpdate";

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const OpportunitiesTable = ({
  opportunities,
  isLoading,
  onSelectOpportunity,
  searchQuery = "",
  statusFilter = "all",
  priorityFilter = null
}: OpportunitiesTableProps) => {
  const { updateOpportunityStatus } = useOpportunityStatusUpdate();

  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Firma ismini kısalt
  const getShortenedCompanyName = (companyName: string) => {
    return shortenText(companyName, 35);
  };

  // Firma şirket bilgisini kısalt
  const getShortenedCompanyInfo = (companyInfo: string) => {
    return shortenText(companyInfo, 30);
  };

  // Filter opportunities based on criteria
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = !searchQuery || 
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opportunity.description && opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opportunity.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    const matchesPriority = !priorityFilter || opportunity.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📋 Fırsat Başlığı</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Değer</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">💱</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">⚡ Öncelik</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Sorumlu</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Hedef Tarih</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturulma</TableHead>
            <TableHead className="w-[50px] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">📋 Fırsat Başlığı</TableHead>
          <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Değer</TableHead>
          <TableHead className="w-[4%] font-bold text-foreground/80 text-sm tracking-wide text-center">💱</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">⚡ Öncelik</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Sorumlu</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Hedef Tarih</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturulma</TableHead>
          <TableHead className="w-[4%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredOpportunities.length === 0 ? (
                      <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                Bu kriterlere uygun fırsat bulunamadı
              </TableCell>
            </TableRow>
        ) : (
          filteredOpportunities.map((opportunity) => (
            <TableRow key={opportunity.id} onClick={() => onSelectOpportunity(opportunity)} className="cursor-pointer hover:bg-blue-50 h-4">
              <TableCell className="font-medium py-0 px-2 text-xs">{shortenText(opportunity.title, 35)}</TableCell>
              <TableCell className="py-0 px-2">
                {opportunity.customer ? (
                  <div className="flex flex-col space-y-0">
                    <span className="text-xs font-medium" title={opportunity.customer.name}>
                      {getShortenedCompanyName(opportunity.customer.name)}
                    </span>
                    {opportunity.customer.company && (
                      <span className="text-xs text-gray-500" title={opportunity.customer.company}>
                        {getShortenedCompanyInfo(opportunity.customer.company)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-0 px-1">
                <OpportunityStatusCell 
                  status={opportunity.status}
                  opportunityId={opportunity.id}
                  onStatusChange={updateOpportunityStatus}
                />
              </TableCell>
              <TableCell className="text-center py-0 px-1 text-xs font-medium">
                {opportunity.value ? formatCurrency(opportunity.value, opportunity.currency || 'TRY') : '-'}
              </TableCell>
              <TableCell className="text-center py-0 px-0.5">
                {opportunity.currency ? (
                  <span className="text-xs font-bold text-blue-700">
                    {opportunity.currency === 'TRY' ? '₺' : 
                     opportunity.currency === 'USD' ? '$' : 
                     opportunity.currency === 'EUR' ? '€' : 
                     opportunity.currency === 'GBP' ? '£' : 
                     opportunity.currency}
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-0 px-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${
                    opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                    opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    opportunity.priority === 'low' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {opportunity.priority === 'high' && 'Yüksek'}
                  {opportunity.priority === 'medium' && 'Orta'}
                  {opportunity.priority === 'low' && 'Düşük'}
                  {!opportunity.priority && '-'}
                </Badge>
              </TableCell>
              <TableCell className="py-0 px-1">
                {opportunity.employee ? (
                  <div className="flex items-center space-x-0.5">
                    <Avatar className="h-3.5 w-3.5">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {opportunity.employee.first_name?.[0]}
                        {opportunity.employee.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">
                      {opportunity.employee.first_name} {opportunity.employee.last_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-0 px-1 text-xs">
                {opportunity.expected_close_date ? (
                  format(new Date(opportunity.expected_close_date), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-0 px-1 text-xs">
                {opportunity.created_at ? (
                  format(new Date(opportunity.created_at), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="py-0 px-1">
                <div className="flex justify-end space-x-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOpportunity(opportunity);
                    }}
                    className="h-4 w-4 hover:bg-blue-100"
                  >
                    <Eye className="h-2.5 w-2.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OpportunitiesTable;
