
import React from "react";

interface RequestLocationProps {
  location?: string;
}

export const RequestLocation: React.FC<RequestLocationProps> = ({ location }) => {
  if (!location) return null;
  
  return (
    <div className="bg-muted/20 p-3 rounded-lg">
      <h3 className="text-xs font-medium text-muted-foreground mb-1">Konum</h3>
      <p className="text-sm font-medium">{location}</p>
    </div>
  );
};
