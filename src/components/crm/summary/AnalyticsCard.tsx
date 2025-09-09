
import { ReactNode } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  children: ReactNode;
}

const AnalyticsCard = ({
  title,
  description,
  icon,
  iconBgColor,
  iconTextColor,
  children
}: AnalyticsCardProps) => {
  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    toast.info(`${format.toUpperCase()} raporu indiriliyor...`);
  };

  return (
    <Card className="shadow-md border border-gray-200 bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`${iconBgColor} p-2 rounded-full`}>
            <div className={`h-5 w-5 ${iconTextColor}`}>{icon}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
