import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { LeaveTypesManagement } from "@/components/settings/leaves/LeaveTypesManagement";

export const LeaveTypesCard: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">İzin Türleri Yönetimi</CardTitle>
        </div>
        <CardDescription className="text-xs">
          İzin türlerini tanımlayın ve her bir tür için kurallar belirleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <LeaveTypesManagement />
      </CardContent>
    </Card>
  );
};

