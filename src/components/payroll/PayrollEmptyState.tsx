import { Users, Sparkles, ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PayrollEmptyStateProps {
  onShowAllEmployees?: () => void;
  recentEmployees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

export const PayrollEmptyState = ({
  onShowAllEmployees,
  recentEmployees = [],
}: PayrollEmptyStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-md w-full text-center space-y-8 p-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Bordro Hesaplamasına Başlayın
          </h3>
          <p className="text-muted-foreground">
            Sol taraftan bir çalışan seçerek bordro hesaplama sürecini
            başlatabilirsiniz
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {recentEmployees.length > 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Son Hesaplananlar
                  </span>
                </div>
                <div className="space-y-2">
                  {recentEmployees.slice(0, 3).map((emp) => (
                    <Button
                      key={emp.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      {emp.first_name} {emp.last_name}
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Tips */}
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 text-left">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">İpucu</p>
                  <p className="text-xs text-blue-700">
                    Arama kutusunu kullanarak çalışanları hızlıca
                    bulabilirsiniz. Departman adı ile de arama
                    yapabilirsiniz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        {onShowAllEmployees && (
          <Button
            onClick={onShowAllEmployees}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Tüm Çalışanları Gör
          </Button>
        )}
      </div>
    </div>
  );
};
