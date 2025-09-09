
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Customer } from "@/types/proposal";
import { Building, Mail, Phone, MapPin } from "lucide-react";

interface OrderCustomerInfoProps {
  customer: Customer | undefined;
}

const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ customer }) => {
  if (!customer) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center p-4 text-muted-foreground">
            Müşteri bilgisi bulunamadı. Lütfen müşteri seçiniz.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-base font-medium mb-3">Müşteri Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start">
              <Building className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div>
                <div className="font-medium">{customer.name}</div>
                {customer.company && (
                  <div className="text-sm text-muted-foreground">{customer.company}</div>
                )}
                {customer.tax_number && (
                  <div className="text-sm text-muted-foreground">
                    Vergi No: {customer.tax_number}
                    {customer.tax_office && ` (${customer.tax_office})`}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {customer.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            
            {customer.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
            
            {customer.address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCustomerInfo;
