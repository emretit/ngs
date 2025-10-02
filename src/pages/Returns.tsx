import { useState } from "react";
import { RotateCcw, AlertCircle, CheckCircle, Clock } from "lucide-react";
interface ReturnsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const Returns = ({ isCollapsed, setIsCollapsed }: ReturnsProps) => {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bekleyen İadeler</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">İncelenen İadeler</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Onaylanan İadeler</p>
                <p className="text-2xl font-bold">15</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bu Ay Toplam</p>
                <p className="text-2xl font-bold">26</p>
              </div>
              <RotateCcw className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Son İade Talepleri</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">İADE-2024-001</p>
                    <p className="text-sm text-muted-foreground">XYZ Market - Defolu ürün</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Talep Tarihi</p>
                    <p className="font-medium">14 Ocak 2024</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                    Beklemede
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
export default Returns;