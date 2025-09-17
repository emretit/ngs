import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  CheckCircle,
  Users
} from "lucide-react";

const TrustSecuritySection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Binlerce İşletmenin Güvendiği Platform
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">1000+</div>
            <p className="text-sm text-muted-foreground">Aktif İşletme</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">%99.9</div>
            <p className="text-sm text-muted-foreground">Uptime Garantisi</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">%98</div>
            <p className="text-sm text-muted-foreground">Müşteri Memnuniyeti</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">7/24</div>
            <p className="text-sm text-muted-foreground">Teknik Destek</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            SSL Şifreleme
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            KVKK Uyumlu
          </div>
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-green-600 mr-2" />
            Veri Güvenliği
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;