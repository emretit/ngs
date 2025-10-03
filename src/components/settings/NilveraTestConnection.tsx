import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

export const NilveraTestConnection = () => {
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setTesting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı");
      }

      // Test connection by calling incoming invoices with a small date range
      const { data, error } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { 
          filters: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
            endDate: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Bağlantı Başarılı ✅",
          description: `Nilvera API'ye başarıyla bağlanıldı. ${data.invoices?.length || 0} fatura bulundu.`,
        });
      } else {
        throw new Error(data?.error || "API bağlantısı başarısız");
      }
    } catch (error: any) {
      console.error('Nilvera test error:', error);
      toast({
        variant: "destructive",
        title: "Bağlantı Hatası ❌",
        description: error.message || "Nilvera API'ye bağlanılamadı. API Key ve ayarlarınızı kontrol edin.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button
      onClick={handleTestConnection}
      disabled={testing}
      variant="outline"
      className="w-full"
    >
      {testing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Bağlantı Test Ediliyor...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Bağlantıyı Test Et
        </>
      )}
    </Button>
  );
};
