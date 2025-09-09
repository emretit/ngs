
import React from "react";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit, MessageSquare, MoreVertical, Plus, Trash } from "lucide-react";

interface RowActionsProps {
  requestId: string;
  onViewActivities: (requestId: string) => void;
  onAddActivity: (requestId: string) => void;
  onEdit: (request: any) => void;
  onDelete: (request: any) => void;
  request: any;
  onDownloadAttachment: (attachment: any) => void;
}

export function RequestRowActions({
  requestId,
  onViewActivities,
  onAddActivity,
  onEdit,
  onDelete,
  request,
  onDownloadAttachment
}: RowActionsProps) {
  return (
    <TableCell className="text-right">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewActivities(requestId);
          }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Aktiviteler
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onAddActivity(requestId);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Aktivite Ekle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEdit(request);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </DropdownMenuItem>
            {request.attachments && request.attachments.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Ekler</DropdownMenuLabel>
                {request.attachments.map((attachment: any, idx: number) => (
                  <DropdownMenuItem 
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadAttachment(attachment);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {attachment.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(request);
              }}
            >
              <Trash className="w-4 h-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  );
}
