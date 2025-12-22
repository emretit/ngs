import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const EmployeePayroll = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Puantaj ve Bordro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Puantaj ve bordro yönetimi sayfası yakında eklenecek.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeePayroll;

