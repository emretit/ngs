
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Phone, Globe } from "lucide-react";

const ProposalTemplateFormHeader: React.FC = () => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Şirket Adınız</CardTitle>
              <p className="text-muted-foreground">Şirket sloganınız</p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4" />
              <span>info@sirketiniz.com</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4" />
              <span>+90 212 XXX XX XX</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>www.sirketiniz.com</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold text-center">TEKLİF FORMU</h2>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalTemplateFormHeader;
