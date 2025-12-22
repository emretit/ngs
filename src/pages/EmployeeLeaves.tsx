import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const EmployeeLeaves = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            İzinler ve Haklar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            İzinler ve haklar yönetimi sayfası yakında eklenecek.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLeaves;

