
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, FileText, MessageSquare, Phone, Mail, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ContactHistoryItem, Opportunity } from "@/types/crm";
import NewContactForm from "../NewContactForm";

interface OpportunityHistoryTabProps {
  opportunity: Opportunity;
  onAddContact: (data: Omit<ContactHistoryItem, "id">) => Promise<void>;
}

const OpportunityHistoryTab: React.FC<OpportunityHistoryTabProps> = ({ 
  opportunity,
  onAddContact
}) => {
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  const getContactIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-purple-500" />;
      case "meeting":
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSubmitContact = async (contact: Omit<ContactHistoryItem, "id">) => {
    await onAddContact(contact);
    setShowNewContactForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">İletişim Geçmişi</h3>
        <Button onClick={() => setShowNewContactForm(true)} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          İletişim Ekle
        </Button>
      </div>

      {showNewContactForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni İletişim Kaydı</CardTitle>
            <CardDescription>
              Müşteri ile yapılan görüşmeyi kaydedin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewContactForm 
              opportunityId={opportunity.id}
              onSubmit={handleSubmitContact}
              onCancel={() => setShowNewContactForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {opportunity.contact_history && opportunity.contact_history.length > 0 ? (
        <div className="space-y-4">
          {opportunity.contact_history.map((contact, index) => (
            <Card key={contact.id || index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {getContactIcon(contact.contact_type)}
                    <CardTitle className="text-base ml-2">
                      {contact.contact_type === "call" && "Telefon Görüşmesi"}
                      {contact.contact_type === "email" && "E-posta"}
                      {contact.contact_type === "meeting" && "Toplantı"}
                      {contact.contact_type === "other" && "Diğer İletişim"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    {contact.date}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{contact.notes}</div>
                {contact.employee_name && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Personel: {contact.employee_name}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto opacity-20 mb-2" />
          <p>Henüz iletişim kaydı bulunmuyor.</p>
          <p className="text-sm mt-1">
            Müşteri ile yapılan görüşmeleri buraya ekleyebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
};

export default OpportunityHistoryTab;
