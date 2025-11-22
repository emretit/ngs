import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Info } from "lucide-react";

interface InvoiceCustomerCardProps {
  customerId: string;
  selectedCustomer: any;
  customerOptions: any[];
  isLoadingCustomers: boolean;
  onCustomerChange: (customerId: string) => void;
}

const InvoiceCustomerCard: React.FC<InvoiceCustomerCardProps> = ({
  customerId,
  selectedCustomer,
  customerOptions,
  isLoadingCustomers,
  onCustomerChange,
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          Müşteri Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Müşteri *</Label>
          <Select value={customerId} onValueChange={onCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Müşteri seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCustomers ? (
                <SelectItem value="loading" disabled>
                  Müşteriler yükleniyor...
                </SelectItem>
              ) : customerOptions?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {customer.company && `- ${customer.company}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCustomer && (
            <div className="flex items-center gap-2 flex-wrap text-sm">
              {selectedCustomer.is_einvoice_mukellef ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  E-Fatura Mükellefi
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                  <Info className="h-3 w-3 mr-1" />
                  E-Fatura Değil
                </Badge>
              )}
              {selectedCustomer.tax_number && (
                <span className="text-gray-500">VKN: {selectedCustomer.tax_number}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCustomerCard;

