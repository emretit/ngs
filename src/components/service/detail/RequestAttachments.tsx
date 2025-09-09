
import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceRequestAttachment } from "@/hooks/useServiceRequests";

interface RequestAttachmentsProps {
  attachments: ServiceRequestAttachment[];
}

export const RequestAttachments: React.FC<RequestAttachmentsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        <h3 className="text-lg font-semibold">Ekler</h3>
      </div>
      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div key={index} className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{attachment.name}</span>
            </div>
            <Button variant="outline" size="sm">İndir</Button>
          </div>
        ))}
      </div>
    </div>
  );
};
