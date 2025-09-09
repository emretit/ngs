
import React from "react";

interface RequestDescriptionProps {
  description?: string;
}

export const RequestDescription: React.FC<RequestDescriptionProps> = ({ description }) => {
  if (!description) return null;
  
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">Açıklama</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/20 p-3 rounded-lg">{description}</p>
    </div>
  );
};
