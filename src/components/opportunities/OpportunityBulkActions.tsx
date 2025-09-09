
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, X, FileText, UserPlus, MessageSquare } from "lucide-react";
import { Opportunity } from '@/types/crm';
import { useToast } from '@/components/ui/use-toast';

interface OpportunityBulkActionsProps {
  selectedOpportunities: Opportunity[];
  onClearSelection: () => void;
}

const OpportunityBulkActions = ({
  selectedOpportunities,
  onClearSelection
}: OpportunityBulkActionsProps) => {
  const { toast } = useToast();
  
  const handleDelete = () => {
    // In a real app, this would delete the selected opportunities
    toast({
      title: "Silme işlemi",
      description: `${selectedOpportunities.length} fırsat silindi.`,
    });
    onClearSelection();
  };
  
  const handleExport = () => {
    toast({
      title: "Dışa aktarma",
      description: `${selectedOpportunities.length} fırsat dışa aktarıldı.`,
    });
  };
  
  const handleAssign = () => {
    toast({
      title: "Atama işlemi",
      description: `${selectedOpportunities.length} fırsat atanmaya hazır.`,
    });
  };
  
  const handleCreateTask = () => {
    toast({
      title: "Görev oluştur",
      description: `${selectedOpportunities.length} fırsat için görev oluşturulacak.`,
    });
  };

  return (
    <div className="bg-gradient-to-r from-accent/80 to-muted/60 p-4 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">
          {selectedOpportunities.length} fırsat seçildi
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateTask}
          className="flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Görev Oluştur</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAssign}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Ata</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Dışa Aktar</span>
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleDelete}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Sil</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSelection}
          className="flex items-center"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OpportunityBulkActions;
