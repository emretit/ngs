
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalTemplate } from "@/types/proposal-template";
import { useProposalTemplates } from "@/hooks/proposals/useProposalTemplates";

const ProposalTemplateSelect: React.FC = () => {
  const { selectedTemplate, handleSelectTemplate } = useProposalTemplates();
  
  const templates: ProposalTemplate[] = [
    {
      id: "1",
      name: "Standart Teklif",
      description: "Genel ürün ve hizmetler için standart teklif şablonu",
      templateType: "standard",
      templateFeatures: ["Temel bilgiler", "Ürün listesi", "Ödeme koşulları"],
      items: []
    },
    {
      id: "2",
      name: "Servis Teklifi",
      description: "Teknik servis hizmetleri için özelleştirilmiş teklif şablonu",
      templateType: "service",
      templateFeatures: ["Servis detayları", "İşçilik", "Parçalar", "Garanti bilgileri"],
      items: []
    },
    {
      id: "3",
      name: "Kurumsal Teklif",
      description: "Kurumsal müşteriler için kapsamlı teklif şablonu",
      templateType: "corporate",
      templateFeatures: ["Detaylı ürün açıklamaları", "Kurumsal şartlar", "Destek detayları"],
      items: []
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teklif Şablonu</CardTitle>
        <CardDescription>
          Teklifiniz için bir şablon seçin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedTemplate?.id} 
          onValueChange={(value) => {
            const template = templates.find(t => t.id === value);
            if (template) {
              handleSelectTemplate(template);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Şablon seçin" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTemplate && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
            <p className="text-sm text-muted-foreground mb-2">{selectedTemplate.description}</p>
            <div className="text-sm">
              <span className="font-medium">Özellikler:</span>
              <ul className="list-disc list-inside mt-1">
                {selectedTemplate.templateFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalTemplateSelect;
