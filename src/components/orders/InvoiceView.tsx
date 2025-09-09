
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvoiceView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Bu panel, sipariş oluşturulduktan sonra e-fatura görüntüleme ve yönetimi için kullanılacaktır.
          Sipariş henüz oluşturulmadığı için e-fatura bilgileri görüntülenemiyor.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">E-Fatura Önizleme</TabsTrigger>
              <TabsTrigger value="history">Fatura Geçmişi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-md p-8 bg-gray-50">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">E-Fatura Önizleme</h3>
                  <p className="text-muted-foreground">
                    Sipariş tamamlandıktan sonra e-fatura önizlemesi burada görüntülenecektir.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                Henüz fatura geçmişi bulunmamaktadır.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceView;
