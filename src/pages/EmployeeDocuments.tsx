import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const EmployeeDocuments = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dökümanlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Çalışan dökümanları yönetimi sayfası yakında eklenecek.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDocuments;

